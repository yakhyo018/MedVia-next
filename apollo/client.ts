import { useMemo } from 'react';
import {
	ApolloClient,
	ApolloLink,
	HttpLink,
	InMemoryCache,
	NormalizedCacheObject,
	Observable,
	ObservableSubscription,
	from,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { getJwtToken, refreshAccessToken } from '../libs/auth';
import { REACT_APP_API_GRAPHQL_URL, UNAUTHENTICATED } from '../libs/config';
import { T } from '../libs/types/common';

let apolloClient: ApolloClient<NormalizedCacheObject>;

/**
 * Operations that create the session themselves: an UNAUTHENTICATED there is final.
 * Logout is not here on purpose — after 15 idle minutes it must refresh and retry,
 * or the refresh session would stay alive on the server.
 */
const SESSION_OPERATIONS = ['Login', 'Signup', 'GoogleLogin', 'RefreshToken'];

function getHeaders(): Record<string, string> {
	const headers: Record<string, string> = {};
	const token = getJwtToken();
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

function createIsomorphicLink() {
	/** Read on every request, so a retried operation goes out with the refreshed token. */
	const authLink = new ApolloLink((operation, forward) => {
		operation.setContext(({ headers = {} }: T) => ({
			headers: {
				...headers,
				...getHeaders(),
			},
		}));
		return forward(operation);
	});

	/** credentials: 'include' — the browser sends the httpOnly refresh cookie to the API origin. */
	const httpLink = new HttpLink({
		uri: REACT_APP_API_GRAPHQL_URL,
		credentials: 'include',
	});

	/**
	 * The access token lives 15 minutes. When the API answers UNAUTHENTICATED, refresh once
	 * (the cookie) and send the same operation again; if the refresh fails the original
	 * error goes to the caller. Errors are logged here and shown by each page's handler.
	 */
	const errorLink = onError(({ graphQLErrors, networkError, operation, forward, response }) => {
		if (graphQLErrors) {
			graphQLErrors.forEach(({ message, path, extensions }) => {
				console.log(`[GraphQL error]: Message: ${message}, Code: ${extensions?.code}, Path: ${path}`);
			});
		}
		if (networkError) console.log(`[Network error]: ${networkError}`);

		const unauthenticated = graphQLErrors?.some((err) => err.extensions?.code === UNAUTHENTICATED);
		const { retried } = operation.getContext();
		if (!unauthenticated || retried || SESSION_OPERATIONS.includes(operation.operationName) || !getJwtToken()) {
			return;
		}

		operation.setContext({ retried: true });
		return new Observable((observer) => {
			let subscription: ObservableSubscription | undefined;
			refreshAccessToken()
				.then((refreshed) => {
					if (!refreshed) {
						if (response) observer.next(response);
						observer.complete();
						return;
					}
					subscription = forward(operation).subscribe(observer);
				})
				.catch((err) => observer.error(err));
			return () => subscription?.unsubscribe();
		});
	});

	return from([errorLink, authLink, httpLink]);
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache(),
	});
}

export function initializeApollo(initialState: NormalizedCacheObject | null = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: NormalizedCacheObject | null) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
