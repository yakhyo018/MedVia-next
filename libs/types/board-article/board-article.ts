import { BoardArticleCategory, BoardArticleStatus, ReportGroup, ReportReason } from '../../enums/board-article.enum';
import { MemberType } from '../../enums/member.enum';
import { Direction, Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';

/** A community post: a question, a health tip or a free-board post. */
export interface BoardArticle {
	_id: string;
	articleCategory: BoardArticleCategory;
	articleStatus?: BoardArticleStatus;
	articleTitle: string;
	/** Only the detail asks for the body. */
	articleContent?: string;
	articleLang: Language;
	articleAnswered: boolean;
	articleLikes: number;
	articleViews: number;
	articleComments: number;
	createdAt: Date;
	updatedAt?: Date;
	/** The author's account (own posts: Edit / Delete). */
	memberId?: string;
	/** Only when the viewer is signed in. */
	meLiked?: boolean | null;
	/** "Feride K.", "Dr. Han Seo-yeon" or "MedVia". */
	authorName?: string;
	/** DOCTOR shows the doctor badge. */
	authorType?: MemberType;
}

export interface BoardArticles {
	list: BoardArticle[];
	metaCounter: TotalCounter[];
}

export interface ArticlesInquiry {
	page: number;
	limit: number;
	sort?: 'createdAt' | 'articleLikes' | 'articleViews';
	direction?: Direction;
	search?: {
		articleCategory?: BoardArticleCategory;
		text?: string;
		/** One author's posts (the Doctor Panel's My Articles). */
		memberId?: string;
		/** Questions with (true) or without (false) a doctor's answer. */
		answered?: boolean;
	};
}

export interface ArticleInput {
	articleCategory: BoardArticleCategory;
	articleTitle: string;
	articleContent: string;
	articleLang: Language;
}

export interface ArticleUpdate {
	articleId: string;
	articleTitle?: string;
	articleContent?: string;
	articleLang?: Language;
}

/** A flat comment; a doctor's comment on a question is its answer. */
export interface Comment {
	_id: string;
	commentContent: string;
	commentLang: Language;
	articleId: string;
	memberId: string;
	createdAt: Date;
	updatedAt?: Date;
	authorName?: string;
	authorType?: MemberType;
}

export interface Comments {
	list: Comment[];
	metaCounter: TotalCounter[];
}

export interface ReportInput {
	reportGroup: ReportGroup;
	reportRefId: string;
	reportReason: ReportReason;
	reportDetail?: string;
}
