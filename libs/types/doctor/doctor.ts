import { DoctorStatus } from '../../enums/doctor.enum';
import { Specialty } from '../../enums/clinic.enum';
import { Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';
import { Clinic } from '../clinic/clinic';

export interface CareerItem {
	title: string;
	place?: string;
	from?: string;
	to?: string;
}

export interface Doctor {
	_id: string;
	doctorStatus: DoctorStatus;
	doctorName: string;
	doctorNameKo?: string;
	doctorSpecialty: Specialty;
	doctorExperience?: number;
	doctorLangs: Language[];
	doctorBio: string;
	doctorImage: string;
	doctorCareer: CareerItem[];
	doctorLikes: number;
	doctorViews: number;
	doctorFollowers: number;
	doctorRating?: number;
	doctorReviews?: number;
	doctorScore?: number;
	clinicId: string;
	createdAt: Date;
	updatedAt: Date;
	/** Only when the viewer is signed in. */
	meLiked?: boolean;
	meFollowed?: boolean;
	clinicData?: Clinic;
}

export interface Doctors {
	list: Doctor[];
	metaCounter: TotalCounter[];
}
