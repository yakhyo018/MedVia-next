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

/** The clinic creates a doctor's account; the doctor logs in with this email and password. */
export interface DoctorCreateInput {
	memberEmail: string;
	memberPassword: string;
	doctorName: string;
	doctorNameKo?: string;
	doctorSpecialty: Specialty;
	doctorLangs?: Language[];
	doctorExperience?: number;
}

export interface CareerItemInput {
	title: string;
	place?: string;
	from?: string;
	to?: string;
}

/** The doctor's own profile (Doctor Panel). The clinic changes only the specialty. */
export interface DoctorProfileUpdate {
	doctorName?: string;
	doctorNameKo?: string;
	doctorImage?: string;
	doctorExperience?: number;
	doctorLangs?: Language[];
	doctorBio?: string;
	doctorCareer?: CareerItemInput[];
}
