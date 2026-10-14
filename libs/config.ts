import { Language } from './enums/common.enum';

export const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}`;
export const REACT_APP_API_GRAPHQL_URL = `${process.env.REACT_APP_API_GRAPHQL_URL}`;
export const REACT_APP_API_WS = `${process.env.REACT_APP_API_WS}`;

/** Every time the patient sees is Seoul time; the API stores UTC. */
export const SEOUL_TIME_ZONE = 'Asia/Seoul';

/** Same limits as the backend's MemberInput (bcrypt reads at most 72 bytes). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;
export const FULL_NAME_MIN = 2;
export const FULL_NAME_MAX = 60;
export const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{5,19}$/;
/** The API's largest page (`@Max(50)` on every list inquiry): a "Show more" list stops there. */
export const LIST_MAX = 50;

/** The API takes a review up to 30 days after the visit was completed, once per booking. */
export const REVIEW_WINDOW_DAYS = 30;
export const REVIEW_MIN = 10;
export const REVIEW_MAX = 2000;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Server texts: the same strings as the backend's `Messages` enum (only those the client checks). */
export enum Messages {
	SOMETHING_WENT_WRONG = 'Something went wrong!',
	NOT_AUTHENTICATED = 'You are not authenticated, login first!',
	BLOCKED_USER = 'You have been blocked, please contact support!',
	WRONG_CREDENTIALS = 'Wrong email or password!',
	USED_EMAIL = 'This email address is already registered!',
	TERMS_REQUIRED = 'Please accept the Terms of Use and Privacy Policy!',
	SESSION_EXPIRED = 'Your session has expired, please log in again!',
	SLOT_NOT_AVAILABLE = 'This time is no longer available, please choose another one!',
	SLOT_TOO_SOON = 'This time starts too soon to book, please choose a later one!',
	HOLD_EXPIRED = 'Your reserved time has expired, please choose the time again!',
	CONSENT_REQUIRED = 'Please give the required consents to send the request!',
	TOO_MANY_REQUESTS = 'You already have 3 requests waiting for clinics!',
	CANCEL_TOO_LATE = 'A confirmed booking can be cancelled up to 24 hours before the visit!',
	TRANSITION_NOT_ALLOWED = 'This booking cannot be changed this way!',
}

/** Client texts: i18n keys in `common.json`. */
export enum ClientMessages {
	LOGIN_REQUIRED = 'Please log in first!',
	FILL_ALL_INPUTS = 'Please fill in all required fields!',
	EMAIL_INVALID = 'Please enter a valid email address!',
	PASSWORD_TOO_SHORT = 'Password must be at least 8 characters!',
	FULL_NAME_INVALID = 'Full name must be 2 to 60 characters!',
	PHONE_INVALID = 'Please enter a valid phone number!',
	TERMS_REQUIRED = 'Please accept the Terms of Use and Privacy Policy!',
	PATIENTS_ONLY = 'Only patient accounts can do this!',
	IMAGE_TYPE = 'Please choose a JPG, PNG or WEBP image!',
	IMAGE_TOO_BIG = 'The image must be 5 MB or smaller!',
	UPLOAD_FAILED = 'Upload failed, please try again!',
	PASSWORDS_DIFFERENT = 'The two passwords are different!',
}

/** The GraphQL error code the API returns for a missing, expired or revoked access token. */
export const UNAUTHENTICATED = 'UNAUTHENTICATED';

/** The five site languages: URL locale, the API's Language value, and the name in that language. */
export const LANGUAGES: { locale: string; code: Language; label: string }[] = [
	{ locale: 'en', code: Language.EN, label: 'English' },
	{ locale: 'ru', code: Language.RU, label: 'Русский' },
	{ locale: 'uz', code: Language.UZ, label: 'Oʻzbek' },
	{ locale: 'kk', code: Language.KK, label: 'Қазақ' },
	{ locale: 'ko', code: Language.KO, label: '한국어' },
];

export const localeToLanguage = (locale: string | undefined): Language =>
	LANGUAGES.find((lang) => lang.locale === locale)?.code ?? Language.EN;

/**
 * Photos, free under the Unsplash License (credit given on the page). Served from the
 * Unsplash CDN for now; `?w=` asks the CDN for a resized copy.
 */
const unsplash = (id: string, width: number) =>
	`https://images.unsplash.com/${id}?auto=format&fit=crop&q=75&w=${width}`;

export const IMAGES = {
	/** From MedVia-design/landing-with-photos (the approved landing sample). */
	hero: { src: '/img/hero.jpg', credit: '' },
	login: { src: unsplash('photo-1786801525028-5be8739f4ae5', 1000), credit: 'Emma Gasseau-Dryer' },
	signup: { src: unsplash('photo-1584516150909-c43483ee7932', 1000), credit: 'National Cancer Institute' },
};
