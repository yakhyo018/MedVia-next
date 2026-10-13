import Router from 'next/router';
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
	// After logout a failing query must not try to refresh (and then reset userVar) while leaving.
	if (leaving) return Promise.resolve(false);
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
		const restored = await refreshAccessToken();
		if (restored) await refetchViewerQueries();
		return restored;
	} finally {
		sessionReadyVar(true);
	}
};

/**
 * A page's first queries can leave before the session is back (they go out as a guest), so
 * their viewer fields — meLiked, meFollowed — come back empty. Once the member is known, the
 * queries on screen run once more with the token.
 */
const refetchViewerQueries = async () => {
	try {
		await initializeApollo().refetchQueries({ include: 'active' });
	} catch (err) {
		console.log('refetch after sign-in failed:', (err as Error).message);
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
		memberAiConsentAt: member.memberAiConsentAt ? String(member.memberAiConsentAt) : '',
	});
};

/**************************
 *         LOGOUT         *
 *************************/

/**
 * After a logout every tab goes to the home page, in its current language ("/" or "/ru/").
 * A full load, not a client push: it also empties every in-memory store (Apollo, userVar).
 */
const goHome = () => {
	const locale = Router.locale;
	window.location.assign(locale && locale !== Router.defaultLocale ? `/${locale}/` : '/');
};

/** Set once the page is leaving for home after a logout: no refresh may revive the session. */
let leaving = false;

/**
 * Logout's last step. Only the token and the session hint are dropped — not `userVar`: emptying
 * it would re-render the current page as a guest for the moment before the browser leaves, and a
 * signed-in-only page (/notifications, My Bookings, chat) would flash its "Please log in" prompt.
 * The full page load to home empties every in-memory store anyway.
 */
const leaveForHome = () => {
	leaving = true;
	setJwtToken('');
	storage.remove(SESSION_HINT);
	goHome();
};

/** Ends this device's session on the API, then tells the other tabs to follow. */
export const logOut = async (): Promise<void> => {
	try {
		const apolloClient = initializeApollo();
		await apolloClient.mutate({ mutation: LOGOUT, fetchPolicy: 'no-cache' });
	} catch (err) {
		// An already-expired session is still a logout on this side.
		console.log('logout err:', (err as Error).message);
	} finally {
		storage.set(LOGOUT_EVENT, Date.now().toString());
		leaveForHome();
	}
};

/**
 * The `storage` event fires in every other tab of this origin when one tab writes a key.
 * Logout there → drop the session here and go home; login there → pick it up from the shared cookie.
 */
export const listenSessionEvents = (): (() => void) => {
	const onStorage = async (event: StorageEvent) => {
		if (event.key === LOGOUT_EVENT) {
			leaveForHome();
		} else if (event.key === LOGIN_EVENT) {
			if (await refreshAccessToken()) await refetchViewerQueries();
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
