import React, { useMemo } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Button, Pagination, Skeleton, Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import DoctorCard from '../../libs/components/doctor/DoctorCard';
import DoctorFilter, { DoctorFilterValues } from '../../libs/components/doctor/DoctorFilter';
import EmptyState from '../../libs/components/common/EmptyState';
import ListBanner from '../../libs/components/common/ListBanner';
import ListTabs from '../../libs/components/common/ListTabs';
import { GET_DOCTORS } from '../../apollo/user/query';
import { Doctor } from '../../libs/types/doctor/doctor';
import { DoctorSort, DoctorsInquiry } from '../../libs/types/doctor/doctor.input';
import { Specialty } from '../../libs/enums/clinic.enum';
import { Direction, Language } from '../../libs/enums/common.enum';
import { LANGUAGES } from '../../libs/config';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 8;

/** The sort pills. Recommended (`doctorScore`) is the default: rating and activity together. */
const SORTS: { value: DoctorSort; label: string }[] = [
	{ value: 'doctorScore', label: 'Recommended' },
	{ value: 'doctorRating', label: 'Rating' },
	{ value: 'doctorLikes', label: 'Likes' },
	{ value: 'doctorViews', label: 'Views' },
	{ value: 'createdAt', label: 'Recent' },
];

const DEFAULT_INPUT: DoctorsInquiry = {
	page: 1,
	limit: PAGE_SIZE,
	sort: 'doctorScore',
	direction: Direction.DESC,
	search: {},
};

/** One value of the URL query, or '' — the query is user input, so only known values pass. */
const queryValue = (value: string | string[] | undefined): string => (typeof value === 'string' ? value : '');

const DoctorList: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');

	/** The URL is the state: back / forward and a shared link show the same list. */
	const filter: DoctorFilterValues = useMemo(() => {
		const specialty = queryValue(router.query.specialty);
		const lang = queryValue(router.query.lang);
		return {
			text: queryValue(router.query.text).slice(0, 100),
			specialty: (Object.values(Specialty) as string[]).includes(specialty) ? (specialty as Specialty) : '',
			lang: LANGUAGES.some((item) => item.code === lang) ? lang : '',
		};
	}, [router.query.text, router.query.specialty, router.query.lang]);

	const sort: DoctorSort =
		SORTS.find((item) => item.value === queryValue(router.query.sort))?.value ?? (DEFAULT_INPUT.sort as DoctorSort);
	const page = Math.max(1, parseInt(queryValue(router.query.page), 10) || 1);

	const searchInput: DoctorsInquiry = {
		...DEFAULT_INPUT,
		page,
		sort,
		search: {
			...(filter.text && { text: filter.text }),
			...(filter.specialty && { specialty: filter.specialty }),
			...(filter.lang && { langs: [filter.lang as Language] }),
		},
	};

	/** APOLLO REQUESTS **/
	const {
		loading: getDoctorsLoading,
		data: getDoctorsData,
		error: getDoctorsError,
		previousData,
	} = useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchInput },
		skip: !router.isReady,
	});

	// While the next page loads, keep the last list on screen instead of flashing skeletons.
	const result = getDoctorsData?.getDoctors ?? previousData?.getDoctors;
	const doctors: Doctor[] = result?.list ?? [];
	const total: number = result?.metaCounter?.[0]?.total ?? 0;
	const pageCount = Math.ceil(total / PAGE_SIZE);

	/** HANDLERS **/
	const pushQuery = async (next: Record<string, string | number>) => {
		const query = Object.fromEntries(
			Object.entries({ ...router.query, ...next }).filter(([, value]) => value !== '' && value !== undefined),
		);
		await router.push({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
	};

	const searchHandler = async (values: DoctorFilterValues) => {
		await pushQuery({ ...values, page: '' });
	};

	const sortHandler = async (value: DoctorSort) => {
		await pushQuery({ sort: value === DEFAULT_INPUT.sort ? '' : value, page: '' });
	};

	const pageHandler = async (_: React.ChangeEvent<unknown>, value: number) => {
		await pushQuery({ page: value === 1 ? '' : value });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const resetHandler = async () => {
		await router.push({ pathname: router.pathname }, undefined, { shallow: true, scroll: false });
	};

	const banner = (
		<ListBanner
			crumb={t('Doctors')}
			title={t('Find a doctor')}
			text={t('Verified doctors of Seoul clinics who speak your language')}
		/>
	);

	const list = (
		<>
			<Box className={'list-head'}>
				<span className={'count'}>
					{result ? (
						<>
							<b>{total}</b> {t('doctors found')}
						</>
					) : (
						<Skeleton width={140} />
					)}
				</span>
				<Box className={'sorts'} role={'group'} aria-label={t('Sort by')}>
					{SORTS.map((item) => (
						<button
							key={item.value}
							className={item.value === sort ? 'active' : ''}
							aria-pressed={item.value === sort}
							onClick={() => sortHandler(item.value)}
						>
							{t(item.label)}
						</button>
					))}
				</Box>
			</Box>

			{getDoctorsError && !result ? (
				<EmptyState
					title={t('Something went wrong!')}
					text={getDoctorsError.message}
					action={
						<Button variant={'contained'} onClick={() => router.reload()}>
							{t('Try again')}
						</Button>
					}
				/>
			) : !result && (getDoctorsLoading || !router.isReady) ? (
				<Box className={'doctor-grid'}>
					{Array.from({ length: PAGE_SIZE }).map((_, index) => (
						<Skeleton key={index} variant={'rounded'} height={330} />
					))}
				</Box>
			) : doctors.length === 0 ? (
				<EmptyState
					title={t('No doctors found')}
					text={t('Try another name, specialty or language.')}
					action={
						<Button variant={'outlined'} onClick={resetHandler}>
							{t('Clear filters')}
						</Button>
					}
				/>
			) : (
				<Box className={`doctor-grid ${getDoctorsLoading ? 'is-loading' : ''}`}>
					{doctors.map((doctor, index) => (
						<Box key={doctor._id} className={'mv-enter'} style={{ ['--mv-delay' as string]: `${index * 40}ms` }}>
							<DoctorCard doctor={doctor} />
						</Box>
					))}
				</Box>
			)}

			{pageCount > 1 && (
				<Pagination
					className={'doctor-pagination'}
					count={pageCount}
					page={Math.min(page, pageCount)}
					onChange={pageHandler}
					shape={'rounded'}
					siblingCount={device === 'mobile' ? 0 : 1}
				/>
			)}
		</>
	);

	// Same markup on both devices; #mobile-wrap styles stack the filter and use one column.
	return (
		<Stack className={'doctor-list-page'}>
			{banner}
			<Stack className={'container'}>
				<ListTabs active={'doctors'} />
				<DoctorFilter values={filter} onSearch={searchHandler} />
				{list}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(DoctorList);
