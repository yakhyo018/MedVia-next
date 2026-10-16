/** Mirrors of the backend `notice.enum.ts` and `inquiry.enum.ts`. */
export enum NoticeCategory {
	NOTICE = 'NOTICE',
	FAQ = 'FAQ',
}

/** The FAQ groups and the 1:1 inquiry topics share one list. */
export enum InquiryCategory {
	BOOKING = 'BOOKING',
	PAYMENT = 'PAYMENT',
	INTERPRETER = 'INTERPRETER',
	MEDICAL_DATA = 'MEDICAL_DATA',
	ACCOUNT = 'ACCOUNT',
}

/** NEW → IN_PROGRESS → ANSWERED (the team replied) → RESOLVED (closed). */
export enum InquiryStatus {
	NEW = 'NEW',
	IN_PROGRESS = 'IN_PROGRESS',
	ANSWERED = 'ANSWERED',
	RESOLVED = 'RESOLVED',
}

export enum InquirySender {
	PATIENT = 'PATIENT',
	ADMIN = 'ADMIN',
}

/** HOLD = a draft only admins see; ACTIVE = published. */
export enum NoticeStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
