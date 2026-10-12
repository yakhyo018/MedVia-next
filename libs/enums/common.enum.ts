/** The backend `Language` enum. ZH exists there (Assistant) but has no locale here. */
export enum Language {
	KO = 'KO',
	EN = 'EN',
	RU = 'RU',
	UZ = 'UZ',
	KK = 'KK',
}

/** The backend sends `Direction` as numbers: ASC = 1, DESC = -1. */
export enum Direction {
	ASC = 1,
	DESC = -1,
}
