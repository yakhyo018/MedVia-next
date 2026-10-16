/**
 * Every locale must carry every key of English, namespace by namespace: next-i18next runs with
 * `fallbackLng: false`, so a missing key would show the raw key. Plural keys compare by their
 * base ("{{count}} min_one" → "{{count}} min") — Russian has more forms, Korean fewer.
 * Exit code 1 lists what is missing.
 */
const fs = require('fs');
const path = require('path');

const LOCALES = path.join(__dirname, '..', 'public', 'locales');
const PLURAL = /_(zero|one|two|few|many|other)$/;
const base = (key) => key.replace(PLURAL, '');
const read = (locale, file) => JSON.parse(fs.readFileSync(path.join(LOCALES, locale, file), 'utf8'));

let missing = 0;
for (const file of fs.readdirSync(path.join(LOCALES, 'en'))) {
	const english = new Set(Object.keys(read('en', file)).map(base));
	for (const locale of fs.readdirSync(LOCALES).filter((name) => name !== 'en')) {
		const target = fs.existsSync(path.join(LOCALES, locale, file)) ? read(locale, file) : {};
		const have = new Set(Object.keys(target).map(base));
		const lost = [...english].filter((key) => !have.has(key));
		if (lost.length) {
			missing += lost.length;
			console.log(`${locale}/${file}: ${lost.length} missing`);
			lost.slice(0, 20).forEach((key) => console.log(`  - ${key}`));
		}
	}
}
console.log(missing ? `${missing} keys missing` : 'i18n: every locale has every key');
process.exit(missing ? 1 : 0);
