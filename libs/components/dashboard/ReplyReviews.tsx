import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Box, Button, MenuItem, Skeleton, Stack, TextField } from '@mui/material';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import Stars from '../review/Stars';
import RatingSummary from '../review/RatingSummary';
import EmptyState from '../common/EmptyState';
import { GET_REPLY_REVIEWS } from '../../../apollo/user/query';
import { REPLY_TO_REVIEW } from '../../../apollo/user/mutation';
import { Review } from '../../types/review/review';
import { Language } from '../../enums/common.enum';
import { LANGUAGES, LIST_MAX } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { initials, seoulTime } from '../../utils';

const PAGE_SIZE = 10;
const REPLY_MIN = 2;
const REPLY_MAX = 1000;

interface ReplyReviewsProps {
	/** Whose reviews: the clinic's or one doctor's. */
	clinicId?: string;
	doctorId?: string;
	/** Who signs the reply. */
	as: 'clinic' | 'doctor';
}

interface ReplyItemProps {
	review: Review;
	as: 'clinic' | 'doctor';
	onSaved: () => void;
}

/** One review with its public reply, or a box to write one. Writing again replaces the reply. */
const ReplyItem = (props: ReplyItemProps) => {
	const { review, as, onSaved } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const reply = review.reviewReply;
	const [editing, setEditing] = useState<boolean>(!reply);
	const [text, setText] = useState<string>(reply?.replyContent ?? '');
	const [lang, setLang] = useState<Language>(reply?.replyLang ?? Language.EN);
	const [replyToReview, { loading }] = useMutation(REPLY_TO_REVIEW);

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		if (text.trim().length < REPLY_MIN) return;
		try {
			await replyToReview({
				variables: { input: { reviewId: review._id, replyContent: text.trim(), replyLang: lang } },
			});
			setEditing(false);
			onSaved();
			await sweetTopSmallSuccessAlert(t('Reply published'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return (
		<Box component={'article'} className={'reply-review card'}>
			<div className={'top'}>
				<span className={'patient'}>
					<span className={'avatar'}>{initials(review.patientName)}</span>
					<span className={'who'}>
						<strong>{review.patientName}</strong>
						<span>
							{[
								review.treatmentName,
								review.doctorName ? `${t('Dr.')} ${review.doctorName}` : '',
								seoulTime(review.visitDate ?? review.createdAt, router.locale, false),
							]
								.filter(Boolean)
								.join(' · ')}
						</span>
					</span>
				</span>
				{!reply && <span className={'needs'}>{t('Needs reply')}</span>}
			</div>
			<Stars value={review.reviewRating} />
			<p className={'content'}>{review.reviewContent}</p>
			{reply && !editing && (
				<div className={'reply'}>
					<strong>
						<ReplyRoundedIcon />
						{reply.replierType === 'DOCTOR' ? t('Reply from the doctor') : t('Reply from the clinic')} ·{' '}
						{seoulTime(reply.repliedAt, router.locale, false)}
					</strong>
					<p>{reply.replyContent}</p>
					<Button size={'small'} onClick={() => setEditing(true)}>
						{t('Edit reply')}
					</Button>
				</div>
			)}
			{editing && (
				<form className={'reply-form'} onSubmit={submitHandler}>
					<TextField
						multiline
						minRows={2}
						fullWidth
						value={text}
						placeholder={t('Write a public reply…')}
						onChange={(event) => setText(event.target.value)}
						inputProps={{ maxLength: REPLY_MAX, 'aria-label': t('Your reply') }}
					/>
					<div className={'reply-tools'}>
						<TextField
							select
							size={'small'}
							value={lang}
							onChange={(event) => setLang(event.target.value as Language)}
							inputProps={{ 'aria-label': t('Written in') }}
						>
							{LANGUAGES.map((item) => (
								<MenuItem key={item.code} value={item.code}>
									{item.label}
								</MenuItem>
							))}
						</TextField>
						<span className={'hint'}>
							{as === 'clinic'
								? t('Public, signed by the clinic. Patients read it as written.')
								: t('Public, signed by you. Patients read it as written.')}
						</span>
						{reply && (
							<Button variant={'text'} onClick={() => setEditing(false)}>
								{t('Cancel')}
							</Button>
						)}
						<Button type={'submit'} variant={'contained'} disabled={loading || text.trim().length < REPLY_MIN}>
							{t('Reply')}
						</Button>
					</div>
				</form>
			)}
		</Box>
	);
};

/** Reviews of the clinic or a doctor, "Needs reply" first-class: the dashboards' review pages. */
const ReplyReviews = (props: ReplyReviewsProps) => {
	const { clinicId, doctorId, as } = props;
	const { t } = useTranslation('common');
	const [needsReply, setNeedsReply] = useState<boolean>(false);
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const base = { ...(clinicId ? { clinicId } : {}), ...(doctorId ? { doctorId } : {}) };

	const { data, previousData, loading, refetch } = useQuery(GET_REPLY_REVIEWS, {
		variables: { input: { page: 1, limit, ...base, ...(needsReply ? { needsReply } : {}) } },
		fetchPolicy: 'cache-and-network',
		skip: !clinicId && !doctorId,
	});
	const { data: countData, refetch: refetchCount } = useQuery(GET_REPLY_REVIEWS, {
		variables: { input: { page: 1, limit: 1, ...base, needsReply: true } },
		fetchPolicy: 'cache-and-network',
		skip: !clinicId && !doctorId,
	});
	const result = (data ?? previousData)?.getReviews;
	const reviews: Review[] = result?.list ?? [];
	const total: number = result?.metaCounter?.[0]?.total ?? 0;
	const open: number = countData?.getReviews?.metaCounter?.[0]?.total ?? 0;
	const all: number = result?.summary?.reviews ?? 0;

	const savedHandler = async () => {
		await Promise.all([refetch(), refetchCount()]);
	};

	return (
		<>
			<Box className={'booking-tabs'} role={'tablist'} aria-label={t('Reviews')}>
				<button type={'button'} role={'tab'} aria-selected={!needsReply} onClick={() => setNeedsReply(false)}>
					{t('All')} ({all})
				</button>
				<button type={'button'} role={'tab'} aria-selected={needsReply} onClick={() => setNeedsReply(true)}>
					{t('Needs reply')} ({open})
				</button>
			</Box>
			<Box className={'reply-reviews'}>
				<Stack className={'list'}>
					{loading && reviews.length === 0 ? (
						<Skeleton variant={'rounded'} height={220} />
					) : reviews.length === 0 ? (
						<EmptyState title={needsReply ? t('Every review has a reply') : t('No reviews yet')} />
					) : (
						reviews.map((review) => <ReplyItem key={review._id} review={review} as={as} onSaved={savedHandler} />)
					)}
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
				{result?.summary && result.summary.reviews > 0 && (
					<aside className={'card summary-side'}>
						<RatingSummary summary={result.summary} />
					</aside>
				)}
			</Box>
		</>
	);
};

export default ReplyReviews;
