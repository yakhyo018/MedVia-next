import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberEmail
			memberMustChangePassword
			memberAiConsentAt
			memberFullName
			memberPhone
			memberImage
			memberCountry
			memberLang
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberEmail
			memberMustChangePassword
			memberAiConsentAt
			memberFullName
			memberPhone
			memberImage
			memberCountry
			memberLang
			createdAt
			updatedAt
			accessToken
		}
	}
`;

/** Google sign-in / sign-up with the ID token Google gave the browser; the API verifies it. */
export const GOOGLE_LOGIN = gql`
	mutation GoogleLogin($input: GoogleLoginInput!) {
		googleLogin(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberEmail
			memberMustChangePassword
			memberAiConsentAt
			memberFullName
			memberPhone
			memberImage
			memberCountry
			memberLang
			createdAt
			updatedAt
			accessToken
		}
	}
`;

/** No input: the refresh token is the httpOnly `medvia_rt` cookie the browser sends itself. */
export const REFRESH_TOKEN = gql`
	mutation RefreshToken {
		refreshToken {
			_id
			memberType
			memberStatus
			memberAuthType
			memberEmail
			memberMustChangePassword
			memberAiConsentAt
			memberFullName
			memberPhone
			memberImage
			memberCountry
			memberLang
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LOGOUT = gql`
	mutation Logout {
		logout
	}
`;

/**************************
 *          LIKE          *
 *************************/

/** One click likes, the next one removes the like. Patients only. */
export const LIKE_TARGET = gql`
	mutation LikeTarget($input: LikeTargetInput!) {
		likeTarget(input: $input) {
			likeGroup
			likeRefId
			meLiked
			likes
		}
	}
`;

/**************************
 *         FOLLOW         *
 *************************/

/** memberId: the account behind the doctor or clinic (Doctor.memberId), not the doctor's _id. */
export const FOLLOW_MEMBER = gql`
	mutation FollowMember($input: FollowInput!) {
		followMember(input: $input) {
			_id
			followingId
			followingType
		}
	}
`;

export const UNFOLLOW_MEMBER = gql`
	mutation UnfollowMember($input: FollowInput!) {
		unfollowMember(input: $input)
	}
`;

/**************************
 *        BOOKING         *
 *************************/

/** Step 1: reserve the treatment's slots for 10 minutes (patients only). */
export const HOLD_SLOTS = gql`
	mutation HoldSlots($input: SlotHoldInput!) {
		holdSlots(input: $input) {
			slotIds
			slotStart
			holdExpiresAt
		}
	}
`;

/** Step 3: send the request with the questionnaire and consents; the hold becomes a PENDING booking. */
export const CREATE_BOOKING = gql`
	mutation CreateBooking($input: BookingCreateInput!) {
		createBooking(input: $input) {
			_id
			bookingCode
			bookingStatus
			bookingDate
			bookingPrice
			respondDeadline
			createdAt
		}
	}
`;

/** The patient cancels a request or a confirmed booking. */
export const UPDATE_BOOKING_STATUS = gql`
	mutation UpdateBookingStatus($input: BookingStatusUpdate!) {
		updateBookingStatus(input: $input) {
			_id
			bookingStatus
		}
	}
`;

/**************************
 *          CHAT          *
 *************************/

/** "Chat with clinic": the patient's room with this clinic, created on first use. */
export const OPEN_ROOM = gql`
	mutation OpenRoom($clinicId: String!) {
		openRoom(clinicId: $clinicId) {
			_id
			clinicId
			clinicName
			unread
			roomLastAt
		}
	}
`;

export const SEND_MESSAGE = gql`
	mutation SendMessage($input: MessageSendInput!) {
		sendMessage(input: $input) {
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
		}
	}
`;

export const MARK_ROOM_READ = gql`
	mutation MarkRoomRead($roomId: String!) {
		markRoomRead(roomId: $roomId) {
			_id
			unread
		}
	}
`;

/**************************
 *      NOTIFICATION      *
 *************************/

/** No ids = mark all read. Returns how many changed. */
export const MARK_NOTIFICATIONS_READ = gql`
	mutation MarkNotificationsRead($input: NotificationsReadInput!) {
		markNotificationsRead(input: $input)
	}
`;

/** Allow AI processing — the chat's automatic translation needs it. */
export const SET_AI_CONSENT = gql`
	mutation SetAiConsent($agreed: Boolean!) {
		setAiConsent(agreed: $agreed) {
			_id
			memberAiConsentAt
		}
	}
`;

/**************************
 *         MYPAGE         *
 *************************/

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
			_id
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
			updatedAt
		}
	}
