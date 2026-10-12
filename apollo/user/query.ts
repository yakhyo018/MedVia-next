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
