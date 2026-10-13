import { Specialty } from '../../enums/clinic.enum';
import { Direction, Language } from '../../enums/common.enum';

/** The backend's `availableDoctorSorts`. */
export type DoctorSort =
	'createdAt' | 'doctorName' | 'doctorLikes' | 'doctorFollowers' | 'doctorViews' | 'doctorRating' | 'doctorScore';

interface DISearch {
	/** Doctor name in English or Korean. */
	text?: string;
	specialty?: Specialty;
	/** Doctors who consult in at least one of these. */
	langs?: Language[];
	/** The doctors of one clinic — the clinic page. */
	clinicId?: string;
}

export interface DoctorsInquiry {
	page: number;
	/** 1–50 */
	limit: number;
	sort?: DoctorSort;
	direction?: Direction;
	search?: DISearch;
}
