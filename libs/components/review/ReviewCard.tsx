import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import { Review } from '../../types/review/review';
import { initials, seoulTime } from '../../utils';
import Stars from './Stars';

interface ReviewCardProps {
	review: Review;
}

const ReviewCard = (props: ReviewCardProps) => {
	const { review } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const date = seoulTime(review.visitDate ?? review.createdAt, router.locale, false);

	return (
		<Box className={'review-card'} component={'article'}>
			<div className={'top'}>
				<Stars value={review.reviewRating} />
				<span className={'verified'}>
					<CheckRoundedIcon />
					{t('Verified visit')}
				</span>
			</div>
			<p className={'content'}>{review.reviewContent}</p>
			{review.reviewReply && (
				<div className={'reply'}>
					<strong>
						<ReplyRoundedIcon />
						{review.reviewReply.replierType === 'DOCTOR' ? t('Reply from the doctor') : t('Reply from the clinic')}
					</strong>
					<p>{review.reviewReply.replyContent}</p>
				</div>
			)}
			<div className={'author'}>
				<span className={'avatar'}>{initials(review.patientName)}</span>
				<div>
					<strong>{review.patientName}</strong>
					{review.treatmentName && (
						<span>
							{review.treatmentName}
							{review.clinicName && ` · ${review.clinicName}`}
						</span>
					)}
				</div>
				<time>{date}</time>
			</div>
		</Box>
	);
};

export default ReviewCard;
