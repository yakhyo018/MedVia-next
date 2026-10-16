import { BookingConsentType, BookingStatus, BookingTab } from '../../enums/booking.enum';
import { Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';
import { Clinic } from '../clinic/clinic';
import { Doctor } from '../doctor/doctor';
import { Treatment } from '../treatment/treatment';

/** holdSlots: the treatment's consecutive slots, reserved for this patient for 10 minutes. */
export interface SlotHold {
	slotIds: string[];
	slotStart: Date;
	holdExpiresAt: Date;
}

export interface QuestionAnswer {
	question: string;
	answer: string;
}

export interface StatusChange {
	status: BookingStatus;
	reason?: string | null;
	changedAt: Date;
}

export interface Booking {
	_id: string;
	bookingCode: string;
	bookingStatus: BookingStatus;
	bookingDate: Date;
	bookingPrice: number;
	bookingLang: Language;
	bookingInterpreter?: Language | null;
	bookingDeclineReason?: string | null;
	/** PENDING turns into EXPIRED after this. */
	respondDeadline: Date;
	completedAt?: Date | null;
	bookingReviewed?: boolean | null;
	/** The clinic's view: the answers (decrypted only for this clinic and its doctor) and the Korean AI summary. */
	bookingQuestionnaire?: { answers: QuestionAnswer[]; originalLang: Language } | null;
	bookingAiSummary?: string | null;
	bookingHistory?: StatusChange[];
	/** "Timur A." — the clinic sees the short name. */
	patientName?: string | null;
	memberId?: string;
	clinicId: string;
	doctorId: string;
	treatmentId: string;
	createdAt: Date;
	clinicData?: Pick<Clinic, '_id' | 'clinicName' | 'clinicDistrict' | 'clinicImages' | 'clinicLocation'>;
	doctorData?: Pick<Doctor, '_id' | 'doctorName'>;
	treatmentData?: Pick<Treatment, '_id' | 'treatmentName' | 'treatmentDuration'>;
}

export interface Bookings {
	list: Booking[];
	metaCounter: TotalCounter[];
}

export interface AvailableSlotsInquiry {
	treatmentId: string;
	doctorId: string;
	/** A Seoul calendar day, "2026-10-14". */
	date: string;
}

export interface SlotHoldInput {
	treatmentId: string;
	doctorId: string;
	slotStart: Date;
}

export interface BookingCreateInput {
	treatmentId: string;
	doctorId: string;
	slotStart: Date;
	bookingLang: Language;
	bookingInterpreter?: Language;
	questionnaire: { answers: QuestionAnswer[]; originalLang: Language };
	consents: { consentType: BookingConsentType; agreed: boolean }[];
}

export interface BookingsInquiry {
	page: number;
	limit: number;
	tab?: BookingTab;
	bookingStatus?: BookingStatus;
	/** The clinic's filters. */
	doctorId?: string;
	memberId?: string;
	/** Patient name or booking code. */
	search?: string;
}

export interface BookingStatusUpdate {
	bookingId: string;
	bookingStatus: BookingStatus;
	/** Required when the clinic declines or cancels. */
	reason?: string;
}
