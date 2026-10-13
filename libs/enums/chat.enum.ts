/** Mirrors the backend's chat enums. */
export enum MessageType {
	TEXT = 'TEXT',
	SYSTEM = 'SYSTEM',
}

/** The chat is between the patient and the clinic account; doctors do not write in it. */
export enum SenderType {
	PATIENT = 'PATIENT',
	CLINIC = 'CLINIC',
	SYSTEM = 'SYSTEM',
}

/** PENDING being translated · DONE translated · FAILED retried on the next read · SKIPPED none needed (or no AI consent). */
export enum TranslationStatus {
	PENDING = 'PENDING',
	DONE = 'DONE',
	FAILED = 'FAILED',
	SKIPPED = 'SKIPPED',
}
