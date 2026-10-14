import { InquiryCategory, InquirySender, InquiryStatus, NoticeCategory } from '../../enums/cs.enum';
import { Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';

/** A notice or an FAQ entry; `display…` is the text in the language the list asked for. */
export interface Notice {
	_id: string;
	noticeCategory: NoticeCategory;
	noticeFaqCategory?: InquiryCategory | null;
	noticePinned: boolean;
	noticeTitle: string;
	noticeContent?: string;
	noticeViews: number;
	publishedAt?: Date | null;
	createdAt: Date;
	displayTitle?: string | null;
	displayContent?: string | null;
	displayLang?: Language | null;
}

export interface Notices {
	list: Notice[];
	metaCounter: TotalCounter[];
}

export interface NoticesInquiry {
	page: number;
	limit: number;
	noticeCategory: NoticeCategory;
	noticeFaqCategory?: InquiryCategory;
	lang?: Language;
}

export interface InquiryMessage {
	senderType: InquirySender;
	text: string;
	lang: Language;
	createdAt: Date;
}

/** A 1:1 inquiry: the first message is `inquiryContent`, the replies are `inquiryMessages`. */
export interface Inquiry {
	_id: string;
	inquiryCategory: InquiryCategory;
	inquiryStatus: InquiryStatus;
	inquiryTitle: string;
	inquiryContent: string;
	inquiryLang: Language;
	inquiryReplyLang: Language;
	inquiryMessages: InquiryMessage[];
	resolvedAt?: Date | null;
	bookingId?: string | null;
	bookingCode?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Inquiries {
	list: Inquiry[];
	metaCounter: TotalCounter[];
}

export interface InquiryInput {
	inquiryCategory: InquiryCategory;
	inquiryTitle: string;
	inquiryContent: string;
	inquiryLang: Language;
	inquiryReplyLang?: Language;
	bookingId?: string;
}
