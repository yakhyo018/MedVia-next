import { MemberType } from '../../enums/member.enum';
import { TotalCounter } from '../common';
import { Clinic } from '../clinic/clinic';
import { Doctor } from '../doctor/doctor';

/** What anyone may see of a member: a community author. */
export interface PublicMember {
	_id: string;
	memberType: MemberType;
	memberDisplayName: string;
	memberImage: string;
}

/** One followed account; exactly one of the three `following…` fields matches its type. */
export interface Follow {
	_id: string;
	followingId: string;
	followingType: MemberType;
	createdAt: Date;
	followingMember?: PublicMember | null;
	followingClinic?: Clinic | null;
	followingDoctor?: Doctor | null;
}

export interface FollowTypeCount {
	followingType: MemberType;
	total: number;
}

export interface Followings {
	list: Follow[];
	metaCounter: TotalCounter[];
	typeCounts: FollowTypeCount[];
}

export interface FollowingsInquiry {
	page: number;
	limit: number;
	followingType?: MemberType;
}
