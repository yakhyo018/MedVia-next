import { ClinicStatus, District, Specialty } from '../../enums/clinic.enum';
import { Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';

export interface ClinicHour {
	/** 0 = Sunday … 6 = Saturday */
	day: number;
	open?: string;
	close?: string;
	closed: boolean;
}

export interface GeoPoint {
	type: string;
	/** [lng, lat] */
	coordinates: number[];
}

export interface Clinic {
	_id: string;
	clinicStatus?: ClinicStatus;
	clinicName: string;
	clinicNameKo?: string;
	clinicSpecialty?: Specialty;
	clinicDistrict: District;
	clinicAddress?: string;
	clinicLocation?: GeoPoint;
	clinicPhone?: string;
	clinicHours?: ClinicHour[];
	clinicLangs?: Language[];
	clinicInterpreterLangs?: Language[];
	clinicLogo?: string;
	clinicImages?: string[];
	clinicDesc?: string;
	clinicMinPrice?: number | null;
	clinicTreatmentNames?: string[];
	clinicLikes?: number;
	clinicFollowers?: number;
	clinicViews?: number;
	clinicRating?: number;
	clinicReviews?: number;
	clinicScore?: number;
	memberId?: string;
	verifiedAt?: Date;
	createdAt?: Date;
	/** Only when the viewer is signed in. */
	meLiked?: boolean;
	meFollowed?: boolean;
}

export interface Clinics {
	list: Clinic[];
	metaCounter: TotalCounter[];
}