`;

/** Revokes every access token and the other devices' sessions; returns a fresh access token. */
export const CHANGE_PASSWORD = gql`
	mutation ChangePassword($input: ChangePasswordInput!) {
		changePassword(input: $input) {
			_id
			memberMustChangePassword
			accessToken
		}
	}
`;

export const CREATE_REVIEW = gql`
	mutation CreateReview($input: ReviewCreateInput!) {
		createReview(input: $input) {
			_id
			reviewStatus
		}
	}
`;

export const UPDATE_REVIEW = gql`
	mutation UpdateReview($input: ReviewUpdate!) {
		updateReview(input: $input) {
			_id
			reviewStatus
			reviewRating
			reviewTags
			reviewContent
			reviewLang
			reviewNote
			submittedAt
		}
	}
`;

export const REMOVE_REVIEW = gql`
	mutation RemoveReview($reviewId: String!) {
		removeReview(reviewId: $reviewId) {
			_id
			reviewStatus
		}
	}
`;

export const CLEAR_RECENTLY_VISITED = gql`
	mutation ClearRecentlyVisited {
		clearRecentlyVisited
	}
`;

/**************************
 *    CLINIC DASHBOARD    *
 *************************/

/** "I am a clinic": the account and its clinic (PENDING review); signs the new account in. */
export const SIGNUP_CLINIC = gql`
	mutation SignupClinic($input: ClinicSignupInput!) {
		signupClinic(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberEmail
			memberMustChangePassword
			memberAiConsentAt
			memberFullName
			memberPhone
			memberImage
			memberCountry
			memberLang
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const UPDATE_MY_CLINIC = gql`
	mutation UpdateMyClinic($input: ClinicUpdate!) {
		updateMyClinic(input: $input) {
			_id
			clinicStatus
			clinicReviewNote
		}
	}
`;

/** After the admin asked for changes: send the clinic back to review. */
export const RESUBMIT_CLINIC = gql`
	mutation ResubmitClinic {
		resubmitClinic {
			_id
			clinicStatus
			clinicReviewNote
		}
	}
`;

/** Returns how many slots were made and how many the range allowed (existing ones are kept). */
export const CREATE_SLOTS = gql`
	mutation CreateSlots($input: SlotsCreateInput!) {
		createSlots(input: $input) {
			created
			planned
		}
	}
`;

export const SET_SLOTS_BLOCKED = gql`
	mutation SetSlotsBlocked($input: SlotsBlockInput!) {
		setSlotsBlocked(input: $input) {
			_id
			slotStatus
			slotBlockReason
		}
	}
`;

export const CREATE_TREATMENT = gql`
	mutation CreateTreatment($input: TreatmentCreateInput!) {
		createTreatment(input: $input) {
			_id
			treatmentStatus
		}
	}
`;

export const UPDATE_TREATMENT = gql`
	mutation UpdateTreatment($input: TreatmentUpdate!) {
		updateTreatment(input: $input) {
			_id
			treatmentStatus
		}
	}
`;

export const RESUBMIT_TREATMENT = gql`
	mutation ResubmitTreatment($treatmentId: String!) {
		resubmitTreatment(treatmentId: $treatmentId) {
			_id
			treatmentStatus
			treatmentReviewNote
		}
	}
`;

export const CANCEL_TREATMENT_REVIEW = gql`
	mutation CancelTreatmentReview($treatmentId: String!) {
		cancelTreatmentReview(treatmentId: $treatmentId) {
			_id
			treatmentStatus
			treatmentReviewNote
		}
	}
`;

export const HIDE_TREATMENT = gql`
	mutation HideTreatment($treatmentId: String!) {
		hideTreatment(treatmentId: $treatmentId) {
			_id
			treatmentStatus
			treatmentReviewNote
		}
	}
`;

export const SHOW_TREATMENT = gql`
	mutation ShowTreatment($treatmentId: String!) {
		showTreatment(treatmentId: $treatmentId) {
			_id
			treatmentStatus
			treatmentReviewNote
		}
	}
`;

export const REMOVE_TREATMENT = gql`
	mutation RemoveTreatment($treatmentId: String!) {
		removeTreatment(treatmentId: $treatmentId) {
			_id
			treatmentStatus
			treatmentReviewNote
		}
	}
`;

/** The clinic makes the doctor's account; it works at once with this email and password. */
export const CREATE_DOCTOR = gql`
	mutation CreateDoctor($input: DoctorCreateInput!) {
		createDoctor(input: $input) {
			_id
			doctorName
		}
	}
`;

export const UPDATE_DOCTOR_BY_CLINIC = gql`
	mutation UpdateDoctorByClinic($input: DoctorClinicUpdate!) {
		updateDoctorByClinic(input: $input) {
			_id
			doctorSpecialty
		}
	}
`;

export const HIDE_DOCTOR = gql`
	mutation HideDoctor($doctorId: String!) {
		hideDoctor(doctorId: $doctorId) {
			_id
			doctorStatus
		}
	}
`;

export const SHOW_DOCTOR = gql`
	mutation ShowDoctor($doctorId: String!) {
		showDoctor(doctorId: $doctorId) {
			_id
			doctorStatus
		}
	}
`;

export const REMOVE_DOCTOR = gql`
	mutation RemoveDoctor($doctorId: String!) {
		removeDoctor(doctorId: $doctorId) {
			_id
			doctorStatus
		}
	}
`;

export const RESET_DOCTOR_PASSWORD = gql`
	mutation ResetDoctorPassword($input: DoctorPasswordReset!) {
		resetDoctorPassword(input: $input)
	}
`;

/** The clinic's or the doctor's public reply. Writing again replaces it. */
export const REPLY_TO_REVIEW = gql`
	mutation ReplyToReview($input: ReviewReplyInput!) {
		replyToReview(input: $input) {
			_id
			reviewReply {
				replyContent
				replyLang
				replierType
				repliedAt
			}
		}
	}
`;

/**************************
 *      DOCTOR PANEL      *
 *************************/

export const UPDATE_MY_DOCTOR_PROFILE = gql`
	mutation UpdateMyDoctorProfile($input: DoctorProfileUpdate!) {
		updateMyDoctorProfile(input: $input) {
			_id
			doctorName
			doctorNameKo
			doctorImage
			doctorExperience
			doctorLangs
			doctorBio
			doctorCareer {
				title
				place
				from
				to
			}
		}
	}
`;

/**************************
 *       COMMUNITY        *
 *************************/

export const CREATE_ARTICLE = gql`
	mutation CreateArticle($input: ArticleInput!) {
		createArticle(input: $input) {
			_id
			articleCategory
		}
	}
`;

export const UPDATE_ARTICLE = gql`
	mutation UpdateArticle($input: ArticleUpdate!) {
		updateArticle(input: $input) {
			_id
			articleTitle
			articleContent
			articleImages
			articleLang
			updatedAt
		}
	}
`;

export const REMOVE_ARTICLE = gql`
	mutation RemoveArticle($articleId: String!) {
		removeArticle(articleId: $articleId) {
			_id
			articleStatus
		}
	}
`;

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
		}
	}
