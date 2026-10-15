import { ClinicStatus, District, Specialty } from '../../enums/clinic.enum';
import { Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';
import { Member } from '../member/member';

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
	/** The admin's note when asking for changes or rejecting (the clinic's own view). */
	clinicReviewNote?: string | null;
	submittedAt?: Date;
	verifiedAt?: Date;
	createdAt?: Date;
	/** Only when the viewer is signed in. */
	meLiked?: boolean;
	meFollowed?: boolean;
	/** The clinic's account — the admin's lists only. */
	memberData?: Pick<Member, '_id' | 'memberFullName' | 'memberEmail' | 'memberPhone'> | null;
}

export interface Clinics {
	list: Clinic[];
	metaCounter: TotalCounter[];
}

export interface ClinicHourInput {
	day: number;
	open?: string;
	close?: string;
	closed?: boolean;
}

/** The clinic's own profile. A changed name or address sends the clinic back to review. */
export interface ClinicUpdate {
	clinicName?: string;
	clinicNameKo?: string;
	clinicSpecialty?: Specialty;
	clinicDistrict?: District;
	clinicAddress?: string;
	clinicPhone?: string;
	clinicHours?: ClinicHourInput[];
	clinicLangs?: Language[];
	clinicInterpreterLangs?: Language[];
	clinicLogo?: string;
	clinicImages?: string[];
	clinicDesc?: string;
}

/** "I am a clinic" on the sign-up page: the account and the clinic in one step (PENDING review). */
export interface ClinicSignupInput {
	memberEmail: string;
	memberPassword: string;
	memberFullName: string;
	clinicName: string;
	clinicNameKo?: string;
	clinicSpecialty: Specialty;
	clinicDistrict: District;
	clinicAddress: string;
	clinicPhone?: string;
	termsAccepted: boolean;
	authorizedConfirmed: boolean;
}
