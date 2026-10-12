import { makeVar } from '@apollo/client';
import { MemberAuthType, MemberStatus, MemberType } from '../libs/enums/member.enum';
import { Language } from '../libs/enums/common.enum';

/** What the UI needs about the signed-in member. Filled from the API, never from the JWT. */
export interface CurrentUser {
	_id: string;
	memberType: MemberType | '';
	memberStatus: MemberStatus | '';
	memberAuthType: MemberAuthType | '';
	memberEmail: string;
	memberFullName: string;
	memberPhone: string;
	memberImage: string;
	memberLang: Language | '';
	memberMustChangePassword: boolean;
}

export const EMPTY_USER: CurrentUser = {
	_id: '',
	memberType: '',
	memberStatus: '',
	memberAuthType: '',
	memberEmail: '',
	memberFullName: '',
	memberPhone: '',
	memberImage: '',
	memberLang: '',
	memberMustChangePassword: false,
};

export const userVar = makeVar<CurrentUser>(EMPTY_USER);

/**
 * false until the first restoreSession() settles. While false the header shows neither
 * "Log in" nor the name, so a signed-in member never sees a flash of the guest header.
 */
export const sessionReadyVar = makeVar<boolean>(false);
