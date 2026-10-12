import React, { useMemo, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Button, Drawer, MenuItem, Pagination, Skeleton, Stack, TextField } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import useLikeTarget from '../../libs/hooks/useLikeTarget';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ListBanner from '../../libs/components/common/ListBanner';
import ListTabs from '../../libs/components/common/ListTabs';
import EmptyState from '../../libs/components/common/EmptyState';
import ClinicCard from '../../libs/components/clinic/ClinicCard';
import ClinicFilter, { ClinicFilterValues, EMPTY_CLINIC_FILTER } from '../../libs/components/clinic/ClinicFilter';
import { GET_CLINICS } from '../../apollo/user/query';
import { Clinic } from '../../libs/types/clinic/clinic';
import { ClinicSort, ClinicsInquiry } from '../../libs/types/clinic/clinic.input';
import { District, Specialty } from '../../libs/enums/clinic.enum';
import { Direction, Language } from '../../libs/enums/common.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LANGUAGES } from '../../libs/config';
import { formatKrw } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 9;

/** URL key → API sort. Recommended (`clinicScore`) is the default; price goes cheapest first. */
const SORTS: { key: string; label: string; sort: ClinicSort; direction: Direction }[] = [
	{ key: '', label: 'Recommended', sort: 'clinicScore', direction: Direction.DESC },
	{ key: 'rating', label: 'Rating', sort: 'clinicRating', direction: Direction.DESC },
	{ key: 'price', label: 'Price: low to high', sort: 'clinicMinPrice', direction: Direction.ASC },
	{ key: 'likes', label: 'Likes', sort: 'clinicLikes', direction: Direction.DESC },
	{ key: 'views', label: 'Views', sort: 'clinicViews', direction: Direction.DESC },
	{ key: 'newest', label: 'Newest', sort: 'createdAt', direction: Direction.DESC },
];

const DEFAULT_INPUT: ClinicsInquiry = { page: 1, limit: PAGE_SIZE, sort: 'clinicScore', direction: Direction.DESC };

/** One value of the URL query, or '' — the query is user input, so only known values pass. */
const queryValue = (value: string | string[] | undefined): string => (typeof value === 'string' ? value : '');
const listOf = <V extends string>(value: string, allowed: readonly V[]): V[] =>
	value.split(',').filter((item): item is V => (allowed as readonly string[]).includes(item));
const price = (value: string): string => (/^\d{1,9}$/.test(value) ? value : '');

