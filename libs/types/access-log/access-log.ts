import { AccessType } from '../../enums/access-log.enum';
import { MemberType } from '../../enums/member.enum';
import { TotalCounter } from '../common';

/** One time a clinic or doctor opened the patient's answers or their AI summary. */
export interface AccessLog {
	_id: string;
	accessType: AccessType;
	bookingId: string;
	bookingCode?: string | null;
	readerType: MemberType;
	readerName?: string | null;
	createdAt: Date;
}

export interface AccessLogs {
	list: AccessLog[];
	metaCounter: TotalCounter[];
}
