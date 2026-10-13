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
