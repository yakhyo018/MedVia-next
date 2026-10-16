import { AuditAction, AuditGroup, ReviewDecision } from '../../enums/admin.enum';
import { BatchName, BatchStatus } from '../../enums/batch.enum';
import { BookingStatus } from '../../enums/booking.enum';
import { ClinicStatus } from '../../enums/clinic.enum';
import { DoctorStatus } from '../../enums/doctor.enum';
import { TreatmentStatus } from '../../enums/treatment.enum';
import { ReviewFlag, ReviewStatus } from '../../enums/review.enum';
import {
	BoardArticleCategory,
	BoardArticleStatus,
	ModerationDecision,
	ReportGroup,
	ReportReason,
	ReportStatus,
} from '../../enums/board-article.enum';
import { InquiryCategory, InquiryStatus, NoticeCategory, NoticeStatus } from '../../enums/cs.enum';
import { MemberStatus, MemberType } from '../../enums/member.enum';
import { Direction, Language } from '../../enums/common.enum';
import { Member } from '../member/member';
import { NoticeTranslation } from '../cs/cs';
import { TotalCounter } from '../common';

/** DASHBOARD **/

export interface DayCount {
	/** A Seoul day, YYYY-MM-DD. */
	date: string;
	count: number;
}

export interface LanguageShare {
	lang: Language;
	count: number;
	/** 0 … 1 */
	share: number;
}

/** The booking cards of the dashboard and the Bookings monitor. */
export interface BookingStats {
	today: number;
	waitingForClinic: number;
	last14Days: DayCount[];
	languages: LanguageShare[];
}

export interface BatchRun {
	batchName: BatchName;
	batchStatus?: BatchStatus | null;
	batchResult?: string | null;
	startedAt?: Date | null;
	finishedAt?: Date | null;
}

export interface QueueCounts {
	delayed: number;
	waiting: number;
	active: number;
	failed: number;
}

/** `queue` is null when Redis does not answer. */
export interface BatchStatusView {
	batches: BatchRun[];
	queue?: QueueCounts | null;
}

/** AUDIT **/

export interface AuditLog {
	_id: string;
	auditAction: AuditAction;
	auditGroup: AuditGroup;
	auditRefId: string;
	auditNote?: string | null;
	memberId: string;
	adminName?: string | null;
	createdAt: Date;
}

export interface AuditLogs {
	list: AuditLog[];
	metaCounter: TotalCounter[];
}

export interface AuditFeedInquiry {
	page: number;
	limit: number;
	auditGroup?: AuditGroup;
	auditAction?: AuditAction;
	memberId?: string;
	from?: Date;
	to?: Date;
}

/** USERS **/

export interface MembersSearch {
	memberType?: MemberType;
	memberStatus?: MemberStatus;
	/** Name or email. */
	text?: string;
}

export interface MembersInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search?: MembersSearch;
}

export interface MemberBookingRow {
	_id: string;
	bookingCode: string;
	bookingStatus: BookingStatus;
	bookingDate: Date;
	clinicName?: string | null;
	treatmentName?: string | null;
}

export interface MemberDetail {
	member: Member;
	completedVisits: number;
	noShows: number;
	posts: number;
	reportsAgainst: number;
	recentBookings: MemberBookingRow[];
}

export interface MemberAdminUpdate {
	_id: string;
	memberStatus: MemberStatus;
}

/** CLINICS · DOCTORS · TREATMENTS **/

export interface AdminClinicsInquiry {
	page: number;
	limit: number;
	clinicStatus?: ClinicStatus;
	text?: string;
}

export interface ClinicReviewInput {
	clinicId: string;
	decision: ReviewDecision;
	/** Required unless the decision is APPROVE. */
	clinicReviewNote?: string;
}

export interface AdminDoctorsInquiry {
	page: number;
	limit: number;
	doctorStatus?: DoctorStatus;
	text?: string;
}

export interface AdminTreatmentsInquiry {
	page: number;
	limit: number;
	/** New treatments and edits of live ones, oldest first. */
	reviewQueue?: boolean;
	treatmentStatus?: TreatmentStatus;
}

export interface TreatmentReviewInput {
	treatmentId: string;
	decision: ReviewDecision;
	treatmentReviewNote?: string;
	/** For an edit: the draft the admin looked at (refused when the clinic changed it since). */
	draftSubmittedAt?: Date;
}

/** REVIEWS · COMMUNITY **/

export interface AdminReviewsInquiry {
	page: number;
	limit: number;
	reviewStatus?: ReviewStatus;
}

export interface ReviewModerationInput {
	reviewId: string;
	decision: ReviewDecision;
	reviewNote?: string;
	reviewFlags?: ReviewFlag[];
}

export interface AdminArticlesInquiry {
	page: number;
	limit: number;
	articleStatus?: BoardArticleStatus;
	articleCategory?: BoardArticleCategory;
	/** Only posts with at least one report. */
	reported?: boolean;
}

export interface Report {
	_id: string;
	reportGroup: ReportGroup;
	reportReason: ReportReason;
	reportDetail?: string | null;
	reportStatus: ReportStatus;
	reportRefId: string;
	memberId: string;
	createdAt: Date;
	/** The post title or the comment text. */
	targetText?: string | null;
	targetStatus?: string | null;
}

export interface Reports {
	list: Report[];
	metaCounter: TotalCounter[];
}

export interface ReportsInquiry {
	page: number;
	limit: number;
	reportStatus?: ReportStatus;
}

export interface ModerationInput {
	reportGroup: ReportGroup;
	refId: string;
	decision: ModerationDecision;
	note?: string;
}

/** CS **/

export interface AdminInquiriesInquiry {
	page: number;
	limit: number;
	inquiryStatus?: InquiryStatus;
	inquiryCategory?: InquiryCategory;
	/** NEW, IN_PROGRESS and ANSWERED — not resolved yet. */
	open?: boolean;
}

export interface AdminNoticesInquiry {
	page: number;
	limit: number;
	noticeCategory?: NoticeCategory;
	noticeStatus?: NoticeStatus;
}

export interface NoticeInput {
	noticeCategory: NoticeCategory;
	noticeFaqCategory?: InquiryCategory;
	noticePinned?: boolean;
	noticeTitle: string;
	noticeContent: string;
	noticeTranslations?: NoticeTranslation[];
	noticeStatus?: NoticeStatus;
}

export interface NoticeUpdate {
	noticeId: string;
	noticePinned?: boolean;
	noticeTitle?: string;
	noticeContent?: string;
	noticeTranslations?: NoticeTranslation[];
	noticeStatus?: NoticeStatus;
}

/** ACCESS LOG **/

export interface AccessLogsInquiry {
	page: number;
	limit: number;
	patientId?: string;
	bookingId?: string;
}
