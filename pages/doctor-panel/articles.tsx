import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton, Stack } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import DoctorFrame from '../../libs/components/doctor-panel/DoctorFrame';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { REMOVE_ARTICLE } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { LIST_MAX } from '../../libs/config';
import { sweetDangerConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { formatCount, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** "My Articles": the doctor's health tips — they go live at once in Community · Health tips. */
const DoctorArticles: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const isDoctor = user.memberType === MemberType.DOCTOR;

	const { data, loading, refetch } = useQuery(GET_BOARD_ARTICLES, {
		variables: {
			input: {
				page: 1,
				limit: LIST_MAX,
				search: { articleCategory: BoardArticleCategory.HEALTH_TIP, memberId: user._id },
			},
		},
		fetchPolicy: 'cache-and-network',
		skip: !isDoctor,
	});
	const [removeArticle] = useMutation(REMOVE_ARTICLE);
	const articles: BoardArticle[] = data?.getArticles?.list ?? [];

	const removeHandler = async (article: BoardArticle) => {
		try {
			const sure = await sweetDangerConfirmAlert(t('Delete this post? Its comments go with it.'), t('Delete'));
			if (!sure) return;
			await removeArticle({ variables: { articleId: article._id } });
			await refetch();
			await sweetTopSmallSuccessAlert(t('Post deleted'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return (
		<DoctorFrame
			title={t('My Articles')}
			text={t('Health tips appear in Community · Health tips.')}
			className={'doctor-articles'}
			action={
				<Button
					variant={'contained'}
					startIcon={<EditOutlinedIcon />}
					LinkComponent={Link}
					href={'/community/write?board=tips'}
				>
					{t('Write a tip')}
				</Button>
			}
		>
			{loading && articles.length === 0 ? (
				<Skeleton variant={'rounded'} height={220} />
			) : articles.length === 0 ? (
				<EmptyState
					title={t('No articles yet')}
					text={t('Share what patients often ask you — aftercare, preparation, what to expect.')}
				/>
			) : (
				<Stack className={'qna-list'}>
					{articles.map((article) => (
						<Box key={article._id} component={'article'} className={'qna-item card'}>
							<span className={'state tip'}>{t('Health tip')}</span>
							<Link href={`/community/detail?id=${article._id}`} className={'title'}>
								{article.articleTitle}
							</Link>
							<span className={'meta'}>
								{t('Published {{date}}', { date: seoulTime(article.createdAt, router.locale, false) })} ·{' '}
								{t('{{count}} views', { count: article.articleViews })} · ♡ {formatCount(article.articleLikes)} ·{' '}
								{t('{{count}} comments', { count: article.articleComments })}
							</span>
							<div className={'comment-tools'}>
								<Button variant={'outlined'} LinkComponent={Link} href={`/community/write?id=${article._id}`}>
									{t('Edit')}
								</Button>
								<Button variant={'outlined'} LinkComponent={Link} href={`/community/detail?id=${article._id}`}>
									{t('View')}
								</Button>
								<Button variant={'text'} color={'error'} onClick={() => removeHandler(article)}>
									{t('Delete')}
								</Button>
							</div>
						</Box>
					))}
				</Stack>
			)}
			<p className={'workspace-hint'}>
				{t('Medical ad rules apply: no guaranteed results, no prices of other clinics. Five reports hide a post.')}
			</p>
		</DoctorFrame>
	);
};

export default withLayoutBasic(DoctorArticles);
