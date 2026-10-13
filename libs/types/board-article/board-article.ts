import { BoardArticleCategory } from '../../enums/board-article.enum';
import { MemberType } from '../../enums/member.enum';
import { Direction, Language } from '../../enums/common.enum';
import { TotalCounter } from '../common';

/** The article fields the client reads so far (the landing's Community board). Grows with F6. */
export interface BoardArticle {
	_id: string;
	articleCategory: BoardArticleCategory;
	articleTitle: string;
	articleLang: Language;
	articleAnswered: boolean;
	articleLikes: number;
	articleViews: number;
	articleComments: number;
	createdAt: Date;
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
	search?: { articleCategory?: BoardArticleCategory; articleLang?: Language; text?: string };
}
