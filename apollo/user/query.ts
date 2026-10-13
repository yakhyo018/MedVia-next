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
				clinicId
				doctorId
				treatmentId
				createdAt
				clinicData {
					_id
					clinicName
					clinicDistrict
					clinicImages
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
