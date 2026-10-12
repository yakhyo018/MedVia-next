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
