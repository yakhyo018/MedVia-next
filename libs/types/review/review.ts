import { Language } from '../../enums/common.enum';
import { ReviewStatus, ReviewTag } from '../../enums/review.enum';
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
	/** Only the patient's own list (getMyReviews) asks for the moderation fields. */
	reviewStatus?: ReviewStatus;
	reviewRating: number;
	reviewTags?: ReviewTag[];
	reviewContent: string;
	reviewLang: Language;
	reviewReply?: ReviewReply | null;
	/** The admin's reason when asking for an edit or hiding the review. */
	reviewNote?: string | null;
	submittedAt?: Date;
	bookingId?: string;
	clinicId?: string;
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

/** "Write a verified review" — for one COMPLETED booking of the patient. */
export interface ReviewCreateInput {
	bookingId: string;
	reviewRating: number;
	reviewTags?: ReviewTag[];
	reviewContent: string;
	reviewLang: Language;
	ownVisitConfirmed: boolean;
}

/** Any edit sends the review back to moderation (PENDING). */
export interface ReviewUpdate {
	reviewId: string;
	reviewRating?: number;
	reviewTags?: ReviewTag[];
	reviewContent?: string;
	reviewLang?: Language;
}
