/** The backend `Language` enum. ZH exists there (Assistant) but has no locale here. */
export enum Language {
	KO = 'KO',
	EN = 'EN',
	RU = 'RU',
	UZ = 'UZ',
	KK = 'KK',
}

/**
 * The backend's enum holds numbers (ASC = 1, DESC = -1) for MongoDB's $sort, but GraphQL
 * exposes an enum by its NAMES — the client sends "DESC", never -1.
 */
export enum Direction {
	ASC = 'ASC',
	DESC = 'DESC',
}
