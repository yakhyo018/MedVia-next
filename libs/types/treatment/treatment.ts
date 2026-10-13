import { Specialty } from '../../enums/clinic.enum';
import { Doctor } from '../doctor/doctor';

/** The treatment fields the client reads (the doctor and clinic pages). */
export interface Treatment {
	_id: string;
	treatmentName: string;
	treatmentCategory?: string;
	/** minutes */
	treatmentDuration: number;
	treatmentPrice: number;
	treatmentPriceNote?: string;
	treatmentDesc?: string;
	doctorIds?: string[];
	clinicId?: string;
	/** The doctors who perform it (only ACTIVE ones on public pages). */
	doctors?: Pick<Doctor, '_id' | 'doctorName'>[];
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
