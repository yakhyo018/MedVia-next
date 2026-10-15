/** Mirror of the backend `batch.enum.ts`: the batch's scheduled runs, shown on the admin dashboard. */
export enum BatchName {
	SLOT_RELEASE = 'SLOT_RELEASE',
	RECOUNT = 'RECOUNT',
	RANK = 'RANK',
}

export enum BatchStatus {
	RUNNING = 'RUNNING',
	SUCCESS = 'SUCCESS',
	FAILED = 'FAILED',
}
