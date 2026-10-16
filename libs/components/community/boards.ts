import { BoardArticleCategory } from '../../enums/board-article.enum';
import { MemberType } from '../../enums/member.enum';

export type BoardKey = 'qna' | 'reviews' | 'tips' | 'free';

/** The boards, `?board=`. Treatment reviews are the verified reviews of completed visits (read-only here). */
export const BOARDS: { key: BoardKey; label: string; text: string; category?: BoardArticleCategory }[] = [
	{
		key: 'qna',
		label: 'Q and A',
		text: 'Questions from patients, answered by the community and clinic doctors',
		category: BoardArticleCategory.QNA,
	},
	{ key: 'reviews', label: 'Treatment reviews', text: 'Verified reviews from completed MedVia visits' },
	{
		key: 'tips',
		label: 'Health tips',
		text: 'Written by clinic doctors and the MedVia team',
		category: BoardArticleCategory.HEALTH_TIP,
	},
	{
		key: 'free',
		label: 'Free board',
		text: 'Travel, stays and everything outside the clinic',
		category: BoardArticleCategory.FREE,
	},
];

/** Who opens a post on which board (the API's POSTERS): patients ask and talk, doctors write tips. */
export const WRITERS: Partial<Record<BoardKey, string[]>> = {
	qna: [MemberType.USER],
	free: [MemberType.USER],
	tips: [MemberType.DOCTOR, MemberType.ADMIN],
};
