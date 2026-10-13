import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Button, Drawer, IconButton, Skeleton, Stack } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import ClinicGallery from '../../libs/components/clinic/ClinicGallery';
import TreatmentTable from '../../libs/components/clinic/TreatmentTable';
import BookingCard from '../../libs/components/clinic/BookingCard';
import ClinicCard from '../../libs/components/clinic/ClinicCard';
import RatingSummary from '../../libs/components/review/RatingSummary';
import ReviewCard from '../../libs/components/review/ReviewCard';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import useLikeTarget from '../../libs/hooks/useLikeTarget';
import useFollow from '../../libs/hooks/useFollow';
import {
	GET_CLINIC,
	GET_CLINIC_TREATMENTS,
	GET_DOCTORS,
	GET_NEARBY_CLINICS,
	GET_REVIEWS,
} from '../../apollo/user/query';
import { Clinic } from '../../libs/types/clinic/clinic';
import { Doctor } from '../../libs/types/doctor/doctor';
import { Treatment } from '../../libs/types/treatment/treatment';
import { Review, Reviews } from '../../libs/types/review/review';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Language } from '../../libs/enums/common.enum';
import { LANGUAGES, REACT_APP_API_URL } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { formatCount, formatKrw, imageUrl, initials, isObjectId, openingHours } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const REVIEWS_STEP = 3;
const DOCTORS_LIMIT = 20;
const NEARBY_LIMIT = 3;

/** OpenStreetMap needs no key: an embedded map around the pin, and a link to the full map. */
const osmEmbed = ([lng, lat]: number[]) =>
	`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.006},${lat - 0.003},${lng + 0.006},${lat + 0.003}&layer=mapnik&marker=${lat},${lng}`;
const osmLink = ([lng, lat]: number[]) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

