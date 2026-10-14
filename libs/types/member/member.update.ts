import { Language } from '../../enums/common.enum';
import { NotifySettings } from './member';

/** The member's own profile. Email and type are not editable. */
export interface MemberUpdate {
	memberFullName?: string;
	memberPhone?: string;
	memberImage?: string;
	memberCountry?: string;
	memberLang?: Language;
	memberNotify?: Partial<NotifySettings>;
}

/** A Google-only account has no password yet: it sets its first one without `currentPassword`. */
export interface ChangePasswordInput {
	currentPassword?: string;
	newPassword: string;
}
