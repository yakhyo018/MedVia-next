/** Mirror of the backend `treatment.enum.ts`. New and edited treatments wait for the admin (PENDING). */
export enum TreatmentStatus {
	PENDING = 'PENDING',
	ACTIVE = 'ACTIVE',
	CHANGES_REQUESTED = 'CHANGES_REQUESTED',
	REJECTED = 'REJECTED',
	HIDDEN = 'HIDDEN',
	DELETE = 'DELETE',
}

export enum TreatmentCategory {
	PIGMENTATION = 'PIGMENTATION',
	ACNE = 'ACNE',
	HYDRATION = 'HYDRATION',
	ANTI_AGING = 'ANTI_AGING',
	FILLER = 'FILLER',
	DENTAL_CARE = 'DENTAL_CARE',
	CHECK_UP = 'CHECK_UP',
	CONSULTATION = 'CONSULTATION',
}
