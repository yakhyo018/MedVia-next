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
