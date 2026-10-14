import { BookingStatus, SlotStatus } from '../../enums/booking.enum';

/** What the clinic's schedule shows of a booking in a slot. */
export interface SlotBooking {
	bookingCode: string;
	bookingStatus: BookingStatus;
	patientName: string;
	treatmentName: string;
}

export interface Slot {
	_id: string;
	slotStatus: SlotStatus;
	slotStart: Date;
	slotBlockReason?: string | null;
	holdExpiresAt?: Date | null;
	doctorId: string;
	bookingId?: string | null;
	bookingData?: SlotBooking | null;
}

/** The clinic's week: seven Seoul days from `dateFrom` ("2026-10-14"), one doctor or all. */
export interface ClinicScheduleInquiry {
	dateFrom: string;
	doctorId?: string;
}

/** Fill a doctor's days with 30-minute slots; `days` 0 = Sunday, empty = every open day. */
export interface SlotsCreateInput {
	doctorId: string;
	dateFrom: string;
	dateTo: string;
	timeFrom: string;
	timeTo: string;
	days?: number[];
}

export interface SlotsBlockInput {
	slotIds: string[];
	blocked: boolean;
	slotBlockReason?: string;
}
