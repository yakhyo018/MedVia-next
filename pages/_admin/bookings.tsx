import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Skeleton } from '@mui/material';
import withLayoutAdmin from '../../libs/components/layout/LayoutAdmin';
import AdminPills, { AdminPill } from '../../libs/components/admin/AdminPills';
import AdminPager from '../../libs/components/admin/AdminPager';
import AdminStatCard from '../../libs/components/admin/AdminStatCard';
import StatusChip from '../../libs/components/common/StatusChip';
import EmptyState from '../../libs/components/common/EmptyState';
import useUrlQuery from '../../libs/hooks/useUrlQuery';
import { COUNT_ADMIN_BOOKINGS, GET_ADMIN_BOOKINGS, GET_BOOKING_STATS } from '../../apollo/admin/query';
import { Booking } from '../../libs/types/booking/booking';
import { BookingStatus } from '../../libs/enums/booking.enum';
import { seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';
import { ADMIN_I18N, ADMIN_NS } from '../../libs/components/admin/adminText';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 10;

/** A request waiting longer than this is shown in amber. */
const SLOW_MINUTES = 120;

const TABS: { key: string; label: string; status?: BookingStatus }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'pending', label: 'Pending', status: BookingStatus.PENDING },
	{ key: 'confirmed', label: 'Confirmed', status: BookingStatus.CONFIRMED },
	{ key: 'declined', label: 'Declined', status: BookingStatus.DECLINED },
	{ key: 'completed', label: 'Completed', status: BookingStatus.COMPLETED },
	{ key: 'no-show', label: 'No-show', status: BookingStatus.NO_SHOW },
	{ key: 'cancelled', label: 'Cancelled', status: BookingStatus.CANCELLED },
	{ key: 'expired', label: 'Expired', status: BookingStatus.EXPIRED },
];

const COUNT_INPUT = {
	confirmed: { page: 1, limit: 1, bookingStatus: BookingStatus.CONFIRMED },
	declined: { page: 1, limit: 1, bookingStatus: BookingStatus.DECLINED },
	noShow: { page: 1, limit: 1, bookingStatus: BookingStatus.NO_SHOW },
};

/**
 * Every clinic's bookings, read-only: who waits for an answer and for how long. The admin's
 * scope of `getBookings` carries no answers and no AI summary.
 */
const AdminBookings: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const tab = TABS.find((item) => item.key === url.get('tab')) ?? TABS[0];
	const text = url.get('text');
	const locale = router.locale ?? 'en';

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_ADMIN_BOOKINGS, {
		variables: {
			input: {
				page: url.page,
				limit: LIMIT,
				...(tab.status ? { bookingStatus: tab.status } : {}),
				...(text ? { search: text } : {}),
			},
		},
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const { data: statsData } = useQuery(GET_BOOKING_STATS, { fetchPolicy: 'cache-and-network' });
	const { data: countData } = useQuery(COUNT_ADMIN_BOOKINGS, {
		variables: COUNT_INPUT,
		fetchPolicy: 'cache-and-network',
	});
	const bookings: Booking[] = data?.getBookings?.list ?? [];
	const total: number = data?.getBookings?.metaCounter?.[0]?.total ?? 0;
	const count = (key: keyof typeof COUNT_INPUT): number | undefined =>
		countData ? (countData[key]?.metaCounter?.[0]?.total ?? 0) : undefined;
	const pills: AdminPill[] = TABS.map((item) => ({ key: item.key, label: t(item.label) }));

	const waiting = (booking: Booking) => {
		if (booking.bookingStatus !== BookingStatus.PENDING) return '—';
		const minutes = Math.max(0, Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / 60000));
		const label =
			minutes < 60
				? t('{{count}} min', { count: minutes })
				: t('{{hours}} h {{minutes}} min', { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
		return <span className={minutes >= SLOW_MINUTES ? 'warning-text' : ''}>{label}</span>;
	};

	return (
		<div id={'admin-bookings'}>
			<div className={'admin-stats five'}>
				<AdminStatCard label={t('Requests today')} value={statsData?.getBookingStatsByAdmin?.today} />
				<AdminStatCard label={t('Waiting for clinics')} value={statsData?.getBookingStatsByAdmin?.waitingForClinic} />
				<AdminStatCard label={t('Confirmed')} value={count('confirmed')} />
				<AdminStatCard label={t('Declined')} value={count('declined')} />
				<AdminStatCard label={t('No-show')} value={count('noShow')} />
			</div>
			<AdminPills
				pills={pills}
				active={tab.key}
				onChange={(key) => url.set({ tab: key === 'all' ? undefined : key })}
				label={t('Bookings')}
			/>
			<div className={'admin-table-card'}>
				{loading && !data ? (
					<Skeleton variant={'rectangular'} height={420} />
				) : bookings.length === 0 ? (
					<EmptyState title={text ? t('No bookings match "{{text}}".', { text }) : t('No bookings here.')} />
				) : (
					<div className={'admin-table-scroll'}>
						<table className={'admin-table'}>
							<thead>
								<tr>
									<th>{t('Booking')}</th>
									<th>{t('Patient')}</th>
									<th>{t('Clinic · doctor')}</th>
									<th>{t('Treatment')}</th>
									<th>{t('Date & time')}</th>
									<th>{t('Lang')}</th>
									<th>{t('Status')}</th>
									<th>{t('Waiting')}</th>
								</tr>
							</thead>
							<tbody>
								{bookings.map((booking) => (
									<tr key={booking._id}>
										<td className={'strong'}>{booking.bookingCode}</td>
										<td>
											{booking.memberId ? (
												<Link href={`/_admin/users/detail?id=${booking.memberId}`}>{booking.patientName ?? '—'}</Link>
											) : (
												(booking.patientName ?? '—')
											)}
										</td>
										<td>
											{booking.clinicData?.clinicName ?? '—'}
											{booking.doctorData?.doctorName && ` · ${t('Dr.')} ${booking.doctorData.doctorName}`}
										</td>
										<td>{booking.treatmentData?.treatmentName ?? '—'}</td>
										<td>{seoulTime(booking.bookingDate, locale)}</td>
										<td>{booking.bookingLang}</td>
										<td>
											<StatusChip status={booking.bookingStatus} size={'small'} />
										</td>
										<td>{waiting(booking)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{total > 0 && (
					<AdminPager
						page={url.page}
						limit={LIMIT}
						total={total}
						shown={bookings.length}
						onChange={(page) => url.set({ page })}
					/>
				)}
			</div>
		</div>
	);
};

export default withLayoutAdmin(AdminBookings);
