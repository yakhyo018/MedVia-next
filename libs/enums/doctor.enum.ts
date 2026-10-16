/** Mirror of the backend `doctor.enum.ts`. A doctor is public only while doctor and clinic are ACTIVE. */
export enum DoctorStatus {
	ACTIVE = 'ACTIVE',
	HIDDEN = 'HIDDEN',
	SUSPENDED = 'SUSPENDED',
	DELETE = 'DELETE',
}
