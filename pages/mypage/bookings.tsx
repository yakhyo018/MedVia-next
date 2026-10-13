import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton, Stack } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import BookingItem from '../../libs/components/booking/BookingItem';
import { COUNT_BOOKINGS, GET_BOOKINGS } from '../../apollo/user/query';
import { UPDATE_BOOKING_STATUS } from '../../apollo/user/mutation';
import { sessionReadyVar, userVar } from '../../apollo/store';
import { Booking, BookingsInquiry } from '../../libs/types/booking/booking';
import { BookingStatus, BookingTab } from '../../libs/enums/booking.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { ClientMessages } from '../../libs/config';
import {
	sweetDangerConfirmAlert,
	sweetLoginConfirmAlert,
	sweetMixinErrorAlert,
	sweetTopSmallSuccessAlert,
} from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 10;
const TABS: { key: BookingTab; label: string; empty: string }[] = [
	{ key: BookingTab.UPCOMING, label: 'Upcoming', empty: 'No upcoming visits. Pick a clinic and a time to book one.' },
	{ key: BookingTab.PAST, label: 'Past', empty: 'Your completed visits appear here.' },
	{ key: BookingTab.CANCELLED, label: 'Cancelled', empty: 'Nothing cancelled.' },
];

/**
 * "My Bookings" (F2). The rest of MyPage — the side menu, chat, reviews — comes in F4; until then
 * this is a page of its own. The tab lives in the URL (`?tab=past`), like the list filters.
 */
const MyBookings: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const [cancellingId, setCancellingId] = useState<string>('');
	const tab = TABS.find((item) => item.key.toLowerCase() === router.query.tab)?.key ?? BookingTab.UPCOMING;
	const isPatient = user.memberType === MemberType.USER;
	const input: BookingsInquiry = { page: 1, limit, tab };

	/** APOLLO REQUESTS **/
	const [updateBookingStatus] = useMutation(UPDATE_BOOKING_STATUS);
	const {
		data,
		previousData,
		loading,
		error,
		refetch: refetchBookings,
	} = useQuery(GET_BOOKINGS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const { data: upcomingCount, refetch: refetchCount } = useQuery(COUNT_BOOKINGS, {
		variables: { input: { page: 1, limit: 1, tab: BookingTab.UPCOMING } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const list: Booking[] = (data ?? previousData)?.getBookings?.list ?? [];
	const total: number = (data ?? previousData)?.getBookings?.metaCounter?.[0]?.total ?? 0;
	const upcoming: number = upcomingCount?.getBookings?.metaCounter?.[0]?.total ?? 0;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!sessionReady || user._id) return;
		sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED).then((login) =>
			router.replace(login ? { pathname: '/account/join', query: { referrer: router.asPath } } : '/'),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionReady, user._id]);

	/** HANDLERS **/
	const tabHandler = async (key: BookingTab) => {
		setLimit(PAGE_SIZE);
		await router.push({ pathname: router.pathname, query: { tab: key.toLowerCase() } }, undefined, { shallow: true });
	};

	const cancelHandler = async (booking: Booking) => {
		try {
			const pending = booking.bookingStatus === BookingStatus.PENDING;
			const sure = await sweetDangerConfirmAlert(
				pending ? t('Cancel this request?') : t('Cancel this booking? The time goes back to other patients.'),
				pending ? t('Cancel request') : t('Cancel booking'),
			);
			if (!sure) return;
			setCancellingId(booking._id);
			await updateBookingStatus({
				variables: { input: { bookingId: booking._id, bookingStatus: BookingStatus.CANCELLED } },
			});
			await Promise.all([refetchBookings(), refetchCount()]);
			await sweetTopSmallSuccessAlert(pending ? t('Request cancelled') : t('Booking cancelled'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setCancellingId('');
		}
	};

	const active = TABS.find((item) => item.key === tab) ?? TABS[0];

	return (
		<Stack className={'my-bookings-page'}>
			<Stack className={'container'}>
				<div className={'page-head'}>
					<h1>{t('My Bookings')}</h1>
					<p>{t('Times are Seoul time.')}</p>
				</div>
				<Box className={'booking-tabs'} role={'tablist'} aria-label={t('My Bookings')}>
					{TABS.map((item) => (
						<button
							key={item.key}
							type={'button'}
							role={'tab'}
							aria-selected={item.key === tab}
							onClick={() => tabHandler(item.key)}
						>
							{t(item.label)}
							{item.key === BookingTab.UPCOMING && upcoming > 0 && ` (${upcoming})`}
						</button>
					))}
				</Box>

				{user._id && !isPatient ? (
					<EmptyState title={t('Only patient accounts have bookings here.')} text={''} />
				) : error ? (
					<EmptyState
						title={t('Something went wrong')}
						text={error.message}
						action={
							<Button variant={'contained'} onClick={() => refetchBookings()}>
								{t('Try again')}
							</Button>
						}
					/>
				) : loading && list.length === 0 ? (
					<Stack className={'booking-list'}>
						{Array.from({ length: 3 }).map((_, index) => (
							<Skeleton key={index} variant={'rounded'} height={132} />
						))}
					</Stack>
				) : list.length === 0 ? (
					<EmptyState
						title={t(active.empty)}
						text={''}
						action={
							tab === BookingTab.UPCOMING ? (
								<Button variant={'contained'} LinkComponent={Link} href={'/clinics'}>
									{t('Find a clinic')}
								</Button>
							) : undefined
						}
					/>
				) : (
					<Stack className={'booking-list'}>
						{list.map((booking) => (
							<BookingItem
								key={booking._id}
								booking={booking}
								cancelling={cancellingId === booking._id}
								onCancel={cancelHandler}
							/>
						))}
						{list.length < total && (
							<Button
								variant={'outlined'}
								className={'more'}
								disabled={loading}
								onClick={() => setLimit(limit + PAGE_SIZE)}
							>
								{t('Show more')}
							</Button>
						)}
					</Stack>
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(MyBookings);
