/** Mirror of the backend `review.enum.ts`. */
export enum ReviewStatus {
	PENDING = 'PENDING',
	ACTIVE = 'ACTIVE',
	EDIT_REQUESTED = 'EDIT_REQUESTED',
	HIDDEN = 'HIDDEN',
	DELETE = 'DELETE',
}

/** "What went well" — at most four, one of each. */
export enum ReviewTag {
	EXPLANATION = 'EXPLANATION',
	PRICE_MATCHED = 'PRICE_MATCHED',
	INTERPRETER = 'INTERPRETER',
	CLEANLINESS = 'CLEANLINESS',
}

/** Why the admin asked for an edit or hid a review (the medical-ad rules). */
export enum ReviewFlag {
	GUARANTEED_RESULT = 'GUARANTEED_RESULT',
	SUPERLATIVE_CLAIM = 'SUPERLATIVE_CLAIM',
	PRICE_DISPUTE = 'PRICE_DISPUTE',
	BEFORE_AFTER_PHOTO = 'BEFORE_AFTER_PHOTO',
	CLINIC_COMPARISON = 'CLINIC_COMPARISON',
	PERSONAL_DATA = 'PERSONAL_DATA',
}
