import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, InputAdornment, MenuItem, Skeleton, Stack, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../libs/components/dashboard/ClinicFrame';
import ClinicBookingCard from '../../libs/components/dashboard/ClinicBookingCard';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_CLINIC_BOOKINGS, GET_MY_CLINIC_DOCTORS } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { Booking, BookingsInquiry } from '../../libs/types/booking/booking';
import { Doctor } from '../../libs/types/doctor/doctor';
import { BookingStatus, BookingTab } from '../../libs/enums/booking.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { LIST_MAX } from '../../libs/config';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 10;

/** `?tab=`; "Requests" are the pending ones still in time, "Upcoming" the confirmed ones ahead. */
const TABS: { key: string; label: string; input: Pick<BookingsInquiry, 'tab' | 'bookingStatus'> }[] = [
	{ key: 'requests', label: 'Requests', input: { tab: BookingTab.UPCOMING, bookingStatus: BookingStatus.PENDING } },
	{ key: 'upcoming', label: 'Upcoming', input: { tab: BookingTab.UPCOMING, bookingStatus: BookingStatus.CONFIRMED } },
	{ key: 'past', label: 'Past', input: { tab: BookingTab.PAST } },
	{ key: 'cancelled', label: 'Cancelled', input: { tab: BookingTab.CANCELLED } },
];

/** Every booking of the clinic by state, with a patient / code search and a doctor filter. */
const ClinicBookings: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const [text, setText] = useState<string>('');
	const [search, setSearch] = useState<string>('');
	const [doctorId, setDoctorId] = useState<string>('');
	const active = TABS.find((item) => item.key === router.query.tab) ?? TABS[0];
	const isClinic = user.memberType === MemberType.AGENT;
	const input: BookingsInquiry = {
		page: 1,
		limit,
		...active.input,
		...(search ? { search } : {}),
		...(doctorId ? { doctorId } : {}),
	};

	/** APOLLO REQUESTS **/
	const { data, previousData, loading, refetch } = useQuery(GET_CLINIC_BOOKINGS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		skip: !isClinic,
	});
	const { data: countData, refetch: refetchCount } = useQuery(GET_CLINIC_BOOKINGS, {
		variables: { input: { page: 1, limit: 1, ...TABS[0].input } },
		fetchPolicy: 'cache-and-network',
		skip: !isClinic,
	});
	const { data: doctorsData } = useQuery(GET_MY_CLINIC_DOCTORS, { fetchPolicy: 'cache-first', skip: !isClinic });
	const list: Booking[] = (data ?? previousData)?.getBookings?.list ?? [];
	const total: number = (data ?? previousData)?.getBookings?.metaCounter?.[0]?.total ?? 0;
	const requests: number = countData?.getBookings?.metaCounter?.[0]?.total ?? 0;
	const doctors: Doctor[] = doctorsData?.getMyClinicDoctors ?? [];

	/** HANDLERS **/
	const tabHandler = async (key: string) => {
		setLimit(PAGE_SIZE);
		await router.push({ pathname: router.pathname, query: key === 'requests' ? {} : { tab: key } }, undefined, {
			shallow: true,
		});
	};

	const searchHandler = (event: React.FormEvent) => {
		event.preventDefault();
		setLimit(PAGE_SIZE);
		setSearch(text.trim());
	};

	const changedHandler = async () => {
		await Promise.all([refetch(), refetchCount()]);
	};

	let body: React.ReactNode;
	if (loading && list.length === 0) {
		body = (
			<Stack className={'clinic-booking-list'}>
				{Array.from({ length: 3 }).map((_, index) => (
					<Skeleton key={index} variant={'rounded'} height={170} />
				))}
			</Stack>
		);
	} else if (list.length === 0) {
		body = <EmptyState title={search ? t('Nothing found') : t('Nothing in this tab')} />;
	} else {
		body = (
			<Stack className={'clinic-booking-list'}>
				{list.map((booking) => (
					<ClinicBookingCard key={booking._id} booking={booking} onChanged={changedHandler} />
				))}
				{list.length < total && limit < LIST_MAX && (
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
		<ClinicFrame title={t('Bookings')} text={t('Times are Seoul time.')} className={'clinic-bookings'}>
			<Box className={'booking-tabs'} role={'tablist'} aria-label={t('Bookings')}>
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type={'button'}
						role={'tab'}
						aria-selected={tab.key === active.key}
						onClick={() => tabHandler(tab.key)}
					>
						{t(tab.label)}
						{tab.key === 'requests' && requests > 0 && ` (${requests})`}
					</button>
				))}
			</Box>
			<Box component={'form'} className={'list-tools'} onSubmit={searchHandler} role={'search'}>
				<TextField
					size={'small'}
					value={text}
					onChange={(event) => setText(event.target.value)}
					placeholder={t('Patient name or booking code')}
					inputProps={{ 'aria-label': t('Search bookings') }}
					InputProps={{
						startAdornment: (
							<InputAdornment position={'start'}>
								<SearchRoundedIcon />
							</InputAdornment>
						),
					}}
				/>
				<TextField
					size={'small'}
					select
					value={doctorId}
					onChange={(event) => {
						setLimit(PAGE_SIZE);
						setDoctorId(event.target.value);
					}}
					inputProps={{ 'aria-label': t('Doctor') }}
					SelectProps={{ displayEmpty: true }}
				>
					<MenuItem value={''}>{t('All doctors')}</MenuItem>
					{doctors.map((doctor) => (
						<MenuItem key={doctor._id} value={doctor._id}>
							{t('Dr.')} {doctor.doctorName}
						</MenuItem>
					))}
				</TextField>
				<Button type={'submit'} variant={'outlined'}>
					{t('Search')}
				</Button>
			</Box>
			{body}
		</ClinicFrame>
	);
};

export default withLayoutBasic(ClinicBookings);