const ClinicDetail: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const likeHandler = useLikeTarget();
	const followHandler = useFollow();
	const [reviewLimit, setReviewLimit] = useState<number>(REVIEWS_STEP);
	const [pickedTreatmentId, setPickedTreatmentId] = useState<string>('');
	const [pickedDoctorId, setPickedDoctorId] = useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = useState<boolean>(false);
	const clinicId = router.query.id;
	const validId = isObjectId(clinicId);
	// `?doctor=` — the patient came from a doctor's page ("Book at the clinic").
	const fromDoctorId = isObjectId(router.query.doctor) ? router.query.doctor : undefined;

	/** APOLLO REQUESTS **/
	const {
		loading: getClinicLoading,
		data: getClinicData,
		error: getClinicError,
	} = useQuery(GET_CLINIC, {
		fetchPolicy: 'cache-and-network',
		variables: { clinicId },
		skip: !validId,
	});
	const clinic: Clinic | undefined = getClinicData?.getClinic;

	const { data: getTreatmentsData } = useQuery(GET_CLINIC_TREATMENTS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { clinicId } },
		skip: !validId,
	});
	const treatments: Treatment[] = getTreatmentsData?.getClinicTreatments ?? [];

	const { data: getDoctorsData } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: DOCTORS_LIMIT, search: { clinicId } } },
		skip: !validId,
	});
	const doctors: Doctor[] = getDoctorsData?.getDoctors?.list ?? [];
	const doctorTotal: number = getDoctorsData?.getDoctors?.metaCounter?.[0]?.total ?? doctors.length;

	const {
		data: getReviewsData,
		previousData: previousReviews,
		loading: getReviewsLoading,
	} = useQuery(GET_REVIEWS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: reviewLimit, clinicId } },
		skip: !validId,
	});
	const reviews: Reviews | undefined = getReviewsData?.getReviews ?? previousReviews?.getReviews;
	const reviewList: Review[] = reviews?.list ?? [];
	const reviewTotal: number = reviews?.metaCounter?.[0]?.total ?? 0;

	const { data: getNearbyData } = useQuery(GET_NEARBY_CLINICS, {
		fetchPolicy: 'cache-and-network',
		variables: { clinicId, limit: NEARBY_LIMIT },
		skip: !validId,
	});
	const nearby: Clinic[] = getNearbyData?.getNearbyClinics ?? [];

	/** The doctor from `?doctor=` while it works here; the patient's own pick wins. */
	const fromDoctor = doctors.find((doctor) => doctor._id === fromDoctorId);
	const doctorId = pickedDoctorId ?? fromDoctor?._id ?? '';
	/** Default treatment: the cheapest one this doctor performs (the API sorts by price). */
	const bookable = fromDoctor
		? treatments.filter((item) => item.doctors?.some((doctor) => doctor._id === fromDoctor._id))
		: treatments;
	const treatmentId = treatments.some((item) => item._id === pickedTreatmentId)
		? pickedTreatmentId
		: (bookable[0]?._id ?? treatments[0]?._id ?? '');
	const treatment = treatments.find((item) => item._id === treatmentId);

	/** HANDLERS **/
	const followClickHandler = async () => {
		if (!clinic?.memberId) return;
		await followHandler({
			typename: 'Clinic',
			id: clinic._id,
			memberId: clinic.memberId,
			following: Boolean(clinic.meFollowed),
		});
	};

	const shareHandler = async () => {
		try {
			const url = window.location.href;
			if (navigator.share) {
				await navigator.share({ title: clinic?.clinicName, url });
				return;
			}
			await navigator.clipboard.writeText(url);
			await sweetTopSmallSuccessAlert(t('Link copied'), 1500);
		} catch (err) {
			// Closing the share sheet is not an error.
			if ((err as Error).name === 'AbortError') return;
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const treatmentChangeHandler = (id: string) => {
		setPickedTreatmentId(id);
		const picked = treatments.find((item) => item._id === id);
		// A doctor who does not perform the new treatment falls back to "any available doctor".
		if (doctorId && picked?.doctors?.length && !picked.doctors.some((doctor) => doctor._id === doctorId)) {
			setPickedDoctorId('');
		}
	};

	const showAllDoctorsHandler = async () => {
		setPickedDoctorId('');
		await router.replace({ pathname: router.pathname, query: { id: clinicId } }, undefined, {
			shallow: true,
			scroll: false,
		});
	};

	if (router.isReady && (!validId || (getClinicError && !clinic))) {
		return (
			<Stack className={'clinic-detail-page'}>
				<Stack className={'container'}>
					<EmptyState
						title={t('Clinic not found')}
						text={t('The page may have moved, or the clinic is not taking patients on MedVia now.')}
						action={
							<Button variant={'contained'} onClick={() => router.push('/clinics')}>
								{t('All clinics')}
							</Button>
						}
					/>
				</Stack>
			</Stack>
		);
	}

	if (!clinic) {
		return (
			<Stack className={'clinic-detail-page'}>
				<Stack className={'container'}>
					<Skeleton variant={'rounded'} height={120} />
					<Skeleton variant={'rounded'} height={device === 'mobile' ? 230 : 440} />
					<Box className={'detail-grid'}>
						<Skeleton variant={'rounded'} height={480} />
						<Skeleton variant={'rounded'} height={420} />
					</Box>
				</Stack>
			</Stack>
		);
	}

	const mobile = device === 'mobile';
	// Every clinic speaks Korean; the header lists what a foreign patient looks for.
	const langLabels = (clinic.clinicLangs ?? [])
		.filter((code) => code !== Language.KO)
		.map((code) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code);
	const interpreterLabels = (clinic.clinicInterpreterLangs ?? []).map(
		(code) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code,
	);
	const hours = openingHours(clinic.clinicHours, router.locale);
	const location = clinic.clinicLocation?.coordinates;
	const specialty = clinic.clinicSpecialty ? t(`specialty.${clinic.clinicSpecialty}`) : '';

	const booking = (
		<BookingCard
			clinicName={clinic.clinicName}
			treatments={treatments}
			doctors={doctors}
			interpreterLangs={clinic.clinicInterpreterLangs ?? []}
			treatmentId={treatmentId}
			doctorId={doctorId}
			fromDoctorId={fromDoctor?._id}
			onTreatmentChange={treatmentChangeHandler}
			onDoctorChange={setPickedDoctorId}
		/>
	);

	return (
		<Stack className={'clinic-detail-page'}>
			<Head>
				<title>{`${clinic.clinicName}${specialty ? ` · ${specialty}` : ''} | MedVia`}</title>
			</Head>
			<Stack className={'container'}>
				{mobile ? (
					<nav className={'crumbs'} aria-label={t('Breadcrumb')}>
						<ChevronLeftRoundedIcon className={'back'} />
						<Link href={'/clinics'}>{t('Clinics')}</Link>
						{specialty && (
							<>
								<span className={'slash'}>/</span>
								<span>{specialty}</span>
							</>
						)}
					</nav>
				) : (
					<nav className={'crumbs'} aria-label={t('Breadcrumb')}>
						<Link href={'/'}>{t('Home')}</Link>
						<ChevronRightRoundedIcon />
						<Link href={'/clinics'}>{t('Clinics')}</Link>
						<ChevronRightRoundedIcon />
						<span>{clinic.clinicName}</span>
					</nav>
				)}

				{mobile && <ClinicGallery images={clinic.clinicImages ?? []} name={clinic.clinicName} mobile />}

				<Box className={'clinic-head mv-enter'} component={'header'}>
					<div className={'info'}>
						<div className={'chips'}>
							{specialty && <span className={'specialty'}>{specialty}</span>}
							<span className={'verified'}>
								<VerifiedUserOutlinedIcon />
								{t('Verified clinic')}
							</span>
						</div>
						<h1>
							{clinic.clinicName}
							{clinic.clinicNameKo && <small>{clinic.clinicNameKo}</small>}
						</h1>
						<div className={'meta'}>
							<span>
								<StarRoundedIcon className={'star'} />
								{clinic.clinicReviews ? (
									<>
										<b>{clinic.clinicRating?.toFixed(1)}</b> ({clinic.clinicReviews} {t('reviews')})
									</>
								) : (
									t('New')
								)}
							</span>
							<span>
								<PlaceOutlinedIcon />
								{t(`district.${clinic.clinicDistrict}`)}, {t('Seoul')}
							</span>
							{langLabels.length > 0 && (
								<span>
									<LanguageOutlinedIcon />
									{langLabels.join(', ')}
								</span>
							)}
						</div>
					</div>
					<div className={'actions'}>
						<Button
							className={'follow'}
							variant={clinic.meFollowed ? 'outlined' : 'contained'}
							endIcon={clinic.meFollowed ? <CheckRoundedIcon /> : <AddRoundedIcon />}
							onClick={followClickHandler}
						>
							{clinic.meFollowed ? t('Following') : t('Follow')} · {formatCount(clinic.clinicFollowers)}
						</Button>
						<IconButton
							className={`like ${clinic.meLiked ? 'liked' : ''}`}
							aria-label={t('Like')}
							aria-pressed={Boolean(clinic.meLiked)}
							title={`${formatCount(clinic.clinicLikes)} ${t('Likes')}`}
							onClick={() => likeHandler(LikeGroup.CLINIC, clinic._id)}
						>
							{clinic.meLiked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
						</IconButton>
						<IconButton className={'share'} aria-label={t('Share')} onClick={shareHandler}>
							<ShareOutlinedIcon />
						</IconButton>
					</div>
				</Box>

				{!mobile && <ClinicGallery images={clinic.clinicImages ?? []} name={clinic.clinicName} />}

				<Box className={'detail-grid'}>
					<Stack className={'main'}>
						<section>
							<h2>{t('About the clinic')}</h2>
							{clinic.clinicDesc && <p className={'bio'}>{clinic.clinicDesc}</p>}
							<div className={'facts'}>
								{hours.length > 0 && (
									<div>
										<ScheduleRoundedIcon />
										<span>{t('Opening hours')}</span>
										{hours.map((line) => (
											<strong key={line}>{line}</strong>
										))}
									</div>
								)}
								{interpreterLabels.length > 0 && (
									<div>
										<TranslateRoundedIcon />
										<span>{t('Interpreter')}</span>
										<strong>{interpreterLabels.join(', ')}</strong>
									</div>
								)}
								<div>
									<GroupsOutlinedIcon />
									<span>{t('Doctors')}</span>
									<strong>{t('{{count}} specialists', { count: doctorTotal })}</strong>
								</div>
							</div>
						</section>

						<section>
							<h2>{t('Treatments and prices')}</h2>
							{fromDoctor && (
								<div className={'doctor-filter-note'}>
									<span className={'avatar'}>{initials(fromDoctor.doctorName)}</span>
									<span>
										<strong>
											{t('Dr.')} {fromDoctor.doctorName}
										</strong>
										{t('Showing the treatments this doctor performs')}
									</span>
									<Button size={'small'} onClick={showAllDoctorsHandler}>
										{t('Show all doctors')}
									</Button>
								</div>
							)}
							{treatments.length ? (
								<TreatmentTable
									treatments={treatments}
									selectedId={treatmentId}
									onSelect={treatmentChangeHandler}
									doctorId={fromDoctor && doctorId === fromDoctor._id ? fromDoctor._id : undefined}
								/>
							) : (
								<p className={'muted'}>{t('This clinic has no treatments listed yet.')}</p>
							)}
						</section>

						{doctors.length > 0 && (
							<section>
								<h2>{t('Doctors')}</h2>
								<div className={'clinic-doctors'}>
									{doctors.map((doctor) => (
										<Link
											key={doctor._id}
											href={{ pathname: '/doctors/detail', query: { id: doctor._id } }}
											className={'clinic-doctor mv-lift'}
										>
											<span className={'avatar'}>
												{doctor.doctorImage ? (
													<img src={imageUrl(doctor.doctorImage, REACT_APP_API_URL)} alt={''} />
												) : (
													initials(doctor.doctorName)
												)}
											</span>
											<span className={'text'}>
												<strong>
													{t('Dr.')} {doctor.doctorName}
												</strong>
												<span>
													{t(`specialty.${doctor.doctorSpecialty}`)} ·{' '}
													{doctor.doctorLangs.filter((lang) => lang !== Language.KO).join(' ')}
												</span>
												<em>{t('View profile')}</em>
											</span>
										</Link>
									))}
								</div>
							</section>
						)}

						{(location || clinic.clinicAddress) && (
							<section>
								<h2>{t('Location')}</h2>
								{location && (
									<iframe
										className={'clinic-map'}
										title={`${t('Map')}: ${clinic.clinicName}`}
										src={osmEmbed(location)}
										loading={'lazy'}
									/>
								)}
								<div className={'address'}>
									<strong>{clinic.clinicAddress}</strong>
									{location && (
										<a href={osmLink(location)} target={'_blank'} rel={'noopener noreferrer'}>
											{t('Open map')}
										</a>
									)}
								</div>
							</section>
						)}

						<section>
							<h2>{t('Verified reviews')}</h2>
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
											onClick={() => setReviewLimit((limit) => Math.min(limit + REVIEWS_STEP * 2, 50))}
										>
											{t('Show more reviews')} ({reviewTotal - reviewList.length})
										</Button>
									)}
								</>
							) : (
								<p className={'muted'}>{t('No reviews yet. Reviews come only from completed visits.')}</p>
							)}
						</section>
					</Stack>

					{!mobile && <aside className={'side'}>{booking}</aside>}
				</Box>

				{nearby.length > 0 && (
					<section className={'nearby'}>
						<h2>{t('Similar clinics nearby')}</h2>
						<div className={'nearby-grid'}>
							{nearby.map((item) => (
								<ClinicCard key={item._id} clinic={item} onLike={(id) => likeHandler(LikeGroup.CLINIC, id)} />
							))}
						</div>
					</section>
				)}
				{getClinicLoading && <span className={'sr-only'}>{t('Loading')}</span>}
			</Stack>

			{mobile && (
				<>
					<div className={'book-bar'}>
						<span className={'text'}>
							<span>
								{treatment?.treatmentName ?? t('Treatments')} ·{' '}
								{doctorId
									? `${t('Dr.')} ${doctors.find((doctor) => doctor._id === doctorId)?.doctorName ?? ''}`
									: t('Any doctor')}
							</span>
							<strong>{treatment ? formatKrw(treatment.treatmentPrice) : '—'}</strong>
						</span>
						<Button variant={'contained'} endIcon={<ArrowForwardRoundedIcon />} onClick={() => setSheetOpen(true)}>
							{t('Book')}
						</Button>
						<IconButton className={'chat'} aria-label={t('Chat with clinic')} disabled>
							<ChatBubbleOutlineRoundedIcon />
						</IconButton>
					</div>
					<Drawer
						anchor={'bottom'}
						open={sheetOpen}
						onClose={() => setSheetOpen(false)}
						PaperProps={{ className: 'book-sheet' }}
					>
						<span className={'handle'} aria-hidden={true} />
						<IconButton className={'close'} aria-label={t('Close')} onClick={() => setSheetOpen(false)}>
							<CloseRoundedIcon />
						</IconButton>
						{booking}
					</Drawer>
				</>
			)}
		</Stack>
	);
};

export default withLayoutBasic(ClinicDetail);