const ClinicList: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const likeHandler = useLikeTarget();
	const [filterOpen, setFilterOpen] = useState<boolean>(false);

	/** The URL is the state: back / forward and a shared link show the same list. */
	const { text, specialty, district, lang, min, max, interpreter, sort: sortKey, page: pageQuery } = router.query;
	const filter: ClinicFilterValues = useMemo(() => {
		const sp = queryValue(specialty);
		return {
			text: queryValue(text).slice(0, 100),
			specialty: (Object.values(Specialty) as string[]).includes(sp) ? (sp as Specialty) : '',
			districts: listOf(queryValue(district), Object.values(District)),
			langs: listOf(
				queryValue(lang),
				LANGUAGES.map((item) => item.code),
			),
			priceMin: price(queryValue(min)),
			priceMax: price(queryValue(max)),
			interpreter: queryValue(interpreter) === '1',
		};
	}, [text, specialty, district, lang, min, max, interpreter]);

	const sort = SORTS.find((item) => item.key === queryValue(sortKey)) ?? SORTS[0];
	const page = Math.max(1, parseInt(queryValue(pageQuery), 10) || 1);

	const searchInput: ClinicsInquiry = {
		...DEFAULT_INPUT,
		page,
		sort: sort.sort,
		direction: sort.direction,
		search: {
			...(filter.text && { text: filter.text }),
			...(filter.specialty && { specialty: filter.specialty }),
			...(filter.districts.length && { districts: filter.districts }),
			...(filter.langs.length && { langs: filter.langs }),
			...(filter.priceMin && { priceMin: Number(filter.priceMin) }),
			...(filter.priceMax && { priceMax: Number(filter.priceMax) }),
			...(filter.interpreter && { interpreter: true }),
		},
	};

	/** APOLLO REQUESTS **/
	const {
		loading: getClinicsLoading,
		data: getClinicsData,
		error: getClinicsError,
		previousData,
	} = useQuery(GET_CLINICS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: searchInput },
		skip: !router.isReady,
	});

	// While the next page loads, keep the last list on screen instead of flashing skeletons.
	const result = getClinicsData?.getClinics ?? previousData?.getClinics;
	const clinics: Clinic[] = result?.list ?? [];
	const total: number = result?.metaCounter?.[0]?.total ?? 0;
	const pageCount = Math.ceil(total / PAGE_SIZE);
	const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
	const last = Math.min(page * PAGE_SIZE, total);

	/** HANDLERS **/
	const pushQuery = async (next: Record<string, string | number>) => {
		const query = Object.fromEntries(
			Object.entries({ ...router.query, ...next }).filter(([, value]) => value !== '' && value !== undefined),
		);
		await router.push({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
	};

	const applyHandler = async (values: ClinicFilterValues) => {
		setFilterOpen(false);
		await pushQuery({
			text: values.text,
			specialty: values.specialty,
			district: values.districts.join(','),
			lang: values.langs.join(','),
			min: values.priceMin,
			max: values.priceMax,
			interpreter: values.interpreter ? '1' : '',
			page: '',
		});
		// A shorter list would leave the reader below it: go back to the top of the results.
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const sortHandler = async (key: string) => {
		await pushQuery({ sort: key, page: '' });
	};

	const pageHandler = async (_: React.ChangeEvent<unknown>, value: number) => {
		await pushQuery({ page: value === 1 ? '' : value });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	/** The applied filters as removable chips. */
	const chips: { label: string; remove: Partial<ClinicFilterValues> }[] = [
		...(filter.text ? [{ label: `“${filter.text}”`, remove: { text: '' } }] : []),
		...filter.districts.map((d) => ({
			label: t(`district.${d}`),
			remove: { districts: filter.districts.filter((x) => x !== d) },
		})),
		...(filter.specialty ? [{ label: t(`specialty.${filter.specialty}`), remove: { specialty: '' as const } }] : []),
		...(filter.priceMin || filter.priceMax
			? [
					{
						label: `${filter.priceMin ? formatKrw(Number(filter.priceMin)) : '₩0'} – ${
							filter.priceMax ? formatKrw(Number(filter.priceMax)) : '…'
						}`,
						remove: { priceMin: '', priceMax: '' },
					},
				]
			: []),
		...filter.langs.map((code) => ({
			label: LANGUAGES.find((item) => item.code === code)?.label ?? code,
			remove: { langs: filter.langs.filter((x) => x !== (code as Language)) },
		})),
		...(filter.interpreter ? [{ label: t('Interpreter'), remove: { interpreter: false } }] : []),
	];

	const filterPanel = <ClinicFilter values={filter} onApply={applyHandler} />;

	const results = (
		<Stack className={'clinic-results'}>
			<ListTabs active={'clinics'} />

			<Box className={'list-head'}>
				<span className={'count'}>
					{result ? (
						<>
							{t('Showing')}{' '}
							<b>
								{first}–{last}
							</b>{' '}
							{t('of')} <b>{total}</b> {t('clinics')}
						</>
					) : (
						<Skeleton width={180} />
					)}
				</span>
				<Box className={'head-actions'}>
					{device === 'mobile' && (
						<Button
							variant={'outlined'}
							size={'small'}
							startIcon={<TuneRoundedIcon />}
							onClick={() => setFilterOpen(true)}
						>
							{t('Filters')}
							{chips.length > 0 && ` (${chips.length})`}
						</Button>
					)}
					<TextField
						select
						size={'small'}
						className={'sort-select'}
						value={sort.key}
						onChange={(e) => sortHandler(e.target.value)}
						inputProps={{ 'aria-label': t('Sort by') }}
						SelectProps={{ displayEmpty: true }}
					>
						{SORTS.map((item) => (
							<MenuItem key={item.key || 'recommended'} value={item.key}>
								{t(item.label)}
							</MenuItem>
						))}
					</TextField>
				</Box>
			</Box>

			{chips.length > 0 && (
				<Box className={'filter-chips'}>
					{chips.map((chip) => (
						<button key={chip.label} onClick={() => applyHandler({ ...filter, ...chip.remove })}>
							{chip.label}
							<CloseRoundedIcon />
						</button>
					))}
					<button className={'clear'} onClick={() => applyHandler(EMPTY_CLINIC_FILTER)}>
						{t('Clear all')}
					</button>
				</Box>
			)}

			{getClinicsError && !result ? (
				<EmptyState
					title={t('Something went wrong!')}
					text={getClinicsError.message}
					action={
						<Button variant={'contained'} onClick={() => router.reload()}>
							{t('Try again')}
						</Button>
					}
				/>
			) : !result && (getClinicsLoading || !router.isReady) ? (
				<Box className={'clinic-grid'}>
					{Array.from({ length: PAGE_SIZE }).map((_, index) => (
						<Skeleton key={index} variant={'rounded'} height={350} />
					))}
				</Box>
			) : clinics.length === 0 ? (
				<EmptyState
					title={t('No clinics found')}
					text={t('Try another district, specialty, price or language.')}
					action={
						<Button variant={'outlined'} onClick={() => applyHandler(EMPTY_CLINIC_FILTER)}>
							{t('Clear filters')}
						</Button>
					}
				/>
			) : (
				<Box className={`clinic-grid ${getClinicsLoading ? 'is-loading' : ''}`}>
					{clinics.map((clinic, index) => (
						<Box key={clinic._id} className={'mv-enter'} style={{ ['--mv-delay' as string]: `${index * 40}ms` }}>
							<ClinicCard clinic={clinic} onLike={(id) => likeHandler(LikeGroup.CLINIC, id)} />
						</Box>
					))}
				</Box>
			)}

			{pageCount > 1 && (
				<Pagination
					className={'list-pagination'}
					count={pageCount}
					page={Math.min(page, pageCount)}
					onChange={pageHandler}
					shape={'rounded'}
					siblingCount={device === 'mobile' ? 0 : 1}
				/>
			)}
		</Stack>
	);

	const banner = (
		<ListBanner
			crumb={t('Clinics')}
			title={t('Find a clinic')}
			text={t('Compare verified clinics and their doctors by treatment, price and language')}
		/>
	);

	if (device === 'mobile') {
		return (
			<Stack className={'clinic-list-page'}>
				{banner}
				<Stack className={'container'}>{results}</Stack>
				<Drawer
					anchor={'bottom'}
					open={filterOpen}
					onClose={() => setFilterOpen(false)}
					PaperProps={{ className: 'mv-filter-sheet' }}
				>
					{filterPanel}
				</Drawer>
			</Stack>
		);
	} else {
		return (
			<Stack className={'clinic-list-page'}>
				{banner}
				<Stack className={'container'}>
					<aside>{filterPanel}</aside>
					{results}
				</Stack>
			</Stack>
		);
	}
};

export default withLayoutBasic(ClinicList);
