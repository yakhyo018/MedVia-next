import { MemberAuthType, MemberStatus, MemberType } from '../../enums/member.enum';
import { Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';

export interface NotifySettings {
	bookingUpdates: boolean;
	visitReminders: boolean;
	chatMessages: boolean;
}

export interface Member {
	_id: string;
	memberType: MemberType;
	memberStatus: MemberStatus;
	memberAuthType: MemberAuthType;
	memberEmail: string;
	memberMustChangePassword: boolean;
	memberFullName: string;
	memberPhone?: string;
	memberImage: string;
	memberCountry?: string;
	memberLang: Language;
	memberNotify: NotifySettings;
	memberTermsAt: Date;
	memberLastLoginAt?: Date;
	memberAiConsentAt?: Date;
	memberAiConsentVersion?: string;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	/** Only on signup, login and refresh. The refresh token travels in an httpOnly cookie. */
	accessToken?: string;
}

export interface Members {
	list: Member[];
	metaCounter: TotalCounter[];
}
