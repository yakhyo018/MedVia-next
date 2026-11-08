import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_MY_PROFILE = gql`
	query GetMyProfile {
		getMyProfile {
			_id
			memberType
			memberStatus
			memberAuthType
			memberEmail
			memberMustChangePassword
			memberFullName
			memberPhone
			memberImage
			memberCountry
			memberLang
			memberNotify {
				bookingUpdates
				visitReminders
				chatMessages
			}
			memberAiConsentAt
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         CLINIC         *
 *************************/

export const GET_CLINICS = gql`
	query GetClinics($input: ClinicsInquiry!) {
		getClinics(input: $input) {
			list {
				_id
				clinicName
				clinicNameKo
				clinicSpecialty
				clinicDistrict
				clinicLangs
				clinicInterpreterLangs
				clinicImages
				clinicMinPrice
				clinicRating
				clinicReviews
				clinicLikes
				meLiked
			}
			metaCounter {
				total
			}
		}
	}
`;

/** The clinic page. Records a view when a patient opens it; meLiked / meFollowed only when signed in. */
export const GET_CLINIC = gql`
	query GetClinic($clinicId: String!) {
		getClinic(clinicId: $clinicId) {
			_id
			clinicName
			clinicNameKo
			clinicSpecialty
			clinicDistrict
			clinicAddress
			clinicLocation {
				coordinates
			}
			clinicPhone
			clinicHours {
				day
				open
				close
				closed
			}
			clinicLangs
			clinicInterpreterLangs
			clinicImages
			clinicDesc
			clinicMinPrice
			clinicLikes
			clinicFollowers
			clinicViews
			clinicRating
			clinicReviews
			memberId
			meLiked
			meFollowed
		}
	}
`;

/** "Similar clinics nearby": same specialty, nearest first. */
export const GET_NEARBY_CLINICS = gql`
	query GetNearbyClinics($clinicId: String!, $limit: Int) {
		getNearbyClinics(clinicId: $clinicId, limit: $limit) {
			_id
			clinicName
			clinicNameKo
			clinicSpecialty
			clinicDistrict
			clinicLangs
			clinicInterpreterLangs
			clinicImages
			clinicMinPrice
			clinicRating
			clinicReviews
			clinicLikes
			meLiked
		}
	}
