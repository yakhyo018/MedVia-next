import { ApolloError } from '@apollo/client';
import { initializeApollo } from '../../apollo/client';
import { EMPTY_USER, sessionReadyVar, userVar } from '../../apollo/store';
import { LOGIN, LOGOUT, REFRESH_TOKEN, SIGN_UP } from '../../apollo/user/mutation';
import { GET_MY_PROFILE } from '../../apollo/user/query';
import { Member } from '../types/member/member';
import { MemberInput } from '../types/member/member.input';
import { UNAUTHENTICATED } from '../config';

/**
 * The access token lives only in this module variable: never in localStorage, where any
 * injected script could read it. A reload loses it, and restoreSession() gets a new one
 * from the httpOnly refresh cookie that page JavaScript cannot see.
 */
let accessToken = '';

/** localStorage keys. They hold timestamps and a flag — never a token. */
const LOGIN_EVENT = 'login';
const LOGOUT_EVENT = 'logout';
const SESSION_HINT = 'medvia:session';
/** Web Locks name: one refresh at a time across every tab of this origin. */
const REFRESH_LOCK = 'medvia:refresh';

export function getJwtToken(): string {
	return accessToken;
}

function setJwtToken(token: string) {
	accessToken = token;
}

const storage = {
	get: (key: string) => {
		try {
			return window.localStorage.getItem(key);
		} catch {
			return null;
		}
	},
	set: (key: string, value: string) => {
		try {
			window.localStorage.setItem(key, value);
		} catch {
			/* private mode: cross-tab signals are lost, the session still works */
		}
	},
	remove: (key: string) => {
		try {
			window.localStorage.removeItem(key);
		} catch {
			/* see set() */
		}
	},
};

/**************************
 *     LOGIN / SIGNUP     *
 *************************/

/** Throws the server's message (e.g. "Wrong email or password!"); the page shows it. */
export const logIn = async (memberEmail: string, memberPassword: string): Promise<void> => {
	const apolloClient = initializeApollo();
	const result = await apolloClient.mutate({
		mutation: LOGIN,
		variables: { input: { memberEmail, memberPassword } },
		fetchPolicy: 'no-cache', // the response carries the access token: keep it out of the cache
	});
	startSession(result?.data?.login);
	storage.set(LOGIN_EVENT, Date.now().toString());
};

export const signUp = async (input: MemberInput): Promise<void> => {
	const apolloClient = initializeApollo();
	const result = await apolloClient.mutate({
		mutation: SIGN_UP,
		variables: { input },
		fetchPolicy: 'no-cache',
	});
	startSession(result?.data?.signup);
	storage.set(LOGIN_EVENT, Date.now().toString());
};

/**************************
 *        REFRESH         *
 *************************/

let refreshing: Promise<boolean> | null = null;

/**
 * The API rotates the refresh token on every use and treats a replay as theft (after a
 * 10-second grace). So two refreshes must never race: requests in this tab share one
 * promise, and tabs queue behind a Web Lock — the second tab then sends the cookie the
 * first one already rotated.
 */
export const refreshAccessToken = (): Promise<boolean> => {
	if (!refreshing) {
		refreshing = withRefreshLock(requestRefresh).finally(() => {
			refreshing = null;
		});
	}
	return refreshing;
};

const withRefreshLock = async (fn: () => Promise<boolean>): Promise<boolean> => {
	if (typeof navigator !== 'undefined' && navigator.locks) {
		return await navigator.locks.request(REFRESH_LOCK, fn);
	}
	return await fn();
};

const requestRefresh = async (): Promise<boolean> => {
	const apolloClient = initializeApollo();
	try {
		const result = await apolloClient.mutate({ mutation: REFRESH_TOKEN, fetchPolicy: 'no-cache' });
		const member: Member | undefined = result?.data?.refreshToken;
		if (!member?.accessToken) throw new Error('No access token');
		startSession(member);
		return true;
	} catch (err) {
		console.log('refresh failed:', (err as Error).message);
		// Only the API saying "no session" forgets the hint; a network error is retried on the next load.
		const ended = (err as ApolloError).graphQLErrors?.some((e) => e.extensions?.code === UNAUTHENTICATED);
		clearSession(!ended);
		return false;
	}
};

/**
 * On page load: a reload emptied the memory, the cookie may still hold a session.
 * A browser that never logged in skips the request (no hint), so guests cost nothing.
 */
export const restoreSession = async (): Promise<boolean> => {
	try {
		if (!storage.get(SESSION_HINT)) return false;
		return await refreshAccessToken();
	} finally {
		sessionReadyVar(true);
	}
};

/**************************
 *        PROFILE         *
 *************************/

/** After the member changes their profile: read it again from the API. */
export const updateUserInfo = async (): Promise<void> => {
	const apolloClient = initializeApollo();
	const result = await apolloClient.query({ query: GET_MY_PROFILE, fetchPolicy: 'network-only' });
	const member: Member | undefined = result?.data?.getMyProfile;
	if (member) fillUserInfo(member);
};

const fillUserInfo = (member: Member) => {
	userVar({
		_id: member._id,
		memberType: member.memberType,
		memberStatus: member.memberStatus,
		memberAuthType: member.memberAuthType,
		memberEmail: member.memberEmail,
		memberFullName: member.memberFullName,
		memberPhone: member.memberPhone ?? '',
		memberImage: member.memberImage ?? '',
		memberLang: member.memberLang,
		memberMustChangePassword: member.memberMustChangePassword,
	});
};

/**************************
 *         LOGOUT         *
 *************************/

/** Ends this device's session on the API, then tells the other tabs to follow. */
export const logOut = async (): Promise<void> => {
	try {
		const apolloClient = initializeApollo();
		await apolloClient.mutate({ mutation: LOGOUT, fetchPolicy: 'no-cache' });
	} catch (err) {
		// An already-expired session is still a logout on this side.
		console.log('logout err:', (err as Error).message);
	} finally {
		clearSession();
		storage.set(LOGOUT_EVENT, Date.now().toString());
		window.location.reload();
	}
};

/**
 * The `storage` event fires in every other tab of this origin when one tab writes a key.
 * Logout there → drop the session here; login there → pick it up from the shared cookie.
 */
export const listenSessionEvents = (): (() => void) => {
	const onStorage = async (event: StorageEvent) => {
		if (event.key === LOGOUT_EVENT) {
			clearSession();
			await initializeApollo().clearStore();
		} else if (event.key === LOGIN_EVENT) {
			await refreshAccessToken();
		}
	};
	window.addEventListener('storage', onStorage);
	return () => window.removeEventListener('storage', onStorage);
};

/**************************
 *        HELPERS         *
 *************************/

const startSession = (member: Member | undefined) => {
	if (!member?.accessToken) throw new Error('No access token');
	setJwtToken(member.accessToken);
	fillUserInfo(member);
	storage.set(SESSION_HINT, '1');
};

const clearSession = (keepHint = false) => {
	setJwtToken('');
	userVar(EMPTY_USER);
	if (!keepHint) storage.remove(SESSION_HINT);
};
