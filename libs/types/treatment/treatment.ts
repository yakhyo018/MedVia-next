import { Specialty } from '../../enums/clinic.enum';
import { Language } from '../../enums/common.enum';
import { TreatmentCategory, TreatmentStatus } from '../../enums/treatment.enum';
import { Doctor } from '../doctor/doctor';

/** A change to a live treatment, waiting for the admin; the live one stays bookable meanwhile. */
export interface TreatmentDraft {
	treatmentName?: string;
	treatmentCategory?: TreatmentCategory;
	treatmentPrice?: number;
	treatmentPriceNote?: string;
	treatmentDesc?: string;
	treatmentImages?: string[];
	submittedAt: Date;
}

/** The treatment fields the client reads (public pages; the clinic dashboard reads the rest). */
export interface Treatment {
	_id: string;
	treatmentStatus?: TreatmentStatus;
	treatmentName: string;
	treatmentCategory?: string;
	/** minutes */
	treatmentDuration: number;
	treatmentPrice: number;
	treatmentPriceNote?: string;
	treatmentDesc?: string;
	treatmentAftercare?: string;
	treatmentLangs?: Language[];
	treatmentImages?: string[];
	treatmentReviewNote?: string | null;
	treatmentDraft?: TreatmentDraft | null;
	/** Requests this month (the clinic's table). */
	treatmentBookingsMonth?: number | null;
	doctorIds?: string[];
	clinicId?: string;
	/** The doctors who perform it (only ACTIVE ones on public pages). */
	doctors?: Pick<Doctor, '_id' | 'doctorName'>[];
	/** The admin's queue: whose treatment it is. */
	clinicData?: { _id: string; clinicName: string } | null;
	submittedAt?: Date;
}

export interface ClinicTreatmentsInquiry {
	clinicId: string;
	/** Only the treatments this doctor performs. */
	doctorId?: string;
}

/** One row of "Trending treatments": a treatment name across live clinics. */
export interface TrendingTreatment {
	treatmentName: string;
	treatmentCategory: string;
	specialty: Specialty;
	minPrice: number;
	/** Requests of the last 30 days. */
	bookings: number;
	clinics: number;
}

export interface TreatmentCreateInput {
	treatmentName: string;
	treatmentCategory: TreatmentCategory;
	/** minutes, a multiple of 30 */
	treatmentDuration: number;
	treatmentPrice: number;
	treatmentPriceNote?: string;
	treatmentDesc?: string;
	treatmentAftercare?: string;
	treatmentLangs?: Language[];
	treatmentImages?: string[];
	doctorIds: string[];
}

export interface TreatmentUpdate extends Partial<TreatmentCreateInput> {
	treatmentId: string;
}
