import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Button, IconButton, Skeleton, Stack } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import RatingSummary from '../../libs/components/review/RatingSummary';
import ReviewInvite from '../../libs/components/review/ReviewInvite';
import ReviewCard from '../../libs/components/review/ReviewCard';
import useLikeTarget from '../../libs/hooks/useLikeTarget';
import useFollow from '../../libs/hooks/useFollow';
import { GET_CLINIC_TREATMENTS, GET_DOCTOR, GET_REVIEWS } from '../../apollo/user/query';
import { Doctor } from '../../libs/types/doctor/doctor';
import { Treatment } from '../../libs/types/treatment/treatment';
import { Review, Reviews } from '../../libs/types/review/review';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LANGUAGES, REACT_APP_API_URL } from '../../libs/config';
import { formatCount, formatKrw, imageUrl, initials, isObjectId } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const REVIEWS_STEP = 5;

const DoctorDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const likeHandler = useLikeTarget();
	const followHandler = useFollow();
	const [reviewLimit, setReviewLimit] = useState<number>(REVIEWS_STEP);
	const doctorId = router.query.id;
	const validId = isObjectId(doctorId);

	/** APOLLO REQUESTS **/
	const {
		loading: getDoctorLoading,
		data: getDoctorData,
		error: getDoctorError,
	} = useQuery(GET_DOCTOR, {
		fetchPolicy: 'cache-and-network',
		variables: { doctorId },
		skip: !validId,
	});
	const doctor: Doctor | undefined = getDoctorData?.getDoctor;
	const clinic = doctor?.clinicData;

	const { data: getTreatmentsData } = useQuery(GET_CLINIC_TREATMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { clinicId: clinic?._id, doctorId } },
		skip: !clinic?._id,
	});
	const treatments: Treatment[] = getTreatmentsData?.getClinicTreatments ?? [];

	const {
		data: getReviewsData,
		previousData: previousReviews,
		loading: getReviewsLoading,
	} = useQuery(GET_REVIEWS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: reviewLimit, doctorId } },
		skip: !validId,
	});
	const reviews: Reviews | undefined = getReviewsData?.getReviews ?? previousReviews?.getReviews;
	const reviewList: Review[] = reviews?.list ?? [];
	const reviewTotal: number = reviews?.metaCounter?.[0]?.total ?? 0;

	/** HANDLERS **/
	const followClickHandler = async () => {
		if (!doctor) return;
		await followHandler({
			typename: 'Doctor',
			id: doctor._id,
			memberId: doctor.memberId,
			following: Boolean(doctor.meFollowed),
		});
	};

	if (router.isReady && (!validId || (getDoctorError && !doctor))) {
		return (
			<Stack className={'doctor-detail-page'}>
				<Stack className={'container'}>
					<EmptyState
						title={t('Doctor not found')}
						text={t('The page may have moved, or the doctor no longer takes patients here.')}
						action={
							<Button variant={'contained'} onClick={() => router.push('/doctors')}>
								{t('All doctors')}
							</Button>
						}
					/>
				</Stack>
			</Stack>
		);
	}

	if (!doctor) {
		return (
			<Stack className={'doctor-detail-page'}>
				<Stack className={'container'}>
					<Skeleton variant={'rounded'} height={220} />
					<Box className={'detail-grid'}>
						<Skeleton variant={'rounded'} height={420} />
						<Skeleton variant={'rounded'} height={320} />
					</Box>
				</Stack>
			</Stack>
		);
	}

	const name = `${t('Dr.')} ${doctor.doctorName}`;
	const langLabels = doctor.doctorLangs.map((code) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code);
	const clinicHref = clinic ? { pathname: '/clinics/detail', query: { id: clinic._id } } : '/clinics';
	const stats = [
		{
			value: doctor.doctorReviews ? doctor.doctorRating?.toFixed(1) : '—',
			label: `${doctor.doctorReviews ?? 0} ${t('reviews')}`,
		},
		{ value: formatCount(doctor.doctorFollowers), label: t('Followers') },
		{ value: formatCount(doctor.doctorViews), label: t('Profile views') },
		...(doctor.doctorExperience ? [{ value: `${doctor.doctorExperience} ${t('yrs')}`, label: t('Experience') }] : []),
	];

	return (
		<Stack className={'doctor-detail-page'}>
			<Head>
				<title>{`${name} · ${t(`specialty.${doctor.doctorSpecialty}`)} | MedVia`}</title>
			</Head>
			<Stack className={'container'}>
				<nav className={'crumbs'} aria-label={t('Breadcrumb')}>
					<Link href={'/'}>{t('Home')}</Link>
					<ChevronRightRoundedIcon />
					<Link href={'/doctors'}>{t('Doctors')}</Link>
					{clinic && (
						<>
							<ChevronRightRoundedIcon />
							<Link href={clinicHref}>{clinic.clinicName}</Link>
						</>
					)}
					<ChevronRightRoundedIcon />
					<span>{name}</span>
				</nav>

				<Box className={'doctor-hero mv-enter'} component={'header'}>
					<div className={'photo'}>
						{doctor.doctorImage ? (
							<img src={imageUrl(doctor.doctorImage, REACT_APP_API_URL)} alt={name} />
						) : (
							<span>{initials(doctor.doctorName)}</span>
						)}
					</div>
					<div className={'info'}>
						<div className={'chips'}>
							<span className={'specialty'}>{t(`specialty.${doctor.doctorSpecialty}`)}</span>
							<span className={'verified'}>
								<VerifiedUserOutlinedIcon />
								{t('Doctor at a verified clinic')}
							</span>
						</div>
						<h1>
							{name}
							{doctor.doctorNameKo && <small>{doctor.doctorNameKo}</small>}
						</h1>
						<div className={'meta'}>
							{clinic && (
								<Link href={clinicHref}>
									<ApartmentOutlinedIcon />
									{clinic.clinicName}
								</Link>
							)}
							<span>
								<LanguageOutlinedIcon />
								{langLabels.join(', ')}
							</span>
						</div>
						<dl className={'stats'}>
							{stats.map((stat) => (
								<div key={stat.label}>
									<dt>{stat.label}</dt>
									<dd>{stat.value}</dd>
								</div>
							))}
						</dl>
					</div>
					<div className={'actions'}>
						<Button
							variant={doctor.meFollowed ? 'outlined' : 'contained'}
							startIcon={doctor.meFollowed ? <CheckRoundedIcon /> : <AddRoundedIcon />}
							onClick={followClickHandler}
						>
							{doctor.meFollowed ? t('Following') : t('Follow')}
						</Button>
						<IconButton
							className={`like ${doctor.meLiked ? 'liked' : ''}`}
							aria-label={t('Like')}
							aria-pressed={Boolean(doctor.meLiked)}
							onClick={() => likeHandler(LikeGroup.DOCTOR, doctor._id)}
						>
							{doctor.meLiked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
							<span>{formatCount(doctor.doctorLikes)}</span>
						</IconButton>
					</div>
				</Box>

				<Box className={'detail-grid'}>
					<Stack className={'main'}>
						<section>
							<h2>{t('About')}</h2>
							<p className={'bio'}>{doctor.doctorBio || t('The doctor has not written an introduction yet.')}</p>
						</section>

						{doctor.doctorCareer.length > 0 && (
							<section>
								<h2>{t('Education and career')}</h2>
								<ul className={'career'}>
									{doctor.doctorCareer.map((item, index) => (
										<li key={`${item.title}-${index}`}>
											<span className={'icon'}>
												<WorkOutlineRoundedIcon />
											</span>
											<div>
												<strong>
													{item.title}
													{item.place && ` · ${item.place}`}
												</strong>
												{(item.from || item.to) && (
													<span>
														{item.from ?? ''} – {item.to ?? t('present')}
													</span>
												)}
											</div>
										</li>
									))}
								</ul>
							</section>
						)}

						<section>
							<h2>{t('Treatments')}</h2>
							{treatments.length ? (
								<div className={'treatment-table'} role={'table'}>
									<div className={'row head'} role={'row'}>
										<span role={'columnheader'}>{t('Treatment')}</span>
										<span role={'columnheader'}>{t('Duration')}</span>
										<span role={'columnheader'}>{t('Price from')}</span>
									</div>
									{treatments.map((item) => (
										<div key={item._id} className={'row'} role={'row'}>
											<strong role={'cell'}>{item.treatmentName}</strong>
											<span role={'cell'}>
												{item.treatmentDuration} {t('min')}
											</span>
											<b role={'cell'}>{formatKrw(item.treatmentPrice)}</b>
										</div>
									))}
								</div>
							) : (
								<p className={'muted'}>{t('No treatments are listed for this doctor yet.')}</p>
							)}
						</section>

						<section>
							<h2>{t('Reviews')}</h2>
							<ReviewInvite
								doctorId={typeof doctorId === 'string' ? doctorId : undefined}
								empty={!(reviews?.summary && reviews.summary.reviews > 0)}
							/>
							{reviews?.summary && reviews.summary.reviews > 0 ? (
								<>
									<RatingSummary summary={reviews.summary} />
									<Stack className={'review-list'}>
										{reviewList.map((review) => (
											<ReviewCard key={review._id} review={review} />
										))}
									</Stack>
									{reviewList.length < reviewTotal && (
										<Button
											variant={'outlined'}
											className={'more'}
											disabled={getReviewsLoading}
											onClick={() => setReviewLimit((limit) => Math.min(limit + REVIEWS_STEP, 50))}
										>
											{t('Show more reviews')} ({reviewTotal - reviewList.length})
										</Button>
									)}
								</>
							) : null}
						</section>
					</Stack>

					<aside className={'side'}>
						{clinic && (
							<Link href={clinicHref} className={'clinic-box'}>
								<div className={'photo'}>
									{clinic.clinicImages?.[0] && (
										<img src={imageUrl(clinic.clinicImages[0], REACT_APP_API_URL)} alt={clinic.clinicName} />
									)}
								</div>
								<div className={'text'}>
									<strong>{clinic.clinicName}</strong>
									<span className={'verified'}>
										<VerifiedUserOutlinedIcon />
										{t('Verified clinic')}
									</span>
									<span className={'place'}>
										<PlaceOutlinedIcon />
										{t(`district.${clinic.clinicDistrict}`)}, {t('Seoul')}
									</span>
								</div>
								<ArrowForwardRoundedIcon className={'go'} />
							</Link>
						)}
						{treatments.length > 0 && (
							<div className={'side-treatments'}>
								<span className={'label'}>
									{t('Treatments by')} {name}
								</span>
								{treatments.map((item) => (
									<div key={item._id}>
										<span>
											<strong>{item.treatmentName}</strong>
											<em>
												{item.treatmentDuration} {t('min')}
											</em>
										</span>
										<b>{formatKrw(item.treatmentPrice)}</b>
									</div>
								))}
							</div>
						)}
						{clinic && (
							<Button
								variant={'contained'}
								fullWidth
								endIcon={<ArrowForwardRoundedIcon />}
								LinkComponent={Link}
								href={`/clinics/detail?id=${clinic._id}&doctor=${doctor._id}`}
							>
								{t('Book at the clinic')}
							</Button>
						)}
						<p className={'note'}>{t('Bookings are made through the clinic this doctor works at.')}</p>
					</aside>
				</Box>
				{getDoctorLoading && <span className={'sr-only'}>{t('Loading')}</span>}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(DoctorDetail);
