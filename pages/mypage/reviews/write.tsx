import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Skeleton, TextField } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import withLayoutBasic from '../../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../../libs/components/mypage/MyPageFrame';
import EmptyState from '../../../libs/components/common/EmptyState';
import { GET_BOOKING, GET_MY_REVIEWS } from '../../../apollo/user/query';
import { CREATE_REVIEW, UPDATE_REVIEW } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { Booking } from '../../../libs/types/booking/booking';
import { Review } from '../../../libs/types/review/review';
import { Language } from '../../../libs/enums/common.enum';
import { MemberType } from '../../../libs/enums/member.enum';
import { ReviewStatus, ReviewTag } from '../../../libs/enums/review.enum';
import { LANGUAGES, LIST_MAX, REVIEW_MAX, REVIEW_MIN, localeToLanguage } from '../../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { isObjectId, isReviewable, seoulTime } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const TAG_LABELS: Record<ReviewTag, string> = {
	[ReviewTag.EXPLANATION]: 'Explanation from the doctor',
	[ReviewTag.PRICE_MATCHED]: 'Price matched the page',
	[ReviewTag.INTERPRETER]: 'Interpreter',
	[ReviewTag.CLEANLINESS]: 'Cleanliness',
};

interface ReviewForm {
	reviewRating: number;
	reviewTags: ReviewTag[];
	reviewContent: string;
	reviewLang: Language;
	ownVisitConfirmed: boolean;
}

const DEFAULT_INPUT: ReviewForm = {
	reviewRating: 0,
	reviewTags: [],
	reviewContent: '',
	reviewLang: Language.EN,
	ownVisitConfirmed: false,
};

type FormErrors = Partial<Record<keyof ReviewForm, string>>;

/**
 * "Write a verified review" (`?booking=`) and its edit (`?review=`). Every submission — new or
 * edited — waits for the admin's check against the medical advertising rules.
 */
