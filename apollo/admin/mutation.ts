import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

/** Block, unblock, delete or restore; anything but ACTIVE also ends the member's sessions. */
export const UPDATE_MEMBER_BY_ADMIN = gql`
	mutation UpdateMemberByAdmin($input: MemberAdminUpdate!) {
		updateMemberByAdmin(input: $input) {
			_id
			memberStatus
			deletedAt
		}
	}
`;

/**************************
 *         CLINIC         *
 *************************/

export const REVIEW_CLINIC = gql`
	mutation ReviewClinic($input: ClinicReviewInput!) {
		reviewClinic(input: $input) {
			_id
			clinicStatus
			clinicReviewNote
			verifiedAt
		}
	}
`;

export const SUSPEND_CLINIC = gql`
	mutation SuspendClinic($input: ClinicStatusInput!) {
		suspendClinic(input: $input) {
			_id
			clinicStatus
		}
	}
`;

export const RESTORE_CLINIC = gql`
	mutation RestoreClinic($input: ClinicStatusInput!) {
		restoreClinic(input: $input) {
			_id
			clinicStatus
		}
	}
`;

/**************************
 *         DOCTOR         *
 *************************/

export const SUSPEND_DOCTOR = gql`
	mutation SuspendDoctor($input: DoctorStatusInput!) {
		suspendDoctor(input: $input) {
			_id
			doctorStatus
		}
	}
`;

export const RESTORE_DOCTOR = gql`
	mutation RestoreDoctor($input: DoctorStatusInput!) {
		restoreDoctor(input: $input) {
			_id
			doctorStatus
		}
	}
`;

/**************************
 *        TREATMENT       *
 *************************/

export const REVIEW_TREATMENT = gql`
	mutation ReviewTreatment($input: TreatmentReviewInput!) {
		reviewTreatment(input: $input) {
			_id
			treatmentStatus
			treatmentReviewNote
		}
	}
`;

/**************************
 *         REVIEW         *
 *************************/

export const MODERATE_REVIEW = gql`
	mutation ModerateReview($input: ReviewModerationInput!) {
		moderateReview(input: $input) {
			_id
			reviewStatus
			reviewNote
			reviewFlags
		}
	}
`;

/**************************
 *        COMMUNITY       *
 *************************/

/** Hide or show a post or a comment; every pending report of it closes with the decision. */
export const MODERATE_CONTENT = gql`
	mutation ModerateContent($input: ModerationInput!) {
		moderateContent(input: $input) {
			refId
			status
			reportsClosed
		}
	}
`;

/**************************
 *           CS           *
 *************************/

export const RESOLVE_INQUIRY = gql`
	mutation ResolveInquiry($inquiryId: String!) {
		resolveInquiry(inquiryId: $inquiryId) {
			_id
			inquiryStatus
			resolvedAt
		}
	}
`;

const NOTICE_FIELDS = `
	_id
	noticeCategory
	noticeStatus
	noticeFaqCategory
	noticePinned
	noticeTitle
	noticeContent
	noticeTranslations {
		lang
		title
		content
	}
	noticeViews
	publishedAt
	createdAt
`;

export const CREATE_NOTICE = gql`
	mutation CreateNotice($input: NoticeInput!) {
		createNotice(input: $input) {
			${NOTICE_FIELDS}
		}
	}
`;

export const UPDATE_NOTICE = gql`
	mutation UpdateNotice($input: NoticeUpdate!) {
		updateNotice(input: $input) {
			${NOTICE_FIELDS}
		}
	}
`;

export const REMOVE_NOTICE = gql`
	mutation RemoveNotice($noticeId: String!) {
		removeNotice(noticeId: $noticeId) {
			_id
			noticeStatus
		}
	}
`;
