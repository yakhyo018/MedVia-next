import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Box, Skeleton, Stack } from '@mui/material';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../libs/components/dashboard/ClinicFrame';
import ClinicBookingCard from '../../libs/components/dashboard/ClinicBookingCard';
import StatusChip from '../../libs/components/common/StatusChip';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_CLINIC_BOOKINGS, GET_CLINIC_SCHEDULE, GET_MY_CLINIC } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { Booking } from '../../libs/types/booking/booking';
import { Clinic } from '../../libs/types/clinic/clinic';
import { Slot } from '../../libs/types/slot/slot';
import { BookingStatus, BookingTab } from '../../libs/enums/booking.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { formatCount, seoulClock, seoulDateKey, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const REQUESTS_SHOWN = 3;

/** "Oldest 22 min": how long the longest-waiting request has waited. */
const waited = (createdAt: Date | string): string => {
	const minutes = Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	return hours < 24 ? `${hours} h` : `${Math.floor(hours / 24)} d`;
};

/**
 * The Clinic Dashboard home: today in numbers, the booking requests to answer (with the patient's
 * answers and the Korean AI summary), and today's visits from the schedule.
 */
const ClinicDashboard: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const isClinic = user.memberType === MemberType.AGENT;
	const today = seoulDateKey(new Date());

	/** APOLLO REQUESTS **/
	const { data: clinicData } = useQuery(GET_MY_CLINIC, { fetchPolicy: 'cache-first', skip: !isClinic });
	const requestsQuery = useQuery(GET_CLINIC_BOOKINGS, {
		variables: {
			input: { page: 1, limit: REQUESTS_SHOWN, tab: BookingTab.UPCOMING, bookingStatus: BookingStatus.PENDING },
		},
		fetchPolicy: 'cache-and-network',
		skip: !isClinic,
	});
	const scheduleQuery = useQuery(GET_CLINIC_SCHEDULE, {
		variables: { input: { dateFrom: today } },
		fetchPolicy: 'cache-and-network',
		skip: !isClinic,
	});
	const clinic: Clinic | undefined = clinicData?.getMyClinic;
	const requests: Booking[] = requestsQuery.data?.getBookings?.list ?? [];
	const waiting: number = requestsQuery.data?.getBookings?.metaCounter?.[0]?.total ?? 0;
	const oldest = requests.reduce<Booking | undefined>(
		(first, item) => (!first || new Date(item.createdAt) < new Date(first.createdAt) ? item : first),
		undefined,
	);

	// Today's visits: one row per booking (a 60-minute treatment holds two slots).
	const todaySlots: Slot[] = (scheduleQuery.data?.getClinicSchedule ?? []).filter(
		(slot: Slot) => slot.bookingData && seoulDateKey(slot.slotStart) === today,
	);
	const visits = Array.from(
		todaySlots
			.filter((slot) =>
				[BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(
					slot.bookingData!.bookingStatus,
				),
			)
			.reduce((byCode, slot) => {
				const code = slot.bookingData!.bookingCode;
				if (!byCode.has(code)) byCode.set(code, slot);
				return byCode;
			}, new Map<string, Slot>())
			.values(),
	).sort((a, b) => +new Date(a.slotStart) - +new Date(b.slotStart));

	/** HANDLERS **/
	const changedHandler = async () => {
		await Promise.all([requestsQuery.refetch(), scheduleQuery.refetch()]);
	};

	const stats = [
		{
			icon: <TodayOutlinedIcon />,
			label: t('Today’s visits'),
			value: String(visits.length),
			sub: t('Confirmed for today'),
		},
		{
			icon: <HourglassEmptyRoundedIcon />,
			label: t('Waiting for you'),
			value: String(waiting),
			sub: oldest ? t('Oldest {{time}}', { time: waited(oldest.createdAt) }) : t('All answered'),
			warn: waiting > 0,
		},
		{
			icon: <StarRoundedIcon />,
			label: t('Rating'),
			value: clinic?.clinicReviews ? (clinic.clinicRating ?? 0).toFixed(1) : '—',
			sub: t('{{count}} reviews', { count: clinic?.clinicReviews ?? 0 }),
		},
		{
			icon: <GroupOutlinedIcon />,
			label: t('Followers'),
			value: formatCount(clinic?.clinicFollowers ?? 0),
			sub: t('{{count}} views', { count: clinic?.clinicViews ?? 0 }),
		},
	];

	return (
		<ClinicFrame title={t('Dashboard')} className={'clinic-dashboard'}>
			<Box className={'stat-grid'}>
				{stats.map((stat) => (
					<div key={stat.label} className={`stat card ${stat.warn ? 'warn' : ''}`}>
						<span className={'icon'}>{stat.icon}</span>
						<span className={'text'}>
							<span>{stat.label}</span>
							<strong>{stat.value}</strong>
							<small>{stat.sub}</small>
						</span>
					</div>
				))}
			</Box>

			<Box className={'dashboard-columns'}>
				<Stack className={'requests'}>
					<div className={'section-head'}>
						<div>
							<h2>{t('Booking requests')}</h2>
							<span>{t('Approve or decline. Declined times are released automatically.')}</span>
						</div>
						{waiting > 0 && <Link href={'/dashboard/bookings'}>{t('See all ({{count}})', { count: waiting })}</Link>}
					</div>
					{requestsQuery.loading && requests.length === 0 ? (
						<Skeleton variant={'rounded'} height={260} />
					) : requests.length === 0 ? (
						<EmptyState title={t('No requests waiting')} text={t('New requests appear here and under the bell.')} />
					) : (
						requests.map((booking) => (
							<ClinicBookingCard key={booking._id} booking={booking} expanded onChanged={changedHandler} />
						))
					)}
				</Stack>

				<aside className={'today card'}>
					<div className={'head'}>
						<h3>
							{t('Today')} · {seoulTime(new Date(), router.locale, false)}
						</h3>
						<Link href={'/dashboard/schedule'}>{t('Schedule')}</Link>
					</div>
					{scheduleQuery.loading && visits.length === 0 ? (
						<Skeleton variant={'rounded'} height={160} />
					) : visits.length === 0 ? (
						<p className={'hint'}>{t('No visits today.')}</p>
					) : (
						visits.map((slot) => (
							<div key={slot._id} className={'visit'}>
								<time>{seoulClock(slot.slotStart)}</time>
								<span className={'text'}>
									<strong>{slot.bookingData?.patientName}</strong>
									<span>{slot.bookingData?.treatmentName}</span>
								</span>
								<StatusChip status={slot.bookingData!.bookingStatus} size={'small'} />
							</div>
						))
					)}
				</aside>
			</Box>
		</ClinicFrame>
	);
};

export default withLayoutBasic(ClinicDashboard);
