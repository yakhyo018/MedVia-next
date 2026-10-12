import { SEOUL_TIME_ZONE } from './config';

/** 99000 → "₩99,000". KRW has no minor unit. */
export const formatKrw = (value: number | null | undefined): string => {
	if (value === null || value === undefined || Number.isNaN(value)) return '';
	return `₩${Math.round(value).toLocaleString('en-US')}`;
};

const SEOUL_DATE: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
const SEOUL_DATE_TIME: Intl.DateTimeFormatOptions = {
	...SEOUL_DATE,
	hour: '2-digit',
	minute: '2-digit',
	hour12: false,
};

/**
 * A UTC date from the API shown in Seoul time, in the reader's locale:
 * seoulTime('2026-10-12T05:00:00Z', 'en') → "Oct 12, 2026, 14:00".
 */
export const seoulTime = (value: Date | string | number, locale = 'en', withTime = true): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return new Intl.DateTimeFormat(locale, {
		...(withTime ? SEOUL_DATE_TIME : SEOUL_DATE),
		timeZone: SEOUL_TIME_ZONE,
	}).format(date);
};

/** "Feride Karimova" → "FK" (avatar placeholder). */
export const initials = (fullName: string | undefined): string =>
	(fullName ?? '')
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('');

/** "Feride Karimova" → "Feride K." (the header shows this). */
export const shortName = (fullName: string | undefined): string => {
	const [first, last] = (fullName ?? '').split(/\s+/).filter(Boolean);
	return last ? `${first} ${last[0].toUpperCase()}.` : (first ?? '');
};

/** An uploaded path ("uploads/member/x.jpg") becomes an API URL; a Google photo URL stays as it is. */
export const imageUrl = (path: string | undefined, apiUrl: string): string => {
	if (!path) return '';
	return /^https?:\/\//.test(path) ? path : `${apiUrl}/${path.replace(/^\//, '')}`;
};

/** 1234 → "1.2k", 980 → "980" (card counters). */
export const formatCount = (value: number | null | undefined): string => {
	const n = value ?? 0;
	if (n < 1000) return String(n);
	if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
	return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
};
