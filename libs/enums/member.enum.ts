/** Mirror of the backend `member.enum.ts`: string enums, value equals name. */
export enum MemberType {
	USER = 'USER', // patient
	AGENT = 'AGENT', // clinic account
	DOCTOR = 'DOCTOR',
	ADMIN = 'ADMIN',
}

export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	BLOCK = 'BLOCK',
	DELETE = 'DELETE',
}

export enum MemberAuthType {
	EMAIL = 'EMAIL',
	GOOGLE = 'GOOGLE',
}