`;

/** Only the total — the Clinics / Doctors tab counters. */
export const COUNT_CLINICS = gql`
	query CountClinics($input: ClinicsInquiry!) {
		getClinics(input: $input) {
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         DOCTOR         *
 *************************/

export const GET_DOCTOR = gql`
	query GetDoctor($doctorId: String!) {
		getDoctor(doctorId: $doctorId) {
			_id
			doctorName
			doctorNameKo
			doctorSpecialty
			doctorExperience
			doctorLangs
			doctorBio
			doctorImage
			doctorCareer {
				title
				place
				from
				to
			}
			doctorLikes
			doctorViews
			doctorFollowers
			doctorRating
			doctorReviews
			memberId
			meLiked
			meFollowed
			clinicData {
				_id
				clinicName
				clinicNameKo
				clinicDistrict
				clinicImages
				clinicLangs
				clinicInterpreterLangs
			}
		}
	}
`;

export const COUNT_DOCTORS = gql`
	query CountDoctors($input: DoctorsInquiry!) {
		getDoctors(input: $input) {
			metaCounter {
				total
			}
		}
	}
`;

export const GET_DOCTORS = gql`
	query GetDoctors($input: DoctorsInquiry!) {
		getDoctors(input: $input) {
			list {
				_id
				doctorName
				doctorNameKo
				doctorSpecialty
				doctorExperience
				doctorLangs
				doctorImage
				doctorLikes
				doctorViews
				doctorRating
				doctorReviews
				meLiked
				clinicData {
					_id
					clinicName
					clinicNameKo
					clinicDistrict
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *       TREATMENT        *
 *************************/

/** The landing page's "Trending treatments" (public, cached 10 minutes on the API). */
export const GET_TRENDING_TREATMENTS = gql`
	query GetTrendingTreatments($limit: Int) {
		getTrendingTreatments(limit: $limit) {
			treatmentName
			treatmentCategory
			specialty
			minPrice
			bookings
			clinics
		}
	}
`;

export const GET_CLINIC_TREATMENTS = gql`
	query GetClinicTreatments($input: ClinicTreatmentsInquiry!) {
		getClinicTreatments(input: $input) {
			_id
			treatmentName
			treatmentCategory
			treatmentDuration
			treatmentPrice
			treatmentPriceNote
			doctors {
				_id
				doctorName
			}
		}
	}
`;

/**************************
 *         REVIEW         *
 *************************/

export const GET_REVIEWS = gql`
	query GetReviews($input: ReviewsInquiry!) {
		getReviews(input: $input) {
			list {
				_id
				reviewRating
				reviewTags
				reviewContent
				reviewLang
				reviewReply {
					replyContent
					replyLang
					replierType
					repliedAt
				}
				patientName
				clinicName
				treatmentName
				visitDate
				createdAt
			}
			metaCounter {
				total
			}
			summary {
				rating
				reviews
				distribution {
					stars
					count
				}
			}
		}
	}
`;

/**************************
 *     BOARD ARTICLE      *
 *************************/

/** The landing's Community board (F6 reads more fields). */
export const GET_ARTICLES = gql`
	query GetArticles($input: ArticlesInquiry!) {
		getArticles(input: $input) {
			list {
				_id
				articleCategory
				articleTitle
				articleImages
				articleLang
				articleAnswered
				articleLikes
				articleViews
				articleComments
				createdAt
				authorName
				authorType
			}
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *        BOOKING         *
 *************************/

/** Free start times (UTC) of one treatment with one doctor on one Seoul day. Public. */
export const GET_AVAILABLE_SLOTS = gql`
	query GetAvailableSlots($input: AvailableSlotsInquiry!) {
		getAvailableSlots(input: $input)
	}
`;

/** "My Bookings": the patient's own bookings by tab. */
export const GET_BOOKINGS = gql`
	query GetBookings($input: BookingsInquiry!) {
		getBookings(input: $input) {
			list {
				_id
				bookingCode
				bookingStatus
				bookingDate
				bookingPrice
				bookingLang
				bookingInterpreter
				bookingDeclineReason
				respondDeadline
				completedAt
				bookingReviewed
				clinicId
				doctorId
				treatmentId
				createdAt
				clinicData {
					_id
					clinicName
					clinicDistrict
					clinicImages
					clinicLocation {
						coordinates
					}
				}
				doctorData {
					_id
					doctorName
				}
				treatmentData {
					_id
					treatmentName
					treatmentDuration
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

/** Only the total — the My Bookings tab counters. */
export const COUNT_BOOKINGS = gql`
	query CountBookings($input: BookingsInquiry!) {
		getBookings(input: $input) {
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *          CHAT          *
 *************************/

const CHAT_ROOM_FIELDS = `
	_id
	roomLastAt
	unread
	lastText
	memberId
	clinicId
	clinicName
	clinicLogo
	patientName
	patientLang
`;

export const CHAT_MESSAGE_FIELDS = `
	_id
	messageType
	senderType
	messageText
	messageLang
	messageTranslations {
		lang
		text
	}
	messageTranslationStatus
	displayText
	roomId
	senderId
	createdAt
`;

/** "Consultation Chat": the patient's rooms (a clinic sees its own — scoped by the token). */
export const GET_MY_ROOMS = gql`
	query GetMyRooms {
		getMyRooms {
			${CHAT_ROOM_FIELDS}
		}
	}
`;

/** One page of a room's history, newest first; `before` is the previous page's nextCursor. */
export const GET_ROOM_MESSAGES = gql`
	query GetRoomMessages($input: RoomMessagesInquiry!) {
		getRoomMessages(input: $input) {
			list {
				${CHAT_MESSAGE_FIELDS}
			}
			nextCursor
		}
	}
`;

/**************************
 *      NOTIFICATION      *
 *************************/

export const GET_MY_NOTIFICATIONS = gql`
	query GetMyNotifications($input: NotificationsInquiry!) {
		getMyNotifications(input: $input) {
			list {
				_id
				notificationType
				notificationStatus
				notificationGroup
				notificationTitle
				notificationDesc
				notificationParamsJson
				notificationCount
				notificationRefId
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
	query GetUnreadNotificationCount {
		getUnreadNotificationCount
	}
`;

/**************************
 *         MYPAGE         *
 *************************/

/**
 * The favorites lists leave out `meLiked`: the API does not fill it there (everything listed is
 * liked), and an empty value would overwrite the cards' `true` in the shared cache.
 */
const CLINIC_CARD_FIELDS = `
	_id
	memberId
	clinicName
	clinicNameKo
	clinicSpecialty
	clinicDistrict
	clinicLangs
	clinicInterpreterLangs
	clinicImages
	clinicMinPrice
	clinicRating
	clinicReviews
	clinicLikes
`;

const DOCTOR_CARD_FIELDS = `
	_id
	memberId
	doctorName
	doctorNameKo
	doctorSpecialty
	doctorExperience
	doctorLangs
	doctorImage
	doctorLikes
	doctorViews
	doctorRating
	doctorReviews
	clinicData {
		_id
		clinicName
		clinicNameKo
		clinicDistrict
	}
`;

/** One completed visit for "Write a verified review". */
export const GET_BOOKING = gql`
	query GetBooking($bookingId: String!) {
		getBooking(bookingId: $bookingId) {
			_id
			bookingCode
			bookingStatus
			bookingDate
			bookingLang
			bookingReviewed
			completedAt
			clinicId
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
	}
`;

export const GET_FAVORITE_CLINICS = gql`
	query GetFavoriteClinics($input: OrdinaryInquiry!) {
		getFavoriteClinics(input: $input) {
			list {
				${CLINIC_CARD_FIELDS}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_FAVORITE_DOCTORS = gql`
	query GetFavoriteDoctors($input: OrdinaryInquiry!) {
		getFavoriteDoctors(input: $input) {
			list {
				${DOCTOR_CARD_FIELDS}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_RECENTLY_VISITED = gql`
	query GetRecentlyVisited($input: OrdinaryInquiry!) {
		getRecentlyVisited(input: $input) {
			list {
				_id
				viewGroup
				viewRefId
				visitedAt
				clinic {
					_id
					clinicName
					clinicSpecialty
					clinicDistrict
					clinicImages
				}
				doctor {
					_id
					doctorName
					doctorSpecialty
					doctorImage
					clinicData {
						_id
						clinicName
					}
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MY_FOLLOWINGS = gql`
	query GetMyFollowings($input: FollowingsInquiry!) {
		getMyFollowings(input: $input) {
			list {
				_id
				followingId
				followingType
				createdAt
				followingMember {
					_id
					memberType
					memberDisplayName
					memberImage
				}
				followingClinic {
					_id
					memberId
					clinicName
					clinicSpecialty
					clinicDistrict
					clinicImages
				}
				followingDoctor {
					_id
					memberId
					doctorName
					doctorSpecialty
					doctorImage
					clinicData {
						_id
						clinicName
					}
				}
			}
			metaCounter {
				total
			}
			typeCounts {
				followingType
				total
			}
		}
	}
`;

export const GET_MY_REVIEWS = gql`
	query GetMyReviews($input: OrdinaryInquiry!) {
		getMyReviews(input: $input) {
			list {
				_id
				reviewStatus
				reviewRating
				reviewTags
				reviewContent
				reviewLang
				reviewNote
				reviewReply {
					replyContent
					replyLang
					replierType
					repliedAt
				}
				submittedAt
				bookingId
				clinicId
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

/** "Who opened my data": every read of the patient's answers or AI summary. */
export const GET_MY_ACCESS_LOGS = gql`
	query GetMyAccessLogs($input: OrdinaryInquiry!) {
		getMyAccessLogs(input: $input) {
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
 *    CLINIC DASHBOARD    *
 *************************/

const MY_CLINIC_FIELDS = `
	_id
	clinicStatus
	clinicName
	clinicNameKo
	clinicSpecialty
	clinicDistrict
	clinicAddress
	clinicPhone
	clinicHours {
		day
		open
		close
		closed
	}
	clinicLangs
	clinicInterpreterLangs
	clinicLogo
	clinicImages
	clinicDesc
	clinicReviewNote
	clinicLikes
	clinicFollowers
	clinicViews
	clinicRating
	clinicReviews
	memberId
	submittedAt
	verifiedAt
`;

export const GET_MY_CLINIC = gql`
	query GetMyClinic {
		getMyClinic {
			${MY_CLINIC_FIELDS}
		}
	}
`;

const CLINIC_BOOKING_FIELDS = `
	_id
	bookingCode
	bookingStatus
	bookingDate
	bookingPrice
	bookingLang
	bookingInterpreter
	bookingDeclineReason
	respondDeadline
	completedAt
	patientName
	memberId
	clinicId
	doctorId
	treatmentId
	createdAt
	doctorData {
		_id
		doctorName
		doctorImage
	}
	treatmentData {
		_id
		treatmentName
		treatmentDuration
	}
`;

/** The clinic's bookings: requests, upcoming, past, cancelled (`getBookings` scopes to the clinic). */
export const GET_CLINIC_BOOKINGS = gql`
	query GetClinicBookings($input: BookingsInquiry!) {
		getBookings(input: $input) {
			list {
				${CLINIC_BOOKING_FIELDS}
			}
			metaCounter {
				total
			}
		}
	}
`;

/** One booking with what the clinic needs to decide: the answers and the Korean AI summary. */
export const GET_CLINIC_BOOKING = gql`
	query GetClinicBooking($bookingId: String!) {
		getBooking(bookingId: $bookingId) {
			${CLINIC_BOOKING_FIELDS}
			bookingAiSummary
			bookingQuestionnaire {
				originalLang
				answers {
					question
					answer
				}
			}
			bookingHistory {
				status
				reason
				changedAt
			}
		}
	}
`;

export const GET_CLINIC_SCHEDULE = gql`
	query GetClinicSchedule($input: ClinicScheduleInquiry!) {
		getClinicSchedule(input: $input) {
			_id
			slotStatus
			slotStart
			slotBlockReason
			holdExpiresAt
			doctorId
			bookingId
			bookingData {
				bookingCode
				bookingStatus
				patientName
				treatmentName
			}
		}
	}
`;

export const GET_MY_CLINIC_TREATMENTS = gql`
	query GetMyClinicTreatments {
		getMyClinicTreatments {
			_id
			treatmentStatus
			treatmentName
			treatmentCategory
			treatmentDuration
			treatmentPrice
			treatmentPriceNote
			treatmentDesc
			treatmentAftercare
			treatmentLangs
			treatmentImages
			treatmentReviewNote
			treatmentBookingsMonth
			doctorIds
			treatmentDraft {
				treatmentName
				treatmentCategory
				treatmentPrice
				treatmentPriceNote
				treatmentDesc
				treatmentImages
				submittedAt
			}
			doctors {
				_id
				doctorName
				doctorImage
			}
		}
	}
`;

export const GET_MY_CLINIC_DOCTORS = gql`
	query GetMyClinicDoctors {
		getMyClinicDoctors {
			_id
			doctorStatus
			doctorName
			doctorNameKo
			doctorSpecialty
			doctorExperience
			doctorLangs
			doctorImage
			doctorRating
			doctorReviews
			memberId
		}
	}
`;

/** Reviews of the clinic or of one doctor, with the "Needs reply" filter of the dashboards. */
export const GET_REPLY_REVIEWS = gql`
	query GetReplyReviews($input: ReviewsInquiry!) {
		getReviews(input: $input) {
			list {
				_id
				reviewRating
				reviewTags
				reviewContent
				reviewLang
				reviewReply {
					replyContent
					replyLang
					replierType
					repliedAt
				}
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
			summary {
				rating
				reviews
				distribution {
					stars
					count
				}
			}
		}
	}
`;

/**************************
 *      DOCTOR PANEL      *
 *************************/

export const GET_MY_DOCTOR_PROFILE = gql`
	query GetMyDoctorProfile {
		getMyDoctorProfile {
			_id
			doctorStatus
			doctorName
			doctorNameKo
			doctorSpecialty
			doctorExperience
			doctorLangs
			doctorBio
			doctorImage
			doctorCareer {
				title
				place
				from
				to
			}
			doctorLikes
			doctorViews
			doctorFollowers
			doctorRating
			doctorReviews
			clinicId
			memberId
			clinicData {
				_id
				clinicName
			}
		}
	}
`;

/**************************
 *       COMMUNITY        *
 *************************/

/** One post with its body; a signed-in reader also gets `meLiked`. Each open counts a view. */
export const GET_ARTICLE = gql`
	query GetArticle($articleId: String!) {
		getArticle(articleId: $articleId) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImages
			articleLang
			articleAnswered
			articleLikes
			articleViews
			articleComments
			memberId
			createdAt
			updatedAt
			authorName
			authorType
			meLiked
		}
	}
`;

/** The community lists: like GET_ARTICLES plus the author id and a short body for the card. */
export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: ArticlesInquiry!) {
		getArticles(input: $input) {
			list {
				_id
				articleCategory
				articleTitle
				articleContent
				articleImages
				articleLang
				articleAnswered
				articleLikes
				articleViews
				articleComments
				memberId
				createdAt
				authorName
				authorType
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentContent
				commentLang
				articleId
				memberId
				createdAt
				updatedAt
				authorName
				authorType
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

/** Notices or FAQ, with the text in `lang` when a translation exists (`display…`). Public. */
export const GET_NOTICES = gql`
	query GetNotices($input: NoticesInquiry!) {
		getNotices(input: $input) {
			list {
				_id
				noticeCategory
				noticeFaqCategory
				noticePinned
				noticeTitle
				noticeViews
				publishedAt
				createdAt
				displayTitle
				displayContent
				displayLang
			}
			metaCounter {
				total
			}
		}
	}
`;

/** A signed-in reader gets their profile language (the API's rule); `lang` serves a guest. */
export const GET_NOTICE = gql`
	query GetNotice($noticeId: String!, $lang: Language) {
		getNotice(noticeId: $noticeId, lang: $lang) {
			_id
			noticeCategory
			noticePinned
			noticeTitle
			noticeContent
			noticeViews
			publishedAt
			createdAt
			displayTitle
			displayContent
			displayLang
		}
	}
`;

const INQUIRY_FIELDS = `
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
	bookingId
	bookingCode
	createdAt
	updatedAt
`;

export const GET_MY_INQUIRIES = gql`
	query GetMyInquiries($input: OrdinaryInquiry!) {
		getMyInquiries(input: $input) {
			list {
				${INQUIRY_FIELDS}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_INQUIRY = gql`
	query GetInquiry($inquiryId: String!) {
		getInquiry(inquiryId: $inquiryId) {
			${INQUIRY_FIELDS}
		}
	}
`;

/**************************
 *        ASSISTANT       *
 *************************/

const ASSISTANT_HOLD_FIELDS = `
	treatmentId
	doctorId
	slotStart
	label
	clinicName
	treatmentName
	priceKrw
	expiresAt
`;

/** The patient's active conversation (texts only — the cards of old replies are not kept). */
export const GET_MY_ASSISTANT_SESSION = gql`
	query GetMyAssistantSession {
		getMyAssistantSession {
			_id
			sessionStatus
			sessionLang
			turns {
				role
				text
			}
			pendingHold {
				${ASSISTANT_HOLD_FIELDS}
			}
			turnCount
		}
	}
`;

/** Only the doctor's clinic: where the assistant's held time is booked. */
export const GET_DOCTOR_CLINIC = gql`
	query GetDoctorClinic($doctorId: String!) {
		getDoctor(doctorId: $doctorId) {
			_id
			clinicId
		}
	}
`;

/**************************
 *       FACE SCAN        *
 *************************/

export const GET_MY_FACE_SCANS = gql`
	query GetMyFaceScans($input: OrdinaryInquiry!) {
		getMyFaceScans(input: $input) {
			list {
				_id
				faceScanStatus
				findings {
					concern
					severity
					zone
				}
				qualityIssues
				faceScanSummary
				faceScanLang
				suggestedSpecialty
				aiProvider
				disclaimer
				createdAt
			}
			metaCounter {
				total
			}
		}
	}
`;
