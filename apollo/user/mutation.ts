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
