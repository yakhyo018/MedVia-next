import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, InputAdornment, Skeleton, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import MyPageFrame from '../../libs/components/mypage/MyPageFrame';
import ChatConversation from '../../libs/components/chat/ChatConversation';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import { GET_MY_ROOMS } from '../../apollo/user/query';
import { SET_AI_CONSENT } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { ChatRoom } from '../../libs/types/chat/chat';
import { Language } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { localeToLanguage } from '../../libs/config';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { initials, seoulClock, seoulDateKey, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/**
 * "Consultation Chat" (F3): the patient's rooms with clinics, one open at a time (`?room=`).
 * On a phone the list and the room are two screens. The clinic's side of the chat is F5.
 * Since F4 it sits in the MyPage frame, which also asks a guest to log in.
 */
const ChatPage: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [search, setSearch] = useState<string>('');
	const isPatient = user.memberType === MemberType.USER;
	const roomId = typeof router.query.room === 'string' ? router.query.room : '';
	// The chat language is the profile's (what the API translates to), not the site's.
	const myLang: Language = (user.memberLang || localeToLanguage(router.locale)) as Language;

	/** APOLLO REQUESTS **/
	const { data, loading, error, refetch } = useQuery(GET_MY_ROOMS, {
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const [setAiConsent, { loading: consenting }] = useMutation(SET_AI_CONSENT);
	const rooms: ChatRoom[] = data?.getMyRooms ?? [];
	const room = rooms.find((item) => item._id === roomId);
	const shown = rooms.filter((item) => (item.clinicName ?? '').toLowerCase().includes(search.trim().toLowerCase()));

	/** HANDLERS **/
	const openRoomHandler = async (id: string) => {
		await router.push({ pathname: router.pathname, query: id ? { room: id } : {} }, undefined, { shallow: true });
	};

	const consentHandler = async () => {
		try {
			const result = await setAiConsent({ variables: { agreed: true } });
			const at = result.data?.setAiConsent?.memberAiConsentAt;
			userVar({ ...userVar(), memberAiConsentAt: at ? String(at) : new Date().toISOString() });
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const mobile = device === 'mobile';
	const when = (value: Date) =>
		seoulDateKey(value) === seoulDateKey(new Date()) ? seoulClock(value) : seoulTime(value, router.locale, false);

	const consentBanner = isPatient && !user.memberAiConsentAt && (
		<Box className={'ai-banner'}>
			<TranslateRoundedIcon />
			<span>
				<strong>{t('Turn on automatic translation')}</strong>
				{t(
					'Your messages go to the clinic in Korean and their answers come back in your language. AI translates them.',
				)}
			</span>
			<Button variant={'contained'} size={'small'} disabled={consenting} onClick={consentHandler}>
				{t('Turn on')}
			</Button>
		</Box>
	);

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
						<span className={'avatar'}>{initials(item.clinicName)}</span>
						<span className={'text'}>
							<span className={'row'}>
								<strong>{item.clinicName}</strong>
								<time>{when(item.roomLastAt)}</time>
							</span>
							<span className={'row'}>
								<span className={'last'}>{item.lastText ?? t('No messages yet')}</span>
								{item.unread > 0 && <span className={'count'}>{item.unread}</span>}
							</span>
						</span>
					</button>
				))}
			</nav>
		</Box>
	);

	let body: React.ReactNode;
	if (error) {
		body = (
			<EmptyState
				title={t('Something went wrong')}
				text={error.message}
				action={
					<Button variant={'contained'} onClick={() => refetch()}>
						{t('Try again')}
					</Button>
				}
			/>
		);
	} else if (loading && rooms.length === 0) {
		body = <Skeleton variant={'rounded'} height={420} />;
	} else if (rooms.length === 0) {
		body = (
			<EmptyState
				title={t('No conversations yet')}
				text={t('Open a clinic and press "Chat with clinic" to ask before you book.')}
				action={
					<Button variant={'contained'} LinkComponent={Link} href={'/clinics'}>
						{t('Find a clinic')}
					</Button>
				}
			/>
		);
	} else if (mobile) {
		body = room ? <ChatConversation room={room} myLang={myLang} onBack={() => openRoomHandler('')} /> : list;
	} else {
		body = (
			<Box className={'chat-layout'}>
				{list}
				{room ? (
					<ChatConversation room={room} myLang={myLang} />
				) : (
					<div className={'chat-placeholder'}>{t('Choose a conversation')}</div>
				)}
			</Box>
		);
	}

	return (
		<MyPageFrame
			title={t('Consultation Chat')}
			text={t('Messages are translated between your language and Korean')}
			className={`chat-page ${mobile && room ? 'in-room' : ''}`}
			bare={mobile && !!room}
		>
			{consentBanner}
			{body}
		</MyPageFrame>
	);
};

export default withLayoutBasic(ChatPage);
