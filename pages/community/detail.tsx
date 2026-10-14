import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton, Stack } from '@mui/material';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import OutlinedFlagRoundedIcon from '@mui/icons-material/OutlinedFlagRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import AuthorBadge from '../../libs/components/community/AuthorBadge';
import CommentList from '../../libs/components/community/CommentList';
import ReportDialog from '../../libs/components/community/ReportDialog';
import { BOARDS } from '../../libs/components/community/boards';
import useLikeTarget from '../../libs/hooks/useLikeTarget';
import useShare from '../../libs/hooks/useShare';
import { GET_ARTICLE } from '../../apollo/user/query';
import { REMOVE_ARTICLE } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticleCategory, ReportGroup } from '../../libs/enums/board-article.enum';
import { LikeGroup } from '../../libs/enums/like.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { ClientMessages, LANGUAGES } from '../../libs/config';
import {
	sweetDangerConfirmAlert,
	sweetLoginConfirmAlert,
	sweetMixinErrorAlert,
	sweetTopSmallSuccessAlert,
} from '../../libs/sweetAlert';
import { formatCount, initials, isObjectId, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** One post: the text, like / share / report, the author's Edit and Delete, and the comments. */
const ArticleDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const likeTarget = useLikeTarget();
	const share = useShare();
	const [reporting, setReporting] = useState<boolean>(false);
	const articleId = isObjectId(router.query.id) ? router.query.id : '';

	/** APOLLO REQUESTS **/
	const { data, loading, error } = useQuery(GET_ARTICLE, {
		variables: { articleId },
		fetchPolicy: 'cache-and-network',
		skip: !articleId,
	});
	const [removeArticle] = useMutation(REMOVE_ARTICLE);
	const article: BoardArticle | undefined = data?.getArticle;
	const board = (article && BOARDS.find((item) => item.category === article.articleCategory)) || BOARDS[0];
	const boardHref = board.key === 'qna' ? '/community' : `/community?board=${board.key}`;
	const mine = Boolean(article && user._id && article.memberId === user._id);
	const canReport = user.memberType === MemberType.USER || user.memberType === MemberType.DOCTOR;
	const lang = LANGUAGES.find((item) => item.code === article?.articleLang)?.label ?? article?.articleLang;

	/** HANDLERS **/
	const removeHandler = async () => {
		if (!article) return;
		try {
			const sure = await sweetDangerConfirmAlert(t('Delete this post? Its comments go with it.'), t('Delete'));
			if (!sure) return;
			await removeArticle({ variables: { articleId: article._id } });
			await sweetTopSmallSuccessAlert(t('Post deleted'));
			await router.push(boardHref);
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const reportHandler = async () => {
		if (!user._id) {
			const login = await sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED);
			if (login) await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
			return;
		}
		setReporting(true);
	};

	let body: React.ReactNode;
	if ((loading && !article) || !router.isReady) {
		body = <Skeleton variant={'rounded'} height={420} />;
	} else if (!article || error) {
		body = (
			<EmptyState
				title={t('Post not found')}
				text={t('It may have been deleted or hidden after reports.')}
				action={
					<Button variant={'contained'} LinkComponent={Link} href={'/community'}>
						{t('Community')}
					</Button>
				}
			/>
		);
	} else {
		const question = article.articleCategory === BoardArticleCategory.QNA;
		body = (
			<>
				<Box component={'article'} className={'article-body card'}>
					<div className={'chips'}>
						<span className={'board'}>{t(board.label)}</span>
						{question && (
							<span className={`state ${article.articleAnswered ? 'answered' : 'waiting'}`}>
								{article.articleAnswered ? t('Doctor answered') : t('Waiting for answers')}
							</span>
						)}
					</div>
					<h1>{article.articleTitle}</h1>
					<div className={'author'}>
						<span className={'avatar'}>{initials(article.authorName)}</span>
						<span className={'who'}>
							<span className={'name'}>
								<strong>{article.authorName}</strong>
								<AuthorBadge authorType={article.authorType} />
							</span>
							<span>
								{seoulTime(article.createdAt, router.locale, false)} ·{' '}
								{t('{{count}} views', { count: article.articleViews })} · {t('Written in {{lang}}', { lang })}
							</span>
						</span>
					</div>
					<p className={'content'}>{article.articleContent}</p>
					<div className={'actions'}>
						<Button
							variant={'outlined'}
							className={article.meLiked ? 'liked' : ''}
							startIcon={article.meLiked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
							aria-pressed={Boolean(article.meLiked)}
							onClick={() => likeTarget(LikeGroup.ARTICLE, article._id)}
						>
							{t('Like')} · {formatCount(article.articleLikes)}
						</Button>
						<Button variant={'outlined'} startIcon={<ShareOutlinedIcon />} onClick={() => share(article.articleTitle)}>
							{t('Share')}
						</Button>
						{mine ? (
							<>
								<Button variant={'text'} LinkComponent={Link} href={`/community/write?id=${article._id}`}>
									{t('Edit')}
								</Button>
								<Button variant={'text'} color={'error'} onClick={removeHandler}>
									{t('Delete')}
								</Button>
							</>
						) : (
							(!user._id || canReport) && (
								<Button
									variant={'text'}
									className={'report'}
									startIcon={<OutlinedFlagRoundedIcon />}
									onClick={reportHandler}
								>
									{t('Report')}
								</Button>
							)
						)}
					</div>
				</Box>
				<CommentList article={article} />
				<ReportDialog
					target={reporting ? { group: ReportGroup.ARTICLE, id: article._id } : null}
					onClose={() => setReporting(false)}
				/>
			</>
		);
	}

	return (
		<Stack className={'article-page'}>
			<Stack className={'container'}>
				<nav className={'crumbs'} aria-label={t('Breadcrumb')}>
					<Link href={'/'}>{t('Home')}</Link>
					<span>/</span>
					<Link href={'/community'}>{t('Community')}</Link>
					<span>/</span>
					<Link href={boardHref}>{t(board.label)}</Link>
				</nav>
				<Link href={boardHref} className={'back-link'}>
					<ChevronLeftRoundedIcon />
					{t(board.label)}
				</Link>
				{body}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(ArticleDetail);
