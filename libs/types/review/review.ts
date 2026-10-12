import { Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';

export interface ReviewReply {
	replyContent: string;
	replyLang: Language;
	/** CLINIC or DOCTOR */
	replierType: string;
	repliedAt: Date;
}

export interface Review {
	_id: string;
	reviewRating: number;
	reviewTags?: string[];
	reviewContent: string;
	reviewLang: Language;
	reviewReply?: ReviewReply | null;
	/** "Feride K." — the public lists never show a full name. */
	patientName?: string;
	clinicName?: string;
	doctorName?: string;
	treatmentName?: string;
	visitDate?: Date;
	createdAt: Date;
}

export interface RatingCount {
	stars: number;
	count: number;
}

export interface RatingSummary {
	rating: number;
	reviews: number;
	distribution: RatingCount[];
}

export interface Reviews {
	list: Review[];
	metaCounter: TotalCounter[];
	summary?: RatingSummary;
}

export interface ReviewsInquiry {
	page: number;
	limit: number;
	clinicId?: string;
	doctorId?: string;
	treatmentId?: string;
}
