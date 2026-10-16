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

/** Google sign-in: the ID token, and for a first visit what the sign-up form would ask. */
export interface GoogleLoginInput {
	idToken: string;
	memberType?: MemberType;
	memberLang?: Language;
	/** Required when this Google account has no MedVia account yet. */
	termsAccepted?: boolean;
}
