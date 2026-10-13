import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton, Stack } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_MY_NOTIFICATIONS, GET_UNREAD_NOTIFICATION_COUNT } from '../../apollo/user/query';
import { MARK_NOTIFICATIONS_READ } from '../../apollo/user/mutation';
import { sessionReadyVar, userVar } from '../../apollo/store';
import { Notification, NotificationsInquiry } from '../../libs/types/notification/notification';
import { NotificationGroup, NotificationStatus } from '../../libs/enums/notification.enum';
import { notificationView } from '../../libs/notificationText';
import { ClientMessages } from '../../libs/config';
import { sweetLoginConfirmAlert, sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { seoulClock, seoulDateKey, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 20;
const TABS: { key: string; label: string; group?: NotificationGroup }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'bookings', label: 'Bookings', group: NotificationGroup.BOOKING },
	{ key: 'chat', label: 'Chat', group: NotificationGroup.CHAT },
];

/** Bookings, reminders and messages in one list; the tab lives in the URL (`?tab=chat`). */
const Notifications: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const tab = TABS.find((item) => item.key === router.query.tab) ?? TABS[0];
	const input: NotificationsInquiry = { page: 1, limit, ...(tab.group && { notificationGroup: tab.group }) };

	/** APOLLO REQUESTS **/
	const [markRead] = useMutation(MARK_NOTIFICATIONS_READ);
	const { data, previousData, loading, error, refetch } = useQuery(GET_MY_NOTIFICATIONS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		skip: !user._id,
	});
	const list: Notification[] = (data ?? previousData)?.getMyNotifications?.list ?? [];
	const total: number = (data ?? previousData)?.getMyNotifications?.metaCounter?.[0]?.total ?? 0;
	const hasUnread = list.some((item) => item.notificationStatus === NotificationStatus.WAIT);

	/** LIFECYCLES **/
	useEffect(() => {
		if (!sessionReady || user._id) return;
		sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED).then((login) =>
			router.replace(login ? { pathname: '/account/join', query: { referrer: router.asPath } } : '/'),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionReady, user._id]);

	/** HANDLERS **/
	const tabHandler = async (key: string) => {
		setLimit(PAGE_SIZE);
		await router.push({ pathname: router.pathname, query: key === 'all' ? {} : { tab: key } }, undefined, {
			shallow: true,
		});
	};

	const markAllHandler = async () => {
		try {
			await markRead({ variables: { input: {} }, refetchQueries: [GET_UNREAD_NOTIFICATION_COUNT] });
			await refetch();
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const openHandler = async (notification: Notification, href?: string) => {
		if (notification.notificationStatus === NotificationStatus.WAIT) {
			markRead({
				variables: { input: { notificationIds: [notification._id] } },
				refetchQueries: [GET_UNREAD_NOTIFICATION_COUNT, GET_MY_NOTIFICATIONS],
			}).catch(() => undefined);
		}
		if (href) await router.push(href);
	};

	// "Today" and "Earlier" by the Seoul calendar day, like every date on the site.
	const today = seoulDateKey(new Date());
	const sections = [
		{ title: t('Today'), items: list.filter((item) => seoulDateKey(item.createdAt) === today) },
		{ title: t('Earlier'), items: list.filter((item) => seoulDateKey(item.createdAt) !== today) },
	].filter((section) => section.items.length);

	return (
		<Stack className={'notifications-page'}>
			<Stack className={'container'}>
				<div className={'page-head'}>
					<div>
						<h1>{t('Notifications')}</h1>
						<p>{t('Bookings, reminders and messages in one place')}</p>
					</div>
					{hasUnread && (
						<Button size={'small'} onClick={markAllHandler}>
							{t('Mark all as read')}
						</Button>
					)}
				</div>
				<Box className={'booking-tabs'} role={'tablist'} aria-label={t('Notifications')}>
					{TABS.map((item) => (
						<button
							key={item.key}
							type={'button'}
							role={'tab'}
							aria-selected={item.key === tab.key}
							onClick={() => tabHandler(item.key)}
						>
							{t(item.label)}
						</button>
					))}
				</Box>

				{error ? (
					<EmptyState
						title={t('Something went wrong')}
						text={error.message}
						action={
							<Button variant={'contained'} onClick={() => refetch()}>
								{t('Try again')}
							</Button>
						}
					/>
				) : loading && list.length === 0 ? (
					<Stack className={'notification-list'}>
						{Array.from({ length: 4 }).map((_, index) => (
							<Skeleton key={index} variant={'rounded'} height={76} />
						))}
					</Stack>
				) : list.length === 0 ? (
					<EmptyState title={t('No notifications yet')} text={''} />
				) : (
					<Stack className={'notification-list'}>
						{sections.map((section) => (
							<section key={section.title}>
								<h2>{section.title}</h2>
								{section.items.map((notification) => {
									const view = notificationView(notification, t);
									const unread = notification.notificationStatus === NotificationStatus.WAIT;
									return (
										<article
											key={notification._id}
											className={`notification-item ${unread ? 'unread' : ''} ${notification.notificationGroup.toLowerCase()}`}
										>
											<span className={'dot'} aria-hidden={true} />
											<div className={'text'}>
												<div className={'row'}>
													<strong>
														{view.title}
														{notification.notificationCount > 1 && ` (${notification.notificationCount})`}
													</strong>
													<time>
														{seoulTime(notification.createdAt, router.locale, false)} ·{' '}
														{seoulClock(notification.createdAt)}
													</time>
												</div>
												<p>{view.desc}</p>
												{view.action && (
													<Button
														size={'small'}
														className={'action'}
														onClick={() => openHandler(notification, view.action?.href)}
													>
														{view.action.label}
													</Button>
												)}
											</div>
										</article>
									);
								})}
							</section>
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

export default withLayoutBasic(Notifications);
