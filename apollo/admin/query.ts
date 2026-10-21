import { gql } from '@apollo/client';

/**************************
 *        DASHBOARD       *
 *************************/

const AUDIT_FIELDS = `
	_id
	auditAction
	auditGroup
	auditRefId
	auditNote
	memberId
	adminName
	createdAt
`;

/**
 * The review queues' totals alone, for the side menu's badges. Same fields and arguments as the
 * dashboard's aliases, so Apollo serves either from the other's cache.
 */
export const GET_ADMIN_COUNTS = gql`
	query GetAdminCounts(
		$clinics: AdminClinicsInquiry!
		$reviews: AdminReviewsInquiry!
		$reports: ReportsInquiry!
		$treatments: AdminTreatmentsInquiry!
	) {
		pendingClinics: getClinicsByAdmin(input: $clinics) {
			metaCounter {
				total
			}
		}
		pendingReviews: getReviewsByAdmin(input: $reviews) {
			metaCounter {
				total
			}
		}
		pendingReports: getReportsByAdmin(input: $reports) {
			metaCounter {
				total
			}
		}
		pendingTreatments: getTreatmentsByAdmin(input: $treatments) {
			metaCounter {
				total
			}
		}
	}
`;

/**
 * The whole dashboard in one request: booking cards and chart, the batch's last runs, the
 * review queues' totals (limit 1 — only `metaCounter` is read) and the latest decisions.
 */
export const GET_ADMIN_DASHBOARD = gql`
	query GetAdminDashboard(
		$clinics: AdminClinicsInquiry!
		$reviews: AdminReviewsInquiry!
		$reports: ReportsInquiry!
		$treatments: AdminTreatmentsInquiry!
		$feed: AuditFeedInquiry!
	) {
		getBookingStatsByAdmin {
			today
			waitingForClinic
			last14Days {
				date
				count
			}
			languages {
				lang
				count
				share
			}
		}
		getBatchStatusByAdmin {
			batches {
				batchName
				batchStatus
				batchResult
				startedAt
				finishedAt
			}
			queue {
				delayed
				waiting
				active
				failed
			}
		}
		pendingClinics: getClinicsByAdmin(input: $clinics) {
			metaCounter {
				total
			}
		}
		pendingReviews: getReviewsByAdmin(input: $reviews) {
			metaCounter {
				total
			}
		}
		pendingReports: getReportsByAdmin(input: $reports) {
			metaCounter {
				total
			}
		}
		pendingTreatments: getTreatmentsByAdmin(input: $treatments) {
			metaCounter {
				total
			}
		}
		getAuditFeedByAdmin(input: $feed) {
			list {
				${AUDIT_FIELDS}
			}
		}
	}
`;

/** The booking cards alone (the Bookings monitor). */
export const GET_BOOKING_STATS = gql`
	query GetBookingStatsByAdmin {
		getBookingStatsByAdmin {
			today
			waitingForClinic
		}
	}
`;

/**************************
 *          AUDIT         *
 *************************/

export const GET_AUDIT_FEED = gql`
	query GetAuditFeedByAdmin($input: AuditFeedInquiry!) {
		getAuditFeedByAdmin(input: $input) {
			list {
				${AUDIT_FIELDS}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         MEMBER         *
 *************************/

const ADMIN_MEMBER_FIELDS = `
	_id
	memberType
	memberStatus
	memberAuthType
	memberEmail
	memberFullName
	memberPhone
	memberImage
	memberCountry
	memberLang
	memberLastLoginAt
	deletedAt
	createdAt
`;

export const GET_ALL_MEMBERS = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
				${ADMIN_MEMBER_FIELDS}
			}
			metaCounter {
				total
			}
		}
	}
`;

