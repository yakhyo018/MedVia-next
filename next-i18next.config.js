/** Patients read RU / UZ / KK, clinics KO; EN is the fallback for everyone. */
module.exports = {
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'ru', 'uz', 'kk', 'ko'],
		localeDetection: false,
	},
	// Every locale carries every key (`yarn i18n:check`) and the keys are the English sentences,
	// so a page does not ship the English file as a fallback next to its own (half the page data).
	fallbackLng: false,
	// Keys are the English sentences ("Welcome back."), so a dot or colon is text, not a path.
	keySeparator: false,
	nsSeparator: false,
	trailingSlash: true,
	reloadOnPrerender: process.env.NODE_ENV === 'development',
};
