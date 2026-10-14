import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, InputAdornment, Skeleton, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../libs/components/mypage/MyPageFrame';
import MyMenu from '../../libs/components/mypage/MyMenu';
import NextVisitCard from '../../libs/components/mypage/NextVisitCard';
import RecentVisitRow from '../../libs/components/mypage/RecentVisitRow';
import { GET_BOOKINGS, GET_MY_ROOMS, GET_RECENTLY_VISITED } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { Booking } from '../../libs/types/booking/booking';
import { RecentVisit } from '../../libs/types/view/view';
import { ChatRoom } from '../../libs/types/chat/chat';
import { BookingStatus, BookingTab } from '../../libs/enums/booking.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { isReviewable, seoulClock, seoulDateKey, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** By the reader's own clock, not Seoul's: it greets them where they are. */
const greeting = (): string => {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good morning, {{name}}';
	if (hour < 18) return 'Good afternoon, {{name}}';
	return 'Good evening, {{name}}';
};

/**
 * MyPage overview: the next visit, a search, the recently viewed. On a
 * phone it also lists every section (the computer has them in the side menu), with small counters.
 */
const MyPage: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [search, setSearch] = useState<string>('');
	const isPatient = user.memberType === MemberType.USER;
	const mobile = device === 'mobile';

	/** APOLLO REQUESTS **/
	const upcomingQuery = useQuery(GET_BOOKINGS, {
		variables: { input: { page: 1, limit: 1, tab: BookingTab.UPCOMING } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const { data: completedData } = useQuery(GET_BOOKINGS, {
		variables: { input: { page: 1, limit: 20, bookingStatus: BookingStatus.COMPLETED } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const { data: recentData, loading: recentLoading } = useQuery(GET_RECENTLY_VISITED, {
		variables: { input: { page: 1, limit: 4 } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const { data: roomsData } = useQuery(GET_MY_ROOMS, { fetchPolicy: 'cache-first', skip: !isPatient || !mobile });
	const next: Booking | undefined = upcomingQuery.data?.getBookings?.list?.[0];
	const upcoming: number = upcomingQuery.data?.getBookings?.metaCounter?.[0]?.total ?? 0;
	const toWrite: Booking[] = (completedData?.getBookings?.list ?? []).filter(isReviewable);
	const recent: RecentVisit[] = (recentData?.getRecentlyVisited?.list ?? []).filter(
		(visit: RecentVisit) => visit.clinic || visit.doctor,
	);
	const unread: number = (roomsData?.getMyRooms ?? []).reduce((sum: number, room: ChatRoom) => sum + room.unread, 0);

	/** HANDLERS **/
	const searchHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const text = search.trim();
		await router.push({ pathname: '/clinics', query: text ? { text } : {} });
	};

	const firstName = user.memberFullName.split(/\s+/)[0] ?? '';
	const today = seoulDateKey(new Date());
	const badges: Record<string, string> = {};
	if (upcoming) badges['/mypage/bookings'] = String(upcoming);
	if (unread) badges['/mypage/chat'] = String(unread);
	if (toWrite.length) badges['/mypage/reviews'] = t('{{count}} to write', { count: toWrite.length });

	return (
		<MyPageFrame
			title={user._id ? t(greeting(), { name: firstName }) : t('My Page')}
			text={t('Your visits, conversations and saved clinics in one place.')}
			className={'my-overview'}
		>
			<Box component={'form'} className={'my-search'} onSubmit={searchHandler} role={'search'}>
				<TextField
					fullWidth
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder={t('Search clinics, doctors or treatments')}
					inputProps={{ 'aria-label': t('Search clinics, doctors or treatments') }}
					InputProps={{
						startAdornment: (
							<InputAdornment position={'start'}>
								<SearchRoundedIcon />
							</InputAdornment>
						),
					}}
				/>
				{!mobile && (
					<Button type={'submit'} variant={'contained'}>
						{t('Search')}
					</Button>
				)}
			</Box>

			<h2 className={'my-section-title'}>{t('Your next visit')}</h2>
			{upcomingQuery.loading && !next ? (
				<Skeleton variant={'rounded'} height={150} />
			) : next ? (
				<NextVisitCard booking={next} />
			) : (
				<Box className={'card no-visit'}>
					<span>{t('No upcoming visits. Pick a clinic and a time to book one.')}</span>
					<Button variant={'contained'} LinkComponent={Link} href={'/clinics'}>
						{t('Find a clinic')}
					</Button>
				</Box>
			)}

			{toWrite.length > 0 && (
				<Box className={'review-prompt'}>
					<span className={'icon'}>
						<StarBorderRoundedIcon />
					</span>
					<div className={'text'}>
						<strong>
							{t('How was {{treatment}} at {{clinic}}?', {
								treatment: toWrite[0].treatmentData?.treatmentName,
								clinic: toWrite[0].clinicData?.clinicName,
							})}
						</strong>
						<span>{t('Share a verified review — it helps the next patient choose.')}</span>
					</div>
					<Button variant={'outlined'} LinkComponent={Link} href={`/mypage/reviews/write?booking=${toWrite[0]._id}`}>
						{t('Write a review')}
					</Button>
				</Box>
			)}

			{mobile && <MyMenu variant={'list'} badges={badges} />}

			<div className={'section-head'}>
				<h2 className={'my-section-title'}>{t('Recently viewed')}</h2>
				{recent.length > 0 && <Link href={'/mypage/recent'}>{t('See all')}</Link>}
			</div>
			{recentLoading && recent.length === 0 ? (
				<Skeleton variant={'rounded'} height={180} />
			) : recent.length === 0 ? (
				<p className={'my-note left'}>{t('Clinics and doctors you open appear here.')}</p>
			) : (
				<div className={'my-rows'}>
					{recent.map((visit) => (
						<RecentVisitRow
							key={visit._id}
							visit={visit}
							end={
								<time>
									{seoulDateKey(visit.visitedAt) === today
										? seoulClock(visit.visitedAt)
										: seoulTime(visit.visitedAt, router.locale, false)}
								</time>
							}
						/>
					))}
				</div>
			)}
		</MyPageFrame>
	);
};

export default withLayoutBasic(MyPage);