const WriteReview: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [input, setInput] = useState<ReviewForm>(DEFAULT_INPUT);
	const [errors, setErrors] = useState<FormErrors>({});
	const [filled, setFilled] = useState<boolean>(false);
	const bookingId = isObjectId(router.query.booking) ? router.query.booking : '';
	const reviewId = isObjectId(router.query.review) ? router.query.review : '';
	const editing = Boolean(reviewId);
	const isPatient = user.memberType === MemberType.USER;

	/** APOLLO REQUESTS **/
	const reviewsQuery = useQuery(GET_MY_REVIEWS, {
		variables: { input: { page: 1, limit: LIST_MAX } },
		fetchPolicy: 'cache-first',
		skip: !isPatient || !editing,
	});
	const review: Review | undefined = reviewsQuery.data?.getMyReviews?.list?.find(
		(item: Review) => item._id === reviewId,
	);
	const bookingQuery = useQuery(GET_BOOKING, {
		variables: { bookingId: editing ? review?.bookingId : bookingId },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient || (editing ? !review?.bookingId : !bookingId),
	});
	const booking: Booking | undefined = bookingQuery.data?.getBooking;
	const [createReview, { loading: creating }] = useMutation(CREATE_REVIEW);
	const [updateReview, { loading: updating }] = useMutation(UPDATE_REVIEW);

	/** LIFECYCLES **/
	useEffect(() => {
		if (filled) return;
		if (editing && review) {
			setInput({
				reviewRating: review.reviewRating,
				reviewTags: review.reviewTags ?? [],
				reviewContent: review.reviewContent,
				reviewLang: review.reviewLang,
				ownVisitConfirmed: true,
			});
			setFilled(true);
		} else if (!editing && user._id) {
			setInput({ ...DEFAULT_INPUT, reviewLang: (user.memberLang || localeToLanguage(router.locale)) as Language });
			setFilled(true);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editing, review, user._id]);

	/** HANDLERS **/
	const inputHandler = <K extends keyof ReviewForm>(name: K, value: ReviewForm[K]) => {
		setInput({ ...input, [name]: value });
		if (errors[name]) setErrors({ ...errors, [name]: undefined });
	};

	const tagHandler = (tag: ReviewTag) => {
		const tags = input.reviewTags.includes(tag)
			? input.reviewTags.filter((item) => item !== tag)
			: [...input.reviewTags, tag];
		inputHandler('reviewTags', tags);
	};

	const validate = (): FormErrors => {
		const found: FormErrors = {};
		const length = input.reviewContent.trim().length;
		if (!input.reviewRating) found.reviewRating = 'Please choose a rating';
		if (length < REVIEW_MIN || length > REVIEW_MAX) found.reviewContent = 'Write 10 to 2000 characters';
		if (!editing && !input.ownVisitConfirmed) found.ownVisitConfirmed = 'Please confirm this is your own visit';
		return found;
	};

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const found = validate();
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		try {
			const fields = {
				reviewRating: input.reviewRating,
				reviewTags: input.reviewTags,
				reviewContent: input.reviewContent.trim(),
				reviewLang: input.reviewLang,
			};
			if (editing) {
				await updateReview({ variables: { input: { reviewId, ...fields } } });
			} else {
				await createReview({
					variables: { input: { bookingId, ...fields, ownVisitConfirmed: input.ownVisitConfirmed } },
				});
			}
			await sweetTopSmallSuccessAlert(t('Thank you! Your review is waiting for a check.'));
			await router.push({ pathname: '/mypage/reviews', query: { tab: 'review' } });
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const back = { href: '/mypage/reviews', label: t('My Reviews') };
	const title = editing ? t('Edit your review') : t('Write a verified review');
	const loading = (editing && reviewsQuery.loading) || (bookingQuery.loading && !booking);
	const allowed = editing ? review && review.reviewStatus !== ReviewStatus.HIDDEN : booking && isReviewable(booking);

	if (!router.isReady || loading) {
		return (
			<MyPageFrame title={title} back={back} className={'write-review'}>
				<Skeleton variant={'rounded'} height={420} />
			</MyPageFrame>
		);
	}

	if (!allowed) {
		return (
			<MyPageFrame title={title} back={back} className={'write-review'}>
				<EmptyState
					title={t('This visit cannot be reviewed')}
					text={t('Reviews are for completed visits, within 30 days, once per booking.')}
					action={
						<Button variant={'contained'} LinkComponent={Link} href={'/mypage/reviews'}>
							{t('My Reviews')}
						</Button>
					}
				/>
			</MyPageFrame>
		);
	}

	const length = input.reviewContent.trim().length;

	return (
		<MyPageFrame title={title} back={back} className={'write-review'}>
			<Box component={'form'} noValidate onSubmit={submitHandler} className={'write-review-form'}>
				<Box className={'visit card'}>
					<div className={'head'}>
						<strong>
							{booking?.treatmentData?.treatmentName ?? review?.treatmentName} ·{' '}
							{booking?.clinicData?.clinicName ?? review?.clinicName}
						</strong>
						<span className={'verified'}>
							<CheckRoundedIcon />
							{t('Verified visit')}
						</span>
					</div>
					<span className={'meta'}>
						{t('Dr.')} {booking?.doctorData?.doctorName ?? review?.doctorName}
						{booking && ` · ${seoulTime(booking.bookingDate, router.locale, false)} · #${booking.bookingCode}`}
					</span>
					{editing && <p className={'hint'}>{t('After an edit the review is checked again before it is shown.')}</p>}
				</Box>

				<Box className={'card'}>
					<span className={'label'} id={'rating-label'}>
						{t('Overall rating')}
					</span>
					<div className={'rating'} role={'radiogroup'} aria-labelledby={'rating-label'}>
						{[1, 2, 3, 4, 5].map((n) => (
							<button
								key={n}
								type={'button'}
								role={'radio'}
								aria-checked={input.reviewRating === n}
								aria-label={`${n} · ${t(RATING_WORDS[n])}`}
								className={n <= input.reviewRating ? 'on' : ''}
								onClick={() => inputHandler('reviewRating', n)}
							>
								<StarRoundedIcon />
							</button>
						))}
						{input.reviewRating > 0 && (
							<span className={'word'}>
								{input.reviewRating} · {t(RATING_WORDS[input.reviewRating])}
							</span>
						)}
					</div>
					{errors.reviewRating && <p className={'field-error'}>{t(errors.reviewRating)}</p>}

					<span className={'label'}>{t('What went well')}</span>
					<div className={'tags'}>
						{Object.values(ReviewTag).map((tag) => (
							<button
								key={tag}
								type={'button'}
								aria-pressed={input.reviewTags.includes(tag)}
								onClick={() => tagHandler(tag)}
							>
								{t(TAG_LABELS[tag])}
							</button>
						))}
					</div>
				</Box>

				<Box className={'card'}>
					<label className={'label'} htmlFor={'review-content'}>
						{t('Your review')}
					</label>
					<TextField
						id={'review-content'}
						multiline
						minRows={6}
						value={input.reviewContent}
						onChange={(event) => inputHandler('reviewContent', event.target.value)}
						placeholder={t('What was the visit like? What should other patients know?')}
						error={Boolean(errors.reviewContent)}
						helperText={errors.reviewContent ? t(errors.reviewContent) : undefined}
						inputProps={{ maxLength: REVIEW_MAX }}
					/>
					<div className={'counter'}>
						<span>{t('At least 10 characters')}</span>
						<span>
							{length} / {REVIEW_MAX}
						</span>
					</div>

					<label className={'label'} htmlFor={'review-lang'}>
						{t('Written in')}
					</label>
					<TextField
						id={'review-lang'}
						select
						value={input.reviewLang}
						onChange={(event) => inputHandler('reviewLang', event.target.value as Language)}
					>
						{LANGUAGES.map((lang) => (
							<MenuItem key={lang.code} value={lang.code}>
								{lang.label}
							</MenuItem>
						))}
					</TextField>

					{!editing && (
						<>
							<FormControlLabel
								className={'confirm'}
								control={
									<Checkbox
										checked={input.ownVisitConfirmed}
										onChange={(event) => inputHandler('ownVisitConfirmed', event.target.checked)}
									/>
								}
								label={t('I confirm this review is about my own visit')}
							/>
							{errors.ownVisitConfirmed && <p className={'field-error'}>{t(errors.ownVisitConfirmed)}</p>}
						</>
					)}
					<p className={'hint'}>
						{t('Reviews are checked against medical advertising rules before they are published.')}
					</p>
				</Box>

				<Box className={'form-actions'}>
					<Button variant={'outlined'} LinkComponent={Link} href={'/mypage/reviews'}>
						{t('Cancel')}
					</Button>
					<Button type={'submit'} variant={'contained'} disabled={creating || updating}>
						{editing ? t('Send the edit') : t('Publish review')}
					</Button>
				</Box>
			</Box>
		</MyPageFrame>
	);
};

export default withLayoutBasic(WriteReview);
