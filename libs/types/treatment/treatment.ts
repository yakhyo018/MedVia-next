import { Specialty } from '../../enums/clinic.enum';

/** The treatment fields the client reads so far (the doctor page). Grows with the clinic page. */
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
