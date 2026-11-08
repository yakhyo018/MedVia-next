/** Mirror of the backend `face-scan.enum.ts`. A cosmetic reading — never a diagnosis. */
export enum FaceScanStatus {
	PENDING = 'PENDING',
	DONE = 'DONE',
	FAILED = 'FAILED',
	DELETE = 'DELETE',
}

/** SEE_DOCTOR: something the model may not name (naming it would be a diagnosis). */
export enum SkinConcern {
	ACNE = 'ACNE',
	REDNESS = 'REDNESS',
	PIGMENTATION = 'PIGMENTATION',
	WRINKLES = 'WRINKLES',
	DARK_CIRCLES = 'DARK_CIRCLES',
	ENLARGED_PORES = 'ENLARGED_PORES',
	SEE_DOCTOR = 'SEE_DOCTOR',
}

export enum ConcernSeverity {
	MILD = 'MILD',
	MODERATE = 'MODERATE',
	SEVERE = 'SEVERE',
}

export enum FaceZone {
	FOREHEAD = 'FOREHEAD',
	EYES = 'EYES',
	NOSE = 'NOSE',
	CHEEKS = 'CHEEKS',
	CHIN = 'CHIN',
	WHOLE_FACE = 'WHOLE_FACE',
}

/** Why a photo could not be read — the patient retakes it. */
export enum PhotoQualityIssue {
	NO_FACE = 'NO_FACE',
	MULTIPLE_FACES = 'MULTIPLE_FACES',
	LOW_LIGHT = 'LOW_LIGHT',
	BLURRY = 'BLURRY',
	BAD_ANGLE = 'BAD_ANGLE',
	MAKEUP_OR_FILTER = 'MAKEUP_OR_FILTER',
}
