import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AuthorBadge from './AuthorBadge';
import { BoardArticle } from '../../types/board-article/board-article';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { formatCount, imageUrl, initials, seoulTime } from '../../utils';
import { REACT_APP_API_URL } from '../../config';

interface ArticleCardProps {
	article: BoardArticle;
}

/** A question or a health tip in a list: cover photo (tips), status, title, the start of the text, author, numbers. */
const ArticleCard = (props: ArticleCardProps) => {
	const { article } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const question = article.articleCategory === BoardArticleCategory.QNA;
	const cover = article.articleImages?.[0];

	return (
		<Link href={`/community/detail?id=${article._id}`} className={`article-card mv-lift${cover ? ' with-cover' : ''}`}>
			{cover && (
				<span className={'cover'}>
					<img src={imageUrl(cover, REACT_APP_API_URL)} alt={''} loading={'lazy'} />
				</span>
			)}
			<span className={'chips'}>
				{question ? (
					<span className={`state ${article.articleAnswered ? 'answered' : 'waiting'}`}>
						{article.articleAnswered
							? t('Doctor answered')
							: article.articleComments
								? t('{{count}} answers', { count: article.articleComments })
								: t('Waiting for answers')}
					</span>
				) : (
					<span className={'state tip'}>{t('Health tip')}</span>
				)}
			</span>
			<strong className={'title'}>{article.articleTitle}</strong>
			{article.articleContent && <span className={'excerpt'}>{article.articleContent}</span>}
			<span className={'foot'}>
				<span className={'author'}>
					<span className={'avatar'}>{initials(article.authorName)}</span>
					{article.authorName}
					<AuthorBadge authorType={article.authorType} />
					<span className={'muted'}>· {seoulTime(article.createdAt, router.locale, false)}</span>
				</span>
				<span className={'numbers'}>
					<span title={t('Comments')}>
						<ChatBubbleOutlineRoundedIcon />
						{article.articleComments}
					</span>
					<span title={t('Likes')}>
						<FavoriteBorderRoundedIcon />
						{article.articleLikes}
					</span>
					<span title={t('Views')}>
						<VisibilityOutlinedIcon />
						{formatCount(article.articleViews)}
					</span>
				</span>
			</span>
		</Link>
	);
};

export default ArticleCard;
