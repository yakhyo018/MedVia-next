/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	// `yarn build:check` builds into .next-check, so it can run while `yarn dev` holds .next/.
	distDir: process.env.NEXT_DIST_DIR || '.next',
	env: {
		REACT_APP_API_URL: process.env.REACT_APP_API_URL,
		REACT_APP_API_GRAPHQL_URL: process.env.REACT_APP_API_GRAPHQL_URL,
		REACT_APP_API_WS: process.env.REACT_APP_API_WS,
		REACT_APP_GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID,
	},
};

const { i18n } = require('./next-i18next.config');
nextConfig.i18n = i18n;

module.exports = nextConfig;
