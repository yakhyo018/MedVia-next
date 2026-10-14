import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../libs/components/mypage/MyPageFrame';
import EmptyState from '../../libs/components/common/EmptyState';
import ClinicCard from '../../libs/components/clinic/ClinicCard';
import DoctorCard from '../../libs/components/doctor/DoctorCard';
import useLikeTarget from '../../libs/hooks/useLikeTarget';
import { GET_FAVORITE_CLINICS, GET_FAVORITE_DOCTORS } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { Clinic } from '../../libs/types/clinic/clinic';
import { Doctor } from '../../libs/types/doctor/doctor';
import { LikeGroup } from '../../libs/enums/like.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { LIST_MAX } from '../../libs/config';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 9;

/**
 * "My Favorites": the clinics and doctors the patient liked (`?tab=doctors`). Everything listed
 * is liked; a card the patient unlikes leaves the list at once, then the lists are read again.
 */
const MyFavorites: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const likeTarget = useLikeTarget();
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const [removed, setRemoved] = useState<string[]>([]);
	const tab = router.query.tab === 'doctors' ? 'doctors' : 'clinics';
	const isPatient = user.memberType === MemberType.USER;

	/** APOLLO REQUESTS **/
	const clinicsQuery = useQuery(GET_FAVORITE_CLINICS, {
		variables: { input: { page: 1, limit: tab === 'clinics' ? limit : 1 } },
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
		skip: !isPatient,
	});
	const doctorsQuery = useQuery(GET_FAVORITE_DOCTORS, {
		variables: { input: { page: 1, limit: tab === 'doctors' ? limit : 1 } },
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
		skip: !isPatient,
	});
	const clinics: Clinic[] = (clinicsQuery.data?.getFavoriteClinics?.list ?? []).filter(
		(item: Clinic) => !removed.includes(item._id),
	);
	const doctors: Doctor[] = (doctorsQuery.data?.getFavoriteDoctors?.list ?? []).filter(
		(item: Doctor) => !removed.includes(item._id),
	);
	const clinicTotal: number = clinicsQuery.data?.getFavoriteClinics?.metaCounter?.[0]?.total ?? 0;
	const doctorTotal: number = doctorsQuery.data?.getFavoriteDoctors?.metaCounter?.[0]?.total ?? 0;
	const active = tab === 'clinics' ? clinicsQuery : doctorsQuery;
	const shown = tab === 'clinics' ? clinics.length : doctors.length;
	const total = tab === 'clinics' ? clinicTotal : doctorTotal;

	/** HANDLERS **/
	const tabHandler = async (key: 'clinics' | 'doctors') => {
		setLimit(PAGE_SIZE);
		await router.push({ pathname: router.pathname, query: key === 'doctors' ? { tab: key } : {} }, undefined, {
			shallow: true,
		});
	};

	const unlikeHandler = async (group: LikeGroup, id: string) => {
		setRemoved([...removed, id]);
		await likeTarget(group, id);
		// The counters in the tabs come from the API.
		await Promise.all([clinicsQuery.refetch(), doctorsQuery.refetch()]);
	};

	let body: React.ReactNode;
	if (active.loading && shown === 0) {
		body = (
			<Box className={`favorite-grid ${tab === 'clinics' ? 'clinic-grid' : 'doctor-grid'}`}>
				{Array.from({ length: 3 }).map((_, index) => (
					<Skeleton key={index} variant={'rounded'} height={300} />
				))}
			</Box>
		);
	} else if (shown === 0) {
		body = (
			<EmptyState
				title={tab === 'clinics' ? t('No saved clinics yet') : t('No saved doctors yet')}
				text={t('Tap the heart on a clinic or doctor to keep it here.')}
				action={
					<Button variant={'contained'} LinkComponent={Link} href={tab === 'clinics' ? '/clinics' : '/doctors'}>
						{tab === 'clinics' ? t('Find a clinic') : t('Find a doctor')}
					</Button>
				}
			/>
		);
	} else {
		body = (
			<>
				<Box className={`favorite-grid ${tab === 'clinics' ? 'clinic-grid' : 'doctor-grid'}`}>
					{tab === 'clinics'
						? clinics.map((clinic) => (
								<ClinicCard
									key={clinic._id}
									clinic={{ ...clinic, meLiked: true }}
									onLike={(id) => unlikeHandler(LikeGroup.CLINIC, id)}
								/>
							))
						: doctors.map((doctor) => (
								<DoctorCard
									key={doctor._id}
									doctor={{ ...doctor, meLiked: true }}
									onLike={(id) => unlikeHandler(LikeGroup.DOCTOR, id)}
								/>
							))}
				</Box>
				{shown < total && limit < LIST_MAX && (
					<Button
						variant={'outlined'}
						className={'more'}
						disabled={active.loading}
						onClick={() => setLimit(Math.min(limit + PAGE_SIZE, LIST_MAX))}
					>
						{t('Show more')}
					</Button>
				)}
			</>
		);
	}

	return (
		<MyPageFrame title={t('My Favorites')} text={t('Saved clinics and doctors')} className={'my-favorites'}>
			<Box className={'booking-tabs'} role={'tablist'} aria-label={t('My Favorites')}>
				<button type={'button'} role={'tab'} aria-selected={tab === 'clinics'} onClick={() => tabHandler('clinics')}>
					{t('Clinics')} ({clinicTotal})
				</button>
				<button type={'button'} role={'tab'} aria-selected={tab === 'doctors'} onClick={() => tabHandler('doctors')}>
					{t('Doctors')} ({doctorTotal})
				</button>
			</Box>
			{body}
		</MyPageFrame>
	);
};

export default withLayoutBasic(MyFavorites);
