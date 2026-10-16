import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Button } from '@mui/material';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { GET_BOOKINGS } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { Booking } from '../../types/booking/booking';
import { BookingStatus } from '../../enums/booking.enum';
import { MemberType } from '../../enums/member.enum';
import { LIST_MAX } from '../../config';
import { isReviewable, seoulTime } from '../../utils';

interface ReviewInviteProps {
	/** The page's clinic or doctor: only a visit there can be reviewed here. */
	clinicId?: string;
	doctorId?: string;
	/** The section has no reviews yet (the hint then says so). */
	empty: boolean;
}

/**
 * Where reviews come from, on the clinic and doctor pages. A review belongs to a completed
 * MedVia visit (the API's rule: COMPLETED, within 30 days, one per booking), so there is no
 * free-text box here: a patient with such a visit gets "Write a review", everyone else a line
 * explaining why there is none.
 */
const ReviewInvite = (props: ReviewInviteProps) => {
	const { clinicId, doctorId, empty } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const isPatient = user.memberType === MemberType.USER;

	/** APOLLO REQUESTS **/
	const { data } = useQuery(GET_BOOKINGS, {
		variables: { input: { page: 1, limit: LIST_MAX, bookingStatus: BookingStatus.COMPLETED } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const visit: Booking | undefined = (data?.getBookings?.list ?? []).find(
		(booking: Booking) =>
			isReviewable(booking) &&
			(!clinicId || booking.clinicId === clinicId) &&
			(!doctorId || booking.doctorId === doctorId),
	);

	if (visit) {
		return (
			<div className={'review-invite'}>
				<span className={'icon'}>
					<RateReviewOutlinedIcon />
				</span>
				<div className={'text'}>
					<strong>{t('How was your visit?')}</strong>
					<span>
						{[visit.treatmentData?.treatmentName, seoulTime(visit.bookingDate, router.locale, false)]
							.filter(Boolean)
							.join(' · ')}
					</span>
				</div>
				<Button variant={'contained'} LinkComponent={Link} href={`/mypage/reviews/write?booking=${visit._id}`}>
					{t('Write a review')}
				</Button>
			</div>
		);
	}

	return (
		<p className={'review-hint'}>
			<VerifiedOutlinedIcon />
			<span>
				{empty
					? t('No reviews yet. Reviews come only from completed visits.')
					: t('Reviews come only from completed MedVia visits.')}
				{isPatient && (
					<>
						{' '}
						<Link href={'/mypage/reviews'}>{t('My Reviews')}</Link>
					</>
				)}
			</span>
		</p>
	);
};

export default ReviewInvite;
