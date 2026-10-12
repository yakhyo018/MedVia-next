/** Patients read RU / UZ / KK, clinics KO; EN is the fallback for everyone. */
module.exports = {
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'ru', 'uz', 'kk', 'ko'],
		localeDetection: false,
	},
	// Keys are the English sentences ("Welcome back."), so a dot or colon is text, not a path.
	keySeparator: false,
	nsSeparator: false,
	trailingSlash: true,
	reloadOnPrerender: process.env.NODE_ENV === 'development',
};