`;

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
			commentContent
			commentLang
			updatedAt
		}
	}
`;

export const REMOVE_COMMENT = gql`
	mutation RemoveComment($commentId: String!) {
		removeComment(commentId: $commentId) {
			_id
		}
	}
`;

/** A post or comment reported as spam, advertising, …; five reports hide it until the admin decides. */
export const REPORT_CONTENT = gql`
	mutation ReportContent($input: ReportInput!) {
		reportContent(input: $input) {
			_id
			reportStatus
		}
	}
`;

/**************************
 *           CS           *
 *************************/

export const CREATE_INQUIRY = gql`
	mutation CreateInquiry($input: InquiryInput!) {
		createInquiry(input: $input) {
			_id
			inquiryStatus
		}
	}
`;

export const ADD_INQUIRY_MESSAGE = gql`
	mutation AddInquiryMessage($input: InquiryMessageInput!) {
		addInquiryMessage(input: $input) {
			_id
			inquiryStatus
			inquiryMessages {
				senderType
				text
				lang
				createdAt
			}
			updatedAt
		}
	}
`;

/**************************
 *        ASSISTANT       *
 *************************/

export const SEND_ASSISTANT_MESSAGE = gql`
	mutation SendAssistantMessage($input: AssistantMessageInput!) {
		sendAssistantMessage(input: $input) {
			sessionId
			text
			clinics {
				clinicId
				clinicName
				district
				rating
				minPriceKrw
			}
			slots {
				treatmentId
				doctorId
				slotStart
				label
			}
			pendingHold {
				treatmentId
				doctorId
				slotStart
				label
				clinicName
				treatmentName
				priceKrw
				expiresAt
			}
			toolsUsed
		}
	}
`;

/** The only way from the assistant's proposal to a held slot — pressed by the patient. */
export const CONFIRM_ASSISTANT_HOLD = gql`
	mutation ConfirmAssistantHold($sessionId: String!) {
		confirmAssistantHold(sessionId: $sessionId) {
			slotIds
			slotStart
			holdExpiresAt
		}
	}
`;

export const CLOSE_ASSISTANT_SESSION = gql`
	mutation CloseAssistantSession($sessionId: String!) {
		closeAssistantSession(sessionId: $sessionId) {
			_id
			sessionStatus
		}
	}
`;