/** One total per user tab: limit 1, only `metaCounter` is read. */
export const COUNT_MEMBERS = gql`
	query CountMembers(
		$all: MembersInquiry!
		$patients: MembersInquiry!
		$clinics: MembersInquiry!
		$doctors: MembersInquiry!
		$admins: MembersInquiry!
		$blocked: MembersInquiry!
	) {
		all: getAllMembersByAdmin(input: $all) {
			metaCounter {
				total
			}
		}
		patients: getAllMembersByAdmin(input: $patients) {
			metaCounter {
				total
			}
		}
		clinics: getAllMembersByAdmin(input: $clinics) {
			metaCounter {
				total
			}
		}
		doctors: getAllMembersByAdmin(input: $doctors) {
			metaCounter {
				total
			}
		}
		admins: getAllMembersByAdmin(input: $admins) {
			metaCounter {
				total
			}
		}
		blocked: getAllMembersByAdmin(input: $blocked) {
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER_DETAIL = gql`
	query GetMemberDetailByAdmin($memberId: String!) {
		getMemberDetailByAdmin(memberId: $memberId) {
			member {
				${ADMIN_MEMBER_FIELDS}
			}
			completedVisits
			noShows
			posts
			reportsAgainst
			recentBookings {
				_id
				bookingCode
				bookingStatus
				bookingDate
				clinicName
				treatmentName
			}
		}
	}
