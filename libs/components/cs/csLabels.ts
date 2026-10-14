import { InquiryCategory, InquiryStatus } from '../../enums/cs.enum';

/** The FAQ groups and inquiry topics, in the reader's words. */
export const CATEGORY_LABEL: Record<InquiryCategory, string> = {
	[InquiryCategory.BOOKING]: 'Booking',
	[InquiryCategory.PAYMENT]: 'Payment',
	[InquiryCategory.INTERPRETER]: 'Interpreter',
	[InquiryCategory.MEDICAL_DATA]: 'Medical data',
	[InquiryCategory.ACCOUNT]: 'Account',
};

/** StatusChip tones: waiting amber, answered teal, closed green. */
export const INQUIRY_STATUS: Record<InquiryStatus, { tone: string; label: string }> = {
	[InquiryStatus.NEW]: { tone: 'PENDING', label: 'Sent' },
	[InquiryStatus.IN_PROGRESS]: { tone: 'PENDING', label: 'In progress' },
	[InquiryStatus.ANSWERED]: { tone: 'COMPLETED', label: 'Answered' },
	[InquiryStatus.RESOLVED]: { tone: 'ACTIVE', label: 'Resolved' },
};
