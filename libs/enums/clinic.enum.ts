/** Mirror of the backend `clinic.enum.ts`. */
export enum ClinicStatus {
	PENDING = 'PENDING',
	ACTIVE = 'ACTIVE',
	CHANGES_REQUESTED = 'CHANGES_REQUESTED',
	REJECTED = 'REJECTED',
	SUSPENDED = 'SUSPENDED',
	DELETE = 'DELETE',
}

export enum Specialty {
	DERMATOLOGY = 'DERMATOLOGY',
	PLASTIC_SURGERY = 'PLASTIC_SURGERY',
	DENTAL = 'DENTAL',
	CHECK_UP = 'CHECK_UP',
}

/** Seoul districts (gu) the portfolio covers. */
export enum District {
	GANGNAM = 'GANGNAM',
	SEOCHO = 'SEOCHO',
	JUNG = 'JUNG',
	MAPO = 'MAPO',
	YONGSAN = 'YONGSAN',
	JONGNO = 'JONGNO',
	SONGPA = 'SONGPA',
}
