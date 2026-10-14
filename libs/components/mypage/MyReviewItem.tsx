import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Button } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import StatusChip from '../common/StatusChip';
import Stars from '../review/Stars';
import { Review } from '../../types/review/review';
import { ReviewStatus } from '../../enums/review.enum';
import { seoulTime } from '../../utils';

/** The patient's words for the moderation states. */
export const REVIEW_STATUS_LABEL: Record<string, string> = {
	[ReviewStatus.ACTIVE]: 'Published',
	[ReviewStatus.PENDING]: 'In review',
	[ReviewStatus.EDIT_REQUESTED]: 'Edit requested',
	[ReviewStatus.HIDDEN]: 'Hidden',
};

const EDITABLE: string[] = [ReviewStatus.ACTIVE, ReviewStatus.PENDING, ReviewStatus.EDIT_REQUESTED];

interface MyReviewItemProps {
	review: Review;
	removing: boolean;
	onRemove: (review: Review) => void;
}

/** One of the patient's own reviews, with its moderation state and the admin's note. */
const MyReviewItem = (props: MyReviewItemProps) => {
	const { review, removing, onRemove } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const status = review.reviewStatus ?? ReviewStatus.PENDING;
	const published = status === ReviewStatus.ACTIVE;
	const date = seoulTime(review.submittedAt ?? review.createdAt, router.locale, false);

	return (
		<Box component={'article'} className={'my-review mv-enter'}>
			<div className={'top'}>
				<StatusChip
					// Waiting for moderation is neutral grey here, not a booking's amber "Pending".
					status={status === ReviewStatus.PENDING ? 'IN_REVIEW' : status}
					label={t(REVIEW_STATUS_LABEL[status] ?? status)}
					size={'small'}
				/>
				<time>{published ? t('Published {{date}}', { date }) : t('Submitted {{date}}', { date })}</time>
			</div>
			<Stars value={review.reviewRating} />
			<p className={'content'}>{review.reviewContent}</p>
			{status === ReviewStatus.EDIT_REQUESTED && review.reviewNote && (
				<div className={'note'}>
					<strong>{t('Note from MedVia')}:</strong> {review.reviewNote}
				</div>
			)}
			{status === ReviewStatus.HIDDEN && (
				<div className={'note danger'}>
					{review.reviewNote ?? t('This review breaks the medical advertising rules and is hidden.')}
				</div>
			)}
			{review.reviewReply && (
				<div className={'reply'}>
					<strong>
						<ReplyRoundedIcon />
						{review.reviewReply.replierType === 'DOCTOR' ? t('Reply from the doctor') : t('Reply from the clinic')}
					</strong>
					<p>{review.reviewReply.replyContent}</p>
				</div>
			)}
			<span className={'what'}>
				{review.treatmentName}
				{review.clinicName && (
					<>
						{' · '}
						<Link href={`/clinics/detail?id=${review.clinicId}`}>{review.clinicName}</Link>
					</>
				)}
				<span className={'verified'}>
					<CheckRoundedIcon />
					{t('Verified visit')}
				</span>
			</span>
			{EDITABLE.includes(status) && (
				<div className={'actions'}>
					<Button
						variant={'outlined'}
						size={'small'}
						LinkComponent={Link}
						href={`/mypage/reviews/write?review=${review._id}`}
					>
						{t('Edit')}
					</Button>
					<Button
						variant={'outlined'}
						color={'error'}
						size={'small'}
						disabled={removing}
						onClick={() => onRemove(review)}
					>
						{t('Delete')}
					</Button>
				</div>
			)}
		</Box>
	);
};

export default MyReviewItem;
