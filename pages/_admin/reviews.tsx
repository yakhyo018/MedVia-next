import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Rating, Skeleton, TextField } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import OutlinedFlagRoundedIcon from '@mui/icons-material/OutlinedFlagRounded';
import withLayoutAdmin from '../../libs/components/layout/LayoutAdmin';
import AdminPills, { AdminPill } from '../../libs/components/admin/AdminPills';
import AdminPager from '../../libs/components/admin/AdminPager';
import EmptyState from '../../libs/components/common/EmptyState';
import useUrlQuery from '../../libs/hooks/useUrlQuery';
import { GET_REVIEWS_BY_ADMIN } from '../../apollo/admin/query';
import { MODERATE_REVIEW } from '../../apollo/admin/mutation';
import { Review } from '../../libs/types/review/review';
import { ReviewFlag, ReviewStatus } from '../../libs/enums/review.enum';
import { ReviewDecision } from '../../libs/enums/admin.enum';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { initials, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';
import { ADMIN_I18N, ADMIN_NS } from '../../libs/components/admin/adminText';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 10;
const NOTE_MAX = 1000;

const TABS: { key: string; label: string; status: ReviewStatus }[] = [
	{ key: 'pending', label: 'Pending', status: ReviewStatus.PENDING },
	{ key: 'edit', label: 'Edit requested', status: ReviewStatus.EDIT_REQUESTED },
	{ key: 'approved', label: 'Approved', status: ReviewStatus.ACTIVE },
	{ key: 'hidden', label: 'Hidden', status: ReviewStatus.HIDDEN },
];

/** The API's moderation table: which decisions each status allows. */
const ALLOWED: Record<string, ReviewDecision[]> = {
	[ReviewStatus.PENDING]: [ReviewDecision.APPROVE, ReviewDecision.REQUEST_CHANGES, ReviewDecision.REJECT],
	[ReviewStatus.ACTIVE]: [ReviewDecision.REQUEST_CHANGES, ReviewDecision.REJECT],
	[ReviewStatus.EDIT_REQUESTED]: [ReviewDecision.REJECT],
	[ReviewStatus.HIDDEN]: [ReviewDecision.APPROVE],
};

const AD_RULES = [
	'No guaranteed or exaggerated results',
	'No before/after photos',
	'No comparison with other clinics',
	'Price mentions only as paid',
	'No personal data of others',
];

const FLAGS = Object.values(ReviewFlag);

/**
 * Patient reviews before and after they go public. Asking for an edit or hiding tells the
 * patient why: a message and the broken rules (flags).
 */
const AdminReviews: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const [busyId, setBusyId] = useState<string>('');
	const [target, setTarget] = useState<{ review: Review; decision: ReviewDecision } | null>(null);
	const [note, setNote] = useState<string>('');
	const [flags, setFlags] = useState<ReviewFlag[]>([]);
	const [noteError, setNoteError] = useState<boolean>(false);
	const tab = TABS.find((item) => item.key === url.get('tab')) ?? TABS[0];
	const locale = router.locale ?? 'en';

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_REVIEWS_BY_ADMIN, {
		variables: { input: { page: url.page, limit: LIMIT, reviewStatus: tab.status } },
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const { data: pendingData, refetch: refetchPending } = useQuery(GET_REVIEWS_BY_ADMIN, {
		variables: { input: { page: 1, limit: 1, reviewStatus: ReviewStatus.PENDING } },
		fetchPolicy: 'cache-and-network',
	});
	const [moderateReview] = useMutation(MODERATE_REVIEW);
	const reviews: Review[] = data?.getReviewsByAdmin?.list ?? [];
	const total: number = data?.getReviewsByAdmin?.metaCounter?.[0]?.total ?? 0;
	const pills: AdminPill[] = TABS.map((item) => ({
		key: item.key,
		label: t(item.label),
		count: item.key === 'pending' ? pendingData?.getReviewsByAdmin?.metaCounter?.[0]?.total : undefined,
	}));

	/** LIFECYCLES **/
	useEffect(() => {
		if (!target) return;
		setNote('');
		setFlags(target.review.reviewFlags ?? []);
		setNoteError(false);
	}, [target]);

	/** HANDLERS **/
	const decide = async (
		review: Review,
		decision: ReviewDecision,
		extra: { reviewNote?: string; reviewFlags?: ReviewFlag[] } = {},
	) => {
		try {
			setBusyId(review._id);
			await moderateReview({ variables: { input: { reviewId: review._id, decision, ...extra } } });
			await Promise.all([refetch(), refetchPending()]);
			setTarget(null);
			await sweetTopSmallSuccessAlert(t('Decision sent'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setBusyId('');
		}
	};

	const approveHandler = async (review: Review) => {
		const sure = await sweetConfirmAlert(
			review.reviewStatus === ReviewStatus.HIDDEN
				? t('Show this review again? It counts in the rating.')
				: t('Publish this review? It counts in the rating.'),
			t('Approve'),
		);
		if (sure) await decide(review, ReviewDecision.APPROVE);
	};

	const confirmHandler = async () => {
		if (!target) return;
		if (note.trim().length < 5) {
			setNoteError(true);
			return;
		}
		await decide(target.review, target.decision, { reviewNote: note.trim(), reviewFlags: flags });
	};

	const toggleFlag = (flag: ReviewFlag) =>
		setFlags(flags.includes(flag) ? flags.filter((item) => item !== flag) : [...flags, flag]);

	const card = (review: Review) => {
		const allowed = ALLOWED[review.reviewStatus ?? ''] ?? [];
		return (
			<article key={review._id} className={'admin-card admin-review-item'}>
				<div className={'top'}>
					<span className={'avatar'}>{initials(review.patientName)}</span>
					<div className={'text'}>
						<strong>{review.patientName ?? '—'}</strong>
						<span>
							{[review.clinicName, review.treatmentName, review.visitDate && seoulTime(review.visitDate, locale, false)]
								.filter(Boolean)
								.join(' · ')}
						</span>
					</div>
					<div className={'end'}>
						<Rating value={review.reviewRating} readOnly size={'small'} />
						<span className={'admin-badge success'}>{t('Verified visit')}</span>
					</div>
				</div>
				<p className={'admin-quote'}>{review.reviewContent}</p>
				{review.reviewFlags?.length ? (
					<div className={'admin-flags'}>
						{review.reviewFlags.map((flag) => (
							<span key={flag} className={'admin-badge warning'}>
								<OutlinedFlagRoundedIcon />
								{t(`reviewFlag.${flag}`)}
							</span>
						))}
					</div>
				) : (
					review.reviewStatus === ReviewStatus.PENDING && (
						<div className={'admin-flags'}>
							<span className={'admin-ok'}>
								<CheckRoundedIcon />
								{t('No flags yet — read it against the rules')}
							</span>
						</div>
					)
				)}
				{review.reviewNote && review.reviewStatus !== ReviewStatus.PENDING && (
					<p className={'admin-note'}>
						{t('Message to the patient')}: {review.reviewNote}
					</p>
				)}
				{allowed.length > 0 && (
					<div className={'buttons'}>
						{allowed.includes(ReviewDecision.APPROVE) && (
							<Button variant={'contained'} disabled={busyId === review._id} onClick={() => approveHandler(review)}>
								{review.reviewStatus === ReviewStatus.HIDDEN ? t('Show again') : t('Approve')}
							</Button>
						)}
						{allowed.includes(ReviewDecision.REQUEST_CHANGES) && (
							<Button
								variant={'outlined'}
								disabled={busyId === review._id}
								onClick={() => setTarget({ review, decision: ReviewDecision.REQUEST_CHANGES })}
							>
								{t('Request edit')}
							</Button>
						)}
						{allowed.includes(ReviewDecision.REJECT) && (
							<button
								type={'button'}
								className={'admin-text-danger'}
								disabled={busyId === review._id}
								onClick={() => setTarget({ review, decision: ReviewDecision.REJECT })}
							>
								{t('Hide')}
							</button>
						)}
					</div>
				)}
			</article>
		);
	};

	const hiding = target?.decision === ReviewDecision.REJECT;

	return (
		<div id={'admin-reviews'}>
			<AdminPills
				pills={pills}
				active={tab.key}
				onChange={(key) => url.set({ tab: key === 'pending' ? undefined : key })}
				label={t('Reviews')}
			/>
			<div className={'admin-grid main-side'}>
				<div className={'admin-stack'}>
					{loading && !data ? (
						<Skeleton variant={'rounded'} height={300} />
					) : reviews.length === 0 ? (
						<div className={'admin-card'}>
							<EmptyState title={tab.key === 'pending' ? t('Nothing to review. Nice!') : t('No reviews here.')} />
						</div>
					) : (
						reviews.map(card)
					)}
					{total > LIMIT && (
						<div className={'admin-table-card'}>
							<AdminPager
								page={url.page}
								limit={LIMIT}
								total={total}
								shown={reviews.length}
								onChange={(page) => url.set({ page })}
							/>
						</div>
					)}
				</div>
				<aside className={'admin-card admin-rules'}>
					<div>
						<h2>{t('Medical ad rules')}</h2>
						<p>{t('Checked before publishing')}</p>
					</div>
					<ul>
						{AD_RULES.map((rule) => (
							<li key={rule}>
								<CheckRoundedIcon />
								{t(rule)}
							</li>
						))}
					</ul>
				</aside>
			</div>

			<Dialog open={Boolean(target)} onClose={() => setTarget(null)} fullWidth maxWidth={'sm'}>
				<DialogTitle>{hiding ? t('Hide this review') : t('Ask the patient for an edit')}</DialogTitle>
				<DialogContent className={'admin-dialog'}>
					<p className={'admin-muted'}>
						{hiding
							? t('The review leaves the clinic page and the rating. The patient sees your message.')
							: t('The review leaves the clinic page until the patient edits it.')}
					</p>
					<span className={'label'}>{t('Broken rules')}</span>
					<div className={'admin-flags'}>
						{FLAGS.map((flag) => (
							<button
								key={flag}
								type={'button'}
								className={`admin-flag-toggle ${flags.includes(flag) ? 'active' : ''}`}
								aria-pressed={flags.includes(flag)}
								onClick={() => toggleFlag(flag)}
							>
								<OutlinedFlagRoundedIcon />
								{t(`reviewFlag.${flag}`)}
							</button>
						))}
					</div>
					<TextField
						label={t('Message to the patient')}
						value={note}
						multiline
						minRows={3}
						fullWidth
						error={noteError}
						helperText={noteError ? t('Tell the patient why (at least 5 characters).') : undefined}
						inputProps={{ maxLength: NOTE_MAX }}
						onChange={(event) => {
							setNote(event.target.value);
							setNoteError(false);
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button variant={'outlined'} onClick={() => setTarget(null)}>
						{t('Cancel')}
					</Button>
					<Button
						variant={'contained'}
						color={hiding ? 'error' : 'primary'}
						disabled={Boolean(busyId)}
						onClick={confirmHandler}
					>
						{hiding ? t('Hide') : t('Request edit')}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};

export default withLayoutAdmin(AdminReviews);
