import { useEffect } from 'react';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { io, Socket } from 'socket.io-client';
import { userVar } from '../../apollo/store';
import { GET_MY_ROOMS, GET_UNREAD_NOTIFICATION_COUNT } from '../../apollo/user/query';
import { getJwtToken, refreshAccessToken } from '../auth';
import { REACT_APP_API_WS } from '../config';
import { Notification } from '../types/notification/notification';
import { NotificationStatus } from '../enums/notification.enum';

/**
 * The app's one socket (namespace `/live`). It only says that something changed — every write
 * still goes through GraphQL. Pages listen to `liveEvents` for the events they care about
 * (the open chat room: new and translated messages); the header's counters and the room list
 * are updated here, in the Apollo cache.
 */
export const LIVE_EVENTS = ['message:new', 'message:translated', 'room:updated', 'notification:new'] as const;
export type LiveEvent = (typeof LIVE_EVENTS)[number];
export const liveEvents = typeof window !== 'undefined' ? new EventTarget() : null;

let socket: Socket | null = null;

/** The access token is in the handshake; the server cuts the socket when that token expires. */
const connect = (token: string): Socket => {
	const next = io(`${REACT_APP_API_WS}/live`, {
		auth: { token },
		withCredentials: true,
		transports: ['websocket'],
	});
	LIVE_EVENTS.forEach((event) =>
		next.on(event, (payload: unknown) => liveEvents?.dispatchEvent(new CustomEvent(event, { detail: payload }))),
	);
	next.on('disconnect', async (reason) => {
		// "io server disconnect": the server closed it — the 15-minute token ran out. Socket.IO does
		// not reconnect by itself here, so get a fresh token and connect again with it.
		if (reason !== 'io server disconnect') return;
		if (await refreshAccessToken()) {
			next.auth = { token: getJwtToken() };
			next.connect();
		}
	});
	next.on('connect_error', async (err) => {
		// A refused handshake (an old token): refresh once and retry; Socket.IO's own retries
		// would keep sending the same expired token.
		if (next.active) return;
		console.log('live socket refused:', err.message);
		if (await refreshAccessToken()) {
			next.auth = { token: getJwtToken() };
			next.connect();
		}
	});
	return next;
};

/** Mounted once in _app: one socket while someone is signed in, none for a guest. */
const useLiveSocket = () => {
	const client = useApolloClient();
	const user = useReactiveVar(userVar);

	useEffect(() => {
		const token = getJwtToken();
		if (!user._id || !token) return;
		socket = connect(token);

		const onNotification = (event: Event) => {
			const notification = (event as CustomEvent<Notification>).detail;
			if (notification?.notificationStatus === NotificationStatus.READ) return;
			client.cache.updateQuery<{ getUnreadNotificationCount: number }>(
				{ query: GET_UNREAD_NOTIFICATION_COUNT },
				(data) => ({ getUnreadNotificationCount: (data?.getUnreadNotificationCount ?? 0) + 1 }),
			);
			// The lists on screen (the bell's menu, /notifications) read again.
			client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'getMyNotifications' });
			client.cache.gc();
		};
		const onRoomUpdated = () => {
			client.refetchQueries({ include: [GET_MY_ROOMS] });
		};
		liveEvents?.addEventListener('notification:new', onNotification);
		liveEvents?.addEventListener('room:updated', onRoomUpdated);

		return () => {
			liveEvents?.removeEventListener('notification:new', onNotification);
			liveEvents?.removeEventListener('room:updated', onRoomUpdated);
			socket?.disconnect();
			socket = null;
		};
	}, [client, user._id]);
};

export default useLiveSocket;
