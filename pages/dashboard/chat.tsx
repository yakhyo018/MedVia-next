import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Box, InputAdornment, Skeleton, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../libs/components/dashboard/ClinicFrame';
import ClinicBookingCard from '../../libs/components/dashboard/ClinicBookingCard';
import ChatConversation from '../../libs/components/chat/ChatConversation';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_CLINIC_BOOKINGS, GET_MY_ROOMS } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { ChatRoom } from '../../libs/types/chat/chat';
import { Booking } from '../../libs/types/booking/booking';
import { BookingTab } from '../../libs/enums/booking.enum';
import { Language } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { LANGUAGES } from '../../libs/config';
import { initials, seoulClock, seoulDateKey, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/**
 * "Consultations": the clinic's rooms with patients (`?room=`, or `?member=` from a booking).
 * The team writes Korean; each patient reads their own language. Only a patient opens a room,
 * so a booking whose patient never wrote has no conversation yet.
 */
const ClinicChat: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [search, setSearch] = useState<string>('');
	const isClinic = user.memberType === MemberType.AGENT;
	const mobile = device === 'mobile';
	const roomId = typeof router.query.room === 'string' ? router.query.room : '';
	const memberId = typeof router.query.member === 'string' ? router.query.member : '';

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_MY_ROOMS, { fetchPolicy: 'cache-and-network', skip: !isClinic });
	const rooms: ChatRoom[] = data?.getMyRooms ?? [];
	const room = rooms.find((item) => item._id === roomId);
	const shown = rooms.filter((item) => (item.patientName ?? '').toLowerCase().includes(search.trim().toLowerCase()));
	// The patient's next (or last) booking, shown above the conversation.
	const bookingQuery = useQuery(GET_CLINIC_BOOKINGS, {
		variables: { input: { page: 1, limit: 1, tab: BookingTab.UPCOMING, memberId: room?.memberId } },
		fetchPolicy: 'cache-and-network',
		skip: !room,
	});
	const pastQuery = useQuery(GET_CLINIC_BOOKINGS, {
		variables: { input: { page: 1, limit: 1, tab: BookingTab.PAST, memberId: room?.memberId } },
		fetchPolicy: 'cache-and-network',
		skip: !room,
	});
	const booking: Booking | undefined =
		bookingQuery.data?.getBookings?.list?.[0] ?? pastQuery.data?.getBookings?.list?.[0];

	/** LIFECYCLES **/
	useEffect(() => {
		// From a booking card: open that patient's room if there is one.
		if (!memberId || rooms.length === 0) return;
		const match = rooms.find((item) => item.memberId === memberId);
		if (match) router.replace({ pathname: router.pathname, query: { room: match._id } }, undefined, { shallow: true });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [memberId, rooms.length]);

	/** HANDLERS **/
	const openRoomHandler = async (id: string) => {
		await router.push({ pathname: router.pathname, query: id ? { room: id } : {} }, undefined, { shallow: true });
	};

	const when = (value: Date) =>
		seoulDateKey(value) === seoulDateKey(new Date()) ? seoulClock(value) : seoulTime(value, router.locale, false);
	const langLabel = (code?: Language) => LANGUAGES.find((lang) => lang.code === code)?.label ?? '';

	const list = (
		<Box className={'chat-rooms'}>
			<TextField
				fullWidth
				size={'small'}
				value={search}
				placeholder={t('Search conversations')}
				onChange={(event) => setSearch(event.target.value)}
				inputProps={{ 'aria-label': t('Search conversations') }}
				InputProps={{
					startAdornment: (
						<InputAdornment position={'start'}>
							<SearchRoundedIcon />
						</InputAdornment>
					),
				}}
			/>
			<nav aria-label={t('Conversations')}>
				{shown.map((item) => (
					<button
						key={item._id}
						type={'button'}
						className={`room ${item._id === roomId ? 'active' : ''} ${item.unread ? 'unread' : ''}`}
						aria-current={item._id === roomId ? 'page' : undefined}
						onClick={() => openRoomHandler(item._id)}
					>
						<span className={'avatar'}>{initials(item.patientName)}</span>
						<span className={'text'}>
							<span className={'row'}>
								<strong>{item.patientName}</strong>
								<time>{when(item.roomLastAt)}</time>
							</span>
							<span className={'row'}>
								<span className={'last'}>{item.lastText ?? langLabel(item.patientLang)}</span>
								{item.unread > 0 && <span className={'count'}>{item.unread}</span>}
							</span>
						</span>
					</button>
				))}
			</nav>
		</Box>
	);

	const conversation = room && (
		<ChatConversation
			room={room}
			myLang={Language.KO}
			side={'clinic'}
			onBack={mobile ? () => openRoomHandler('') : undefined}
		/>
	);

	let body: React.ReactNode;
	if (loading && rooms.length === 0) {
		body = <Skeleton variant={'rounded'} height={420} />;
	} else if (rooms.length === 0) {
		body = (
			<EmptyState
				title={t('No conversations yet')}
				text={t('A conversation starts when a patient writes to the clinic.')}
			/>
		);
	} else if (mobile) {
		body = room ? conversation : list;
	} else {
		body = (
			<Box className={'chat-layout'}>
				{list}
				{conversation ?? <div className={'chat-placeholder'}>{t('Choose a conversation')}</div>}
			</Box>
		);
	}

	return (
		<ClinicFrame
			title={t('Consultations')}
			text={t('Your team writes in Korean, patients read in their own language')}
			className={`chat-page clinic-chat ${mobile && room ? 'in-room' : ''}`}
			bare={mobile && !!room}
		>
			{memberId && rooms.length > 0 && !rooms.some((item) => item.memberId === memberId) && (
				<div className={'workspace-notice'}>
					<strong>{t('This patient has not written to the clinic yet.')}</strong>
					<span>{t('Only a patient can start a conversation; it appears here when they do.')}</span>
				</div>
			)}
			{room && booking && !(mobile && room) && (
				<ClinicBookingCard booking={booking} onChanged={() => bookingQuery.refetch()} />
			)}
			{body}
		</ClinicFrame>
	);
};

export default withLayoutBasic(ClinicChat);
