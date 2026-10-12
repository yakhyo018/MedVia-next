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
 *         DOCTOR         *
 *************************/

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