`;

/** Who opened a patient's answers or AI summary — the admin sees the log, never the data. */
export const GET_ACCESS_LOGS = gql`
	query GetAccessLogsByAdmin($input: AccessLogsInquiry!) {
		getAccessLogsByAdmin(input: $input) {
			list {
				_id
				accessType
				bookingId
				bookingCode
				readerType
				readerName
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         CLINIC         *
 *************************/

const ADMIN_CLINIC_FIELDS = `
	_id
	clinicStatus
	clinicName
	clinicNameKo
	clinicSpecialty
	clinicDistrict
	clinicAddress
	clinicPhone
	clinicLangs
	clinicInterpreterLangs
	clinicLogo
	clinicImages
	clinicDesc
	clinicReviewNote
	clinicMinPrice
	clinicTreatmentNames
	clinicRating
	clinicReviews
	clinicViews
	submittedAt
	verifiedAt
	createdAt
	memberData {
		_id
		memberFullName
		memberEmail
		memberPhone
	}
`;

export const GET_CLINICS_BY_ADMIN = gql`
	query GetClinicsByAdmin($input: AdminClinicsInquiry!) {
		getClinicsByAdmin(input: $input) {
			list {
				${ADMIN_CLINIC_FIELDS}
			}
			metaCounter {
				total
			}
		}
	}
`;

/** The verification cards: one total per status. */
export const COUNT_CLINICS_BY_STATUS = gql`
	query CountClinicsByStatus(
		$pending: AdminClinicsInquiry!
		$active: AdminClinicsInquiry!
		$changes: AdminClinicsInquiry!
		$rejected: AdminClinicsInquiry!
		$suspended: AdminClinicsInquiry!
	) {
		pending: getClinicsByAdmin(input: $pending) {
			metaCounter {
				total
			}
		}
		active: getClinicsByAdmin(input: $active) {
			metaCounter {
				total
			}
		}
		changes: getClinicsByAdmin(input: $changes) {
			metaCounter {
				total
			}
		}
		rejected: getClinicsByAdmin(input: $rejected) {
			metaCounter {
				total
			}
		}
		suspended: getClinicsByAdmin(input: $suspended) {
			metaCounter {
				total
			}
		}
	}
`;

/**
 * The review page's clinic. The API has no admin "clinic by id" (the public `getClinic` serves
 * live clinics only), so the page reads the not-yet-live statuses — at most 50 each — and finds
 * the clinic among them.
 */
export const GET_CLINICS_TO_REVIEW = gql`
	query GetClinicsToReview(
		$pending: AdminClinicsInquiry!
		$changes: AdminClinicsInquiry!
		$rejected: AdminClinicsInquiry!
	) {
		pending: getClinicsByAdmin(input: $pending) {
			list {
				${ADMIN_CLINIC_FIELDS}
			}
		}
		changes: getClinicsByAdmin(input: $changes) {
			list {
				${ADMIN_CLINIC_FIELDS}
			}
		}
		rejected: getClinicsByAdmin(input: $rejected) {
			list {
				${ADMIN_CLINIC_FIELDS}
			}
		}
	}
`;

/**************************
 *         DOCTOR         *
 *************************/

export const GET_ALL_DOCTORS = gql`
	query GetAllDoctorsByAdmin($input: AdminDoctorsInquiry!) {
		getAllDoctorsByAdmin(input: $input) {
			list {
				_id
				doctorStatus
				doctorName
				doctorNameKo
				doctorSpecialty
				doctorLangs
				doctorImage
				doctorRating
				doctorReviews
				clinicId
				createdAt
				clinicData {
					_id
					clinicName
					clinicStatus
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        TREATMENT       *
 *************************/

export const GET_TREATMENTS_BY_ADMIN = gql`
	query GetTreatmentsByAdmin($input: AdminTreatmentsInquiry!) {
		getTreatmentsByAdmin(input: $input) {
			list {
				_id
				treatmentStatus
				treatmentName
				treatmentCategory
				treatmentDuration
				treatmentPrice
				treatmentPriceNote
				treatmentDesc
				treatmentImages
				treatmentReviewNote
				treatmentDraft {
					treatmentName
					treatmentCategory
					treatmentPrice
					treatmentPriceNote
					treatmentDesc
					treatmentImages
					submittedAt
				}
				clinicId
				submittedAt
				createdAt
				doctors {
					_id
					doctorName
				}
				clinicData {
					_id
					clinicName
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         BOOKING        *
 *************************/

/** The admin's scope of `getBookings`: every clinic, no answers or AI summary. */
export const GET_ADMIN_BOOKINGS = gql`
	query GetAdminBookings($input: BookingsInquiry!) {
		getBookings(input: $input) {
			list {
				_id
				bookingCode
				bookingStatus
				bookingDate
				bookingLang
				respondDeadline
				patientName
				memberId
				createdAt
				clinicData {
					_id
					clinicName
				}
				doctorData {
					_id
					doctorName
				}
				treatmentData {
					_id
					treatmentName
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         REVIEW         *
 *************************/

export const GET_REVIEWS_BY_ADMIN = gql`
	query GetReviewsByAdmin($input: AdminReviewsInquiry!) {
		getReviewsByAdmin(input: $input) {
			list {
				_id
				reviewStatus
				reviewRating
				reviewTags
				reviewFlags
				reviewContent
				reviewLang
				reviewNote
				submittedAt
				bookingId
				clinicId
				patientName
				clinicName
				doctorName
				treatmentName
				visitDate
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        COMMUNITY       *
 *************************/

export const GET_ARTICLES_BY_ADMIN = gql`
	query GetArticlesByAdmin($input: AdminArticlesInquiry!) {
		getArticlesByAdmin(input: $input) {
			list {
				_id
				articleCategory
				articleStatus
				articleTitle
				articleComments
				articleReports
				memberId
				authorName
				authorType
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_REPORTS_BY_ADMIN = gql`
	query GetReportsByAdmin($input: ReportsInquiry!) {
		getReportsByAdmin(input: $input) {
			list {
				_id
				reportGroup
				reportReason
				reportDetail
				reportStatus
				reportRefId
				memberId
				createdAt
				targetText
				targetStatus
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *           CS           *
 *************************/

const ADMIN_INQUIRY_FIELDS = `
	_id
	inquiryCategory
	inquiryStatus
	inquiryTitle
	inquiryContent
	inquiryLang
	inquiryReplyLang
	inquiryMessages {
		senderType
		text
		lang
		createdAt
	}
	resolvedAt
	memberId
	patientName
	bookingId
	bookingCode
	createdAt
	updatedAt
`;

export const GET_INQUIRIES_BY_ADMIN = gql`
	query GetInquiriesByAdmin($input: AdminInquiriesInquiry!) {
		getInquiriesByAdmin(input: $input) {
			list {
				${ADMIN_INQUIRY_FIELDS}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_ADMIN_INQUIRY = gql`
	query GetAdminInquiry($inquiryId: String!) {
		getInquiry(inquiryId: $inquiryId) {
			${ADMIN_INQUIRY_FIELDS}
		}
	}
`;

export const GET_NOTICES_BY_ADMIN = gql`
	query GetNoticesByAdmin($input: AdminNoticesInquiry!) {
		getNoticesByAdmin(input: $input) {
			list {
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
			}
			metaCounter {
				total
			}
		}
	}
`;

/** The monitor's cards: one total per status (limit 1, only `metaCounter`). */
export const COUNT_ADMIN_BOOKINGS = gql`
	query CountAdminBookings($confirmed: BookingsInquiry!, $declined: BookingsInquiry!, $noShow: BookingsInquiry!) {
		confirmed: getBookings(input: $confirmed) {
			metaCounter {
				total
			}
		}
		declined: getBookings(input: $declined) {
			metaCounter {
				total
			}
		}
		noShow: getBookings(input: $noShow) {
			metaCounter {
				total
			}
		}
	}
`;
