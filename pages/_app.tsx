import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { appWithTranslation } from 'next-i18next';
import { light } from '../scss/MaterialTheme';
import { useApollo } from '../apollo/client';
import { listenSessionEvents, restoreSession } from '../libs/auth';
import useLiveSocket from '../libs/hooks/useLiveSocket';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';

const theme = createTheme(light);

/** The live socket needs the Apollo client, so it mounts inside the provider. */
const LiveSocket = () => {
	useLiveSocket();
	return null;
};

const App = ({ Component, pageProps }: AppProps) => {
	const client = useApollo(pageProps.initialApolloState ?? null);

	/** LIFECYCLES **/
	useEffect(() => {
		// The access token lives in memory only: after a reload it comes back from the refresh cookie.
		restoreSession();
		return listenSessionEvents();
	}, []);

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<LiveSocket />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
