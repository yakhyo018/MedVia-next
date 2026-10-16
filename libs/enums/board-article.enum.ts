/** Mirrors the backend's BoardArticleCategory. */
export enum BoardArticleCategory {
	QNA = 'QNA',
	HEALTH_TIP = 'HEALTH_TIP',
	FREE = 'FREE',
}

export enum BoardArticleStatus {
	ACTIVE = 'ACTIVE',
	HIDDEN = 'HIDDEN',
	DELETE = 'DELETE',
}

/** Mirror of the backend `report.enum.ts`. */
export enum ReportGroup {
	ARTICLE = 'ARTICLE',
	COMMENT = 'COMMENT',
}

export enum ReportReason {
	SPAM = 'SPAM',
	ADVERTISING = 'ADVERTISING',
	MEDICAL_MISINFORMATION = 'MEDICAL_MISINFORMATION',
	PERSONAL_DATA = 'PERSONAL_DATA',
	ABUSE = 'ABUSE',
	OTHER = 'OTHER',
}

/** PENDING is the moderation queue; a decision closes every pending report of the target. */
export enum ReportStatus {
	PENDING = 'PENDING',
	RESOLVED = 'RESOLVED',
	DISMISSED = 'DISMISSED',
}

export enum ModerationDecision {
	HIDE = 'HIDE',
	SHOW = 'SHOW',
}
