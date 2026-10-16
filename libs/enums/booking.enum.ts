/** Mirrors the backend's booking enums (value equals name). */
export enum BookingStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	DECLINED = 'DECLINED',
	EXPIRED = 'EXPIRED',
	CANCELLED = 'CANCELLED',
	COMPLETED = 'COMPLETED',
	NO_SHOW = 'NO_SHOW',
}

export enum BookingConsentType {
	/** Required: share the answers with this clinic and doctor. */
	SHARE_DATA = 'SHARE_DATA',
	/** Required: the booking and cancellation terms. */
	BOOKING_TERMS = 'BOOKING_TERMS',
	/** Optional: a Korean AI summary of the answers for the doctor. */
	AI_SUMMARY = 'AI_SUMMARY',
}

/** "My Bookings" tabs. */
export enum BookingTab {
	UPCOMING = 'UPCOMING',
	PAST = 'PAST',
	CANCELLED = 'CANCELLED',
}

/** A doctor's 30-minute slot. HELD = reserved for 10 minutes while a patient fills the request. */
export enum SlotStatus {
	OPEN = 'OPEN',
	HELD = 'HELD',
	BOOKED = 'BOOKED',
	BLOCKED = 'BLOCKED',
}
