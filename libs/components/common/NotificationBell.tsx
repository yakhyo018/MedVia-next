import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Badge, Box, Button, CircularProgress, IconButton, Menu } from '@mui/material';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { GET_MY_NOTIFICATIONS, GET_UNREAD_NOTIFICATION_COUNT } from '../../../apollo/user/query';
import { MARK_NOTIFICATIONS_READ } from '../../../apollo/user/mutation';
import { Notification } from '../../types/notification/notification';
import { NotificationStatus } from '../../enums/notification.enum';
import { notificationView } from '../../notificationText';
import { seoulClock, seoulTime } from '../../utils';
import { sweetMixinErrorAlert } from '../../sweetAlert';

interface NotificationBellProps {
	/** A phone opens the /notifications page; a desktop opens the menu. */
	mobile: boolean;
}

/** The header bell (signed-in members only): the unread count, live from the socket. */
const NotificationBell = (props: NotificationBellProps) => {
	const { mobile } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);

	/** APOLLO REQUESTS **/
	const { data: countData } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, { fetchPolicy: 'cache-and-network' });
	const { data: listData, loading } = useQuery(GET_MY_NOTIFICATIONS, {
		variables: { input: { page: 1, limit: 5 } },
		fetchPolicy: 'cache-and-network',
		skip: !anchor,
	});
	const [markRead] = useMutation(MARK_NOTIFICATIONS_READ);
	const unread: number = countData?.getUnreadNotificationCount ?? 0;
	const list: Notification[] = listData?.getMyNotifications?.list ?? [];

	/** HANDLERS **/
	const markAllHandler = async () => {
		try {
			await markRead({
				variables: { input: {} },
				refetchQueries: [GET_UNREAD_NOTIFICATION_COUNT, GET_MY_NOTIFICATIONS],
			});
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const openHandler = async (notification: Notification, href?: string) => {
		setAnchor(null);
		if (notification.notificationStatus === NotificationStatus.WAIT) {
			markRead({
				variables: { input: { notificationIds: [notification._id] } },
				refetchQueries: [GET_UNREAD_NOTIFICATION_COUNT],
			}).catch(() => undefined);
		}
		if (href) await router.push(href);
	};

	const label = unread ? t('Notifications, {{count}} unread', { count: unread }) : t('Notifications');
	const bell = (
		<Badge badgeContent={unread} max={99} color={'error'} overlap={'circular'}>
			<NotificationsNoneRoundedIcon />
		</Badge>
	);

	if (mobile) {
		return (
			<IconButton className={'bell'} aria-label={label} LinkComponent={Link} href={'/notifications'}>
				{bell}
			</IconButton>
		);
	}

	return (
		<>
			<IconButton
				className={'bell'}
				aria-label={label}
				aria-haspopup={'menu'}
				aria-expanded={Boolean(anchor)}
				onClick={(event) => setAnchor(event.currentTarget)}
			>
				{bell}
			</IconButton>
			<Menu
				anchorEl={anchor}
				open={Boolean(anchor)}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{ paper: { className: 'mv-bell-menu' } }}
				MenuListProps={{ 'aria-label': t('Notifications') }}
			>
				<Box className={'bell-head'}>
					<strong>{t('Notifications')}</strong>
					{unread > 0 && (
						<Button size={'small'} onClick={markAllHandler}>
							{t('Mark all as read')}
						</Button>
					)}
				</Box>
				{loading && list.length === 0 ? (
					<Box className={'bell-state'}>
						<CircularProgress size={22} />
					</Box>
				) : list.length === 0 ? (
					<Box className={'bell-state'}>{t('No notifications yet')}</Box>
				) : (
					list.map((notification) => {
						const view = notificationView(notification, t);
						const unreadRow = notification.notificationStatus === NotificationStatus.WAIT;
						return (
							<button
								key={notification._id}
								type={'button'}
								className={`bell-item ${unreadRow ? 'unread' : ''}`}
								onClick={() => openHandler(notification, view.action?.href)}
							>
								<span className={'text'}>
									<strong>{view.title}</strong>
									<span>{view.desc}</span>
								</span>
								<time>
									{seoulTime(notification.createdAt, router.locale, false)} · {seoulClock(notification.createdAt)}
								</time>
							</button>
						);
					})
				)}
				<Box className={'bell-foot'}>
					<Link href={'/notifications'} onClick={() => setAnchor(null)}>
						{t('See all notifications')}
					</Link>
				</Box>
			</Menu>
		</>
	);
};

export default NotificationBell;
