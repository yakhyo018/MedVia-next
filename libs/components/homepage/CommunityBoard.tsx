import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Skeleton } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { GET_ARTICLES } from '../../../apollo/user/query';
import { ArticlesInquiry, BoardArticle } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import { MemberType } from '../../enums/member.enum';
import { formatCount } from '../../utils';
import HomeSection from './HomeSection';

/** Two columns on desktop; on mobile the tabs show one at a time (CSS, both lists are loaded). */
const BOARDS: { category: BoardArticleCategory; label: string; replies: string }[] = [
	{ category: BoardArticleCategory.QNA, label: 'Q and A', replies: '{{count}} answers' },
	{ category: BoardArticleCategory.HEALTH_TIP, label: 'Health tips', replies: '{{count}} comments' },
];

const inquiry = (category: BoardArticleCategory): ArticlesInquiry => ({
	page: 1,
	limit: 4,
	sort: 'articleViews',
	direction: Direction.DESC,
	search: { articleCategory: category },
});

interface BoardColumnProps {
	category: BoardArticleCategory;
	label: string;
	replies: string;
	active: boolean;
}

const BoardColumn = (props: BoardColumnProps) => {
	const { category, label, replies, active } = props;
	const { t } = useTranslation('common');
	const { data, loading } = useQuery(GET_ARTICLES, {
		variables: { input: inquiry(category) },
		fetchPolicy: 'cache-and-network',
	});
	const list: BoardArticle[] = data?.getArticles?.list ?? [];

	return (
		<div className={`board-column ${active ? 'active' : ''}`} role={'tabpanel'} id={`board-${category}`}>
			<h3>{t(label)}</h3>
			<ul>
				{loading && list.length === 0
					? Array.from({ length: 4 }).map((_, index) => (
							<li key={index}>
								<Skeleton variant={'text'} width={'80%'} />
							</li>
						))
					: list.map((article) => (
							// Posts open with the community pages (F6); until then the list is read-only.
							<li key={article._id}>
								<strong>{article.articleTitle}</strong>
								<span className={'meta'}>
									<span>
										{article.authorName}
										{article.authorType === MemberType.DOCTOR && <em>{t('Doctor')}</em>} ·{' '}
										{t(replies, { count: article.articleComments })}
									</span>
									<span className={'views'}>
										<VisibilityOutlinedIcon />
										{formatCount(article.articleViews)}
									</span>
								</span>
							</li>
						))}
				{!loading && list.length === 0 && <li className={'empty'}>{t('No posts yet')}</li>}
			</ul>
		</div>
	);
};

const CommunityBoard = () => {
	const { t } = useTranslation('common');
	const [tab, setTab] = useState<BoardArticleCategory>(BoardArticleCategory.QNA);

	return (
		<HomeSection
			id={'community-board'}
			title={t('Community board')}
			text={t('Questions and experiences from other patients')}
			tone={'tint'}
		>
			<Box className={'board-tabs'} role={'tablist'} aria-label={t('Community board')}>
				{BOARDS.map((board) => (
					<button
						key={board.category}
						type={'button'}
						role={'tab'}
						aria-selected={tab === board.category}
						aria-controls={`board-${board.category}`}
						onClick={() => setTab(board.category)}
					>
						{t(board.label)}
					</button>
				))}
			</Box>
			<Box className={'board-grid'}>
				{BOARDS.map((board) => (
					<BoardColumn key={board.category} {...board} active={tab === board.category} />
				))}
			</Box>
			<p className={'board-note'}>{t('The full community opens soon')}</p>
		</HomeSection>
	);
};

export default CommunityBoard;
