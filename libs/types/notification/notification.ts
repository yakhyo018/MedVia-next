import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { TotalCounter } from '../common';

export interface Notification {
	_id: string;
	notificationType: NotificationType;
	notificationStatus: NotificationStatus;
	notificationGroup: NotificationGroup;
	/** The server's English text — the fallback when the client has no template. */
	notificationTitle: string;
	notificationDesc: string;
	/** JSON of the values the text is built from (clinicName, treatmentName, when, …). */
	notificationParamsJson?: string | null;
	/** Repeats folded into one row ("3 new messages"). */
	notificationCount: number;
	notificationRefId?: string | null;
	createdAt: Date;
}

export interface Notifications {
	list: Notification[];
	metaCounter: TotalCounter[];
}

export interface NotificationsInquiry {
	page: number;
	limit: number;
	notificationGroup?: NotificationGroup;
	unreadOnly?: boolean;
}
