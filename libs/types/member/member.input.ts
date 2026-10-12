import { MemberType } from '../../enums/member.enum';
import { Language } from '../../enums/common.enum';

export interface MemberInput {
	memberType: MemberType;
	memberEmail: string;
	memberPassword: string;
	memberFullName: string;
	memberPhone?: string;
	memberCountry?: string;
	memberLang: Language;
	termsAccepted: boolean;
}

export interface LoginInput {
	memberEmail: string;
	memberPassword: string;
}
