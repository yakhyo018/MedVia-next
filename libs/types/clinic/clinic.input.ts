import { District, Specialty } from '../../enums/clinic.enum';
import { Direction, Language } from '../../enums/common.enum';

/** The backend's `availableClinicSorts`. */
export type ClinicSort =
	| 'createdAt'
	| 'clinicName'
	| 'clinicMinPrice'
	| 'clinicLikes'
	| 'clinicFollowers'
	| 'clinicViews'
	| 'clinicRating'
	| 'clinicScore';

interface CISearch {
	/** Clinic name or treatment name. */
	text?: string;
	specialty?: Specialty;
	districts?: District[];
	/** Clinics that speak or interpret at least one of these. */
	langs?: Language[];
	priceMin?: number;
	priceMax?: number;
	/** Only clinics with an interpreter. */
	interpreter?: boolean;
}

export interface ClinicsInquiry {
	page: number;
	limit: number;
	sort?: ClinicSort;
	direction?: Direction;
	search?: CISearch;
}
