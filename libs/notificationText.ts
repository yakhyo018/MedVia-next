import { TFunction } from 'i18next';
import { Notification } from './types/notification/notification';
import { NotificationType } from './enums/notification.enum';

export interface NotificationView {
	title: string;
	desc: string;
	/** Where the row's action goes, and its label. */
	action?: { href: string; label: string };
}

/**
 * The API renders an English title and description; the client renders the same notification
 * in the reader's language from its type and params (`notificationParamsJson`), and falls back
 * to the server's text for a type it does not know. `when` arrives formatted in Seoul time.
 * A clinic account's links lead into the Clinic Dashboard, a patient's into My Page.
 */
export const notificationView = (notification: Notification, t: TFunction, clinic = false): NotificationView => {
	let params: Record<string, string> = {};
	try {
		params = JSON.parse(notification.notificationParamsJson || '{}');
	} catch {
		params = {};
	}
	const refId = notification.notificationRefId ?? '';
	const bookings = { href: clinic ? '/dashboard/bookings' : '/mypage/bookings', label: t('View booking') };

	switch (notification.notificationType) {
		case NotificationType.BOOKING_REQUESTED:
			return {
				title: t('New booking request'),
				desc: t('{{patientName}} · {{treatmentName}} · {{when}}', params),
				action: { href: '/dashboard', label: t('Answer the request') },
			};
		case NotificationType.BOOKING_CONFIRMED:
			return {
				title: t('Booking confirmed'),
				desc: t('{{clinicName}} confirmed {{treatmentName}} on {{when}}.', params),
				action: bookings,
			};
		case NotificationType.BOOKING_DECLINED:
			return {
				title: t('Booking declined'),
				desc: t("{{clinicName}} couldn't take {{when}}. The time was released.", params),
				action: { href: '/mypage/bookings?tab=cancelled', label: t('Pick another time') },
			};
		case NotificationType.BOOKING_CANCELLED:
			return {
				title: t('Booking cancelled'),
				desc: t('{{treatmentName}} on {{when}} was cancelled.', params),
				action: {
					href: clinic ? '/dashboard/bookings?tab=cancelled' : '/mypage/bookings?tab=cancelled',
					label: t('View booking'),
				},
			};
		case NotificationType.BOOKING_EXPIRED:
			return {
				title: t('Booking request expired'),
				desc: t("{{clinicName}} didn't answer in time for {{when}}. The time was released.", params),
				action: { href: '/clinics', label: t('Pick another time') },
			};
		case NotificationType.VISIT_REMINDER:
			return {
				title: t('Your visit is coming up'),
				desc: t('{{treatmentName}} at {{clinicName}} · {{when}}', params),
				action: bookings,
			};
		case NotificationType.NEW_MESSAGE:
			return {
				title: t('New message from {{senderName}}', params),
				desc: params.preview ?? notification.notificationDesc,
				action: { href: `${clinic ? '/dashboard/chat' : '/mypage/chat'}?room=${refId}`, label: t('Reply') },
			};
		default:
			return { title: notification.notificationTitle, desc: notification.notificationDesc };
	}
};
