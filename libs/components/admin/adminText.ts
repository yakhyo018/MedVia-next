import { TFunction } from 'i18next';
import { AuditAction, AuditGroup } from '../../enums/admin.enum';
import { BatchName } from '../../enums/batch.enum';
import { MemberType } from '../../enums/member.enum';
import { ClinicStatus } from '../../enums/clinic.enum';
import { ReviewStatus } from '../../enums/review.enum';
import { ReportStatus } from '../../enums/board-article.enum';
import { LANGUAGES } from '../../config';
import { seoulTime } from '../../utils';

/**
 * The admin panel's i18n namespaces: its own texts in `admin.json` (loaded only by admin pages,
 * so the public pages stay light), then the shared `common.json`. `nsMode: 'fallback'` makes
 * `t` look in both, in this order (by default it is bound to the first one only).
 */
export const ADMIN_NS = ['admin', 'common'];
export const ADMIN_I18N = { nsMode: 'fallback' } as const;

/** The review queues, totals only (one row each, `metaCounter` is read): the dashboard and the menu badges. */
export const ADMIN_QUEUES_INPUT = {
	clinics: { page: 1, limit: 1, clinicStatus: ClinicStatus.PENDING },
	reviews: { page: 1, limit: 1, reviewStatus: ReviewStatus.PENDING },
	reports: { page: 1, limit: 1, reportStatus: ReportStatus.PENDING },
	treatments: { page: 1, limit: 1, reviewQueue: true },
};

export type AuditTone = 'success' | 'warning' | 'danger';

/** What each decision is called in the feed and how it is coloured. */
export const AUDIT_ACTIONS: Record<AuditAction, { label: string; tone: AuditTone }> = {
	[AuditAction.CLINIC_APPROVE]: { label: 'Clinic approved', tone: 'success' },
	[AuditAction.CLINIC_REQUEST_CHANGES]: { label: 'Clinic asked for changes', tone: 'warning' },
	[AuditAction.CLINIC_REJECT]: { label: 'Clinic rejected', tone: 'danger' },
	[AuditAction.CLINIC_SUSPEND]: { label: 'Clinic suspended', tone: 'danger' },
	[AuditAction.CLINIC_RESTORE]: { label: 'Clinic restored', tone: 'success' },
	[AuditAction.DOCTOR_SUSPEND]: { label: 'Doctor suspended', tone: 'danger' },
	[AuditAction.DOCTOR_RESTORE]: { label: 'Doctor restored', tone: 'success' },
	[AuditAction.TREATMENT_APPROVE]: { label: 'Treatment approved', tone: 'success' },
	[AuditAction.TREATMENT_REQUEST_CHANGES]: { label: 'Treatment sent back for changes', tone: 'warning' },
	[AuditAction.TREATMENT_REJECT]: { label: 'Treatment rejected', tone: 'danger' },
	[AuditAction.TREATMENT_EDIT_APPROVE]: { label: 'Treatment edit approved', tone: 'success' },
	[AuditAction.TREATMENT_EDIT_REJECT]: { label: 'Treatment edit rejected', tone: 'danger' },
	[AuditAction.BOOKING_CANCEL]: { label: 'Booking cancelled', tone: 'danger' },
	[AuditAction.REVIEW_APPROVE]: { label: 'Review approved', tone: 'success' },
	[AuditAction.REVIEW_REQUEST_CHANGES]: { label: 'Review sent back for an edit', tone: 'warning' },
	[AuditAction.REVIEW_HIDE]: { label: 'Review hidden', tone: 'danger' },
	[AuditAction.ARTICLE_HIDE]: { label: 'Post hidden', tone: 'danger' },
	[AuditAction.ARTICLE_SHOW]: { label: 'Post shown again', tone: 'success' },
	[AuditAction.COMMENT_HIDE]: { label: 'Comment hidden', tone: 'danger' },
	[AuditAction.COMMENT_SHOW]: { label: 'Comment shown again', tone: 'success' },
	[AuditAction.MEMBER_BLOCK]: { label: 'User blocked', tone: 'danger' },
	[AuditAction.MEMBER_UNBLOCK]: { label: 'User unblocked', tone: 'success' },
	[AuditAction.MEMBER_DELETE]: { label: 'User deleted', tone: 'danger' },
	[AuditAction.MEMBER_RESTORE]: { label: 'User restored', tone: 'success' },
	[AuditAction.NOTICE_PUBLISH]: { label: 'Notice published', tone: 'success' },
	[AuditAction.NOTICE_UNPUBLISH]: { label: 'Notice unpublished', tone: 'warning' },
	[AuditAction.NOTICE_REMOVE]: { label: 'Notice removed', tone: 'danger' },
};

export const AUDIT_GROUPS: Record<AuditGroup, string> = {
	[AuditGroup.CLINIC]: 'Clinics',
	[AuditGroup.DOCTOR]: 'Doctors',
	[AuditGroup.TREATMENT]: 'Treatments',
	[AuditGroup.BOOKING]: 'Bookings',
	[AuditGroup.REVIEW]: 'Reviews',
	[AuditGroup.ARTICLE]: 'Posts',
	[AuditGroup.COMMENT]: 'Comments',
	[AuditGroup.MEMBER]: 'Users',
	[AuditGroup.NOTICE]: 'Notices',
};

/** Where a decision's target can be opened (live targets only — hidden ones have no public page). */
export const auditTargetHref = (group: AuditGroup, refId: string): string | null => {
	switch (group) {
		case AuditGroup.MEMBER:
			return `/_admin/users/detail?id=${refId}`;
		case AuditGroup.ARTICLE:
			return `/community/detail?id=${refId}`;
		case AuditGroup.CLINIC:
			return `/clinics/detail?id=${refId}`;
		case AuditGroup.DOCTOR:
			return `/doctors/detail?id=${refId}`;
		case AuditGroup.NOTICE:
			return `/cs/notice?id=${refId}`;
		default:
			return null;
	}
};

/** The batch's three runs: the name and the schedule (the batch's CRON_* in Asia/Seoul). */
export const BATCH_JOBS: Record<BatchName, { label: string; schedule: string }> = {
	[BatchName.SLOT_RELEASE]: { label: 'Slot hold release', schedule: 'Every 5 minutes' },
	[BatchName.RECOUNT]: { label: 'Counters recount', schedule: 'Daily · 02:30' },
	[BatchName.RANK]: { label: 'Top clinics & doctors ranking', schedule: 'Daily · 03:00' },
};

/** "just now", "12 min ago", "3 h ago"; older than a day — the Seoul date and time. */
export const timeAgo = (value: Date | string, t: TFunction, locale = 'en'): string => {
	const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
	if (minutes < 1) return t('just now');
	if (minutes < 60) return t('{{count}} min ago', { count: minutes });
	if (minutes < 24 * 60) return t('{{count}} h ago', { count: Math.floor(minutes / 60) });
	return seoulTime(value, locale);
};

/** The language's own name ("Русский"); ZH (the Assistant's) has no site locale. */
export const languageName = (code: string | undefined | null): string =>
	LANGUAGES.find((lang) => lang.code === code)?.label ?? (code === 'ZH' ? '中文' : (code ?? ''));

/** The account types as the admin calls them, with the badge colour. */
export const MEMBER_TYPES: Record<MemberType, { label: string; tone: string }> = {
	[MemberType.USER]: { label: 'Patient', tone: 'teal' },
	[MemberType.AGENT]: { label: 'Clinic', tone: 'success' },
	[MemberType.DOCTOR]: { label: 'Doctor', tone: 'warning' },
	[MemberType.ADMIN]: { label: 'Admin', tone: 'neutral' },
};
