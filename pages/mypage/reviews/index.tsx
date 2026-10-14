import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton, Stack } from '@mui/material';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import withLayoutBasic from '../../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../../libs/components/mypage/MyPageFrame';
import MyReviewItem from '../../../libs/components/mypage/MyReviewItem';
import EmptyState from '../../../libs/components/common/EmptyState';
import { GET_BOOKINGS, GET_MY_REVIEWS } from '../../../apollo/user/query';
import { REMOVE_REVIEW } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { Review } from '../../../libs/types/review/review';
import { Booking } from '../../../libs/types/booking/booking';
import { BookingStatus } from '../../../libs/enums/booking.enum';
import { ReviewStatus } from '../../../libs/enums/review.enum';
import { MemberType } from '../../../libs/enums/member.enum';
import { LIST_MAX } from '../../../libs/config';
import { sweetDangerConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { isReviewable, seoulTime } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 20;

/**
 * The API pages a patient's reviews without a status filter; a patient writes a handful, so the
 * tabs filter what is loaded. "In review" also holds the ones the admin sent back for an edit.
 */
const TABS: { key: string; label: string; statuses?: ReviewStatus[] }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'published', label: 'Published', statuses: [ReviewStatus.ACTIVE] },
	{ key: 'review', label: 'In review', statuses: [ReviewStatus.PENDING, ReviewStatus.EDIT_REQUESTED] },
];

/** "My Reviews": what the patient wrote, its moderation state, and the visits still waiting for one. */
const MyReviews: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const [removingId, setRemovingId] = useState<string>('');
	const active = TABS.find((item) => item.key === router.query.tab) ?? TABS[0];
	const isPatient = user.memberType === MemberType.USER;

	/** APOLLO REQUESTS **/
	const { data, previousData, loading, refetch } = useQuery(GET_MY_REVIEWS, {
		variables: { input: { page: 1, limit } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const { data: completedData } = useQuery(GET_BOOKINGS, {
		variables: { input: { page: 1, limit: 20, bookingStatus: BookingStatus.COMPLETED } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const [removeReview] = useMutation(REMOVE_REVIEW);
	const reviews: Review[] = (data ?? previousData)?.getMyReviews?.list ?? [];
	const total: number = (data ?? previousData)?.getMyReviews?.metaCounter?.[0]?.total ?? 0;
	const toWrite: Booking[] = (completedData?.getBookings?.list ?? []).filter(isReviewable);
	const shown = reviews.filter(
		(review) => !active.statuses || active.statuses.includes(review.reviewStatus ?? ReviewStatus.PENDING),
	);
	const countOf = (statuses?: ReviewStatus[]) =>
		statuses
			? reviews.filter((review) => statuses.includes(review.reviewStatus ?? ReviewStatus.PENDING)).length
			: total;

	/** HANDLERS **/
	const tabHandler = async (key: string) => {
		await router.push({ pathname: router.pathname, query: key === 'all' ? {} : { tab: key } }, undefined, {
			shallow: true,
		});
	};

	const removeHandler = async (review: Review) => {
		try {
			const sure = await sweetDangerConfirmAlert(
				t('Delete this review? You cannot write another one for this visit.'),
				t('Delete'),
			);
			if (!sure) return;
			setRemovingId(review._id);
			await removeReview({ variables: { reviewId: review._id } });
			await refetch();
			await sweetTopSmallSuccessAlert(t('Review deleted'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setRemovingId('');
		}
	};

	let body: React.ReactNode;
	if (loading && reviews.length === 0) {
		body = (
			<Stack className={'my-review-list'}>
				{Array.from({ length: 2 }).map((_, index) => (
					<Skeleton key={index} variant={'rounded'} height={180} />
				))}
			</Stack>
		);
	} else if (shown.length === 0) {
		body = (
			<EmptyState
				title={active.key === 'all' ? t('No reviews yet') : t('Nothing in this tab')}
				text={t('After a completed visit you can write a verified review.')}
			/>
		);
	} else {
		body = (
			<Stack className={'my-review-list'}>
				{shown.map((review) => (
					<MyReviewItem
						key={review._id}
						review={review}
						removing={removingId === review._id}
						onRemove={removeHandler}
					/>
				))}
				{reviews.length < total && limit < LIST_MAX && (
					<Button
						variant={'outlined'}
						className={'more'}
						disabled={loading}
						onClick={() => setLimit(Math.min(limit + PAGE_SIZE, LIST_MAX))}
					>
						{t('Show more')}
					</Button>
				)}
			</Stack>
		);
	}

	return (
		<MyPageFrame title={t('My Reviews')} className={'my-reviews'}>
			<Box className={'booking-tabs'} role={'tablist'} aria-label={t('My Reviews')}>
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type={'button'}
						role={'tab'}
						aria-selected={tab.key === active.key}
						onClick={() => tabHandler(tab.key)}
					>
						{t(tab.label)} ({countOf(tab.statuses)})
					</button>
				))}
			</Box>
			{toWrite.slice(0, 2).map((booking) => (
				<Box key={booking._id} className={'review-prompt'}>
					<span className={'icon'}>
						<StarBorderRoundedIcon />
					</span>
					<div className={'text'}>
						<strong>
							{t('How was {{treatment}} at {{clinic}}?', {
								treatment: booking.treatmentData?.treatmentName,
								clinic: booking.clinicData?.clinicName,
							})}
						</strong>
						<span>
							{t('Your visit on {{date}} is completed. Only patients with a completed visit can review.', {
								date: seoulTime(booking.bookingDate, router.locale, false),
							})}
						</span>
					</div>
					<Button variant={'contained'} LinkComponent={Link} href={`/mypage/reviews/write?booking=${booking._id}`}>
						{t('Write a verified review')}
					</Button>
				</Box>
			))}
			{body}
		</MyPageFrame>
	);
};

export default withLayoutBasic(MyReviews);
