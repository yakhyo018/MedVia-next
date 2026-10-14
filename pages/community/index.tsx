import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, InputAdornment, MenuItem, Pagination, Skeleton, Stack, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ListBanner from '../../libs/components/common/ListBanner';
import EmptyState from '../../libs/components/common/EmptyState';
import ArticleCard from '../../libs/components/community/ArticleCard';
import ReviewCard from '../../libs/components/review/ReviewCard';
import { BOARDS, BoardKey, WRITERS } from '../../libs/components/community/boards';
import { GET_BOARD_ARTICLES, GET_REVIEWS } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { ArticlesInquiry, BoardArticle } from '../../libs/types/board-article/board-article';
import { Review } from '../../libs/types/review/review';
import { MemberType } from '../../libs/enums/member.enum';
import { ClientMessages } from '../../libs/config';
import { sweetLoginConfirmAlert } from '../../libs/sweetAlert';
import { seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 10;

const SORTS = [
	{ key: 'createdAt', label: 'Newest' },
	{ key: 'articleLikes', label: 'Most liked' },
	{ key: 'articleViews', label: 'Most viewed' },
] as const;

/**
 * The Community: Q and A, treatment reviews, health tips and the free board. Filters live in the
 * URL (`board`, `answered`, `text`, `sort`, `page`) like the clinic list.
 */
const Community: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const query = router.query;
	const board = BOARDS.find((item) => item.key === query.board) ?? BOARDS[0];
	const page = Math.max(1, Number(query.page) || 1);
	const answered = query.answered === 'yes' ? true : query.answered === 'no' ? false : undefined;
	const sort = SORTS.find((item) => item.key === query.sort)?.key ?? 'createdAt';
	const text = typeof query.text === 'string' ? query.text : '';
	const [search, setSearch] = useState<string>(text);
	const mobile = device === 'mobile';

	const input: ArticlesInquiry = {
		page,
		limit: PAGE_SIZE,
		sort,
		search: {
			articleCategory: board.category,
			...(text ? { text } : {}),
			...(board.key === 'qna' && answered !== undefined ? { answered } : {}),
		},
	};

	/** APOLLO REQUESTS **/
	const articlesQuery = useQuery(GET_BOARD_ARTICLES, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		skip: !router.isReady || board.key === 'reviews',
	});
	const reviewsQuery = useQuery(GET_REVIEWS, {
		variables: { input: { page, limit: PAGE_SIZE } },
		fetchPolicy: 'cache-and-network',
		skip: !router.isReady || board.key !== 'reviews',
	});
	const result = board.key === 'reviews' ? reviewsQuery : articlesQuery;
	const data = result.data ?? result.previousData;
	const articles: BoardArticle[] = data?.getArticles?.list ?? [];
	const reviews: Review[] = data?.getReviews?.list ?? [];
	const total: number = (data?.getArticles ?? data?.getReviews)?.metaCounter?.[0]?.total ?? 0;
	const pageCount = Math.ceil(total / PAGE_SIZE);
	const shown = board.key === 'reviews' ? reviews.length : articles.length;

	/** LIFECYCLES **/
	useEffect(() => setSearch(text), [text]);

	/** HANDLERS **/
	const pushQuery = async (patch: Record<string, string | undefined>) => {
		const next: Record<string, string> = {};
		Object.entries({ ...query, ...patch }).forEach(([key, value]) => {
			if (typeof value === 'string' && value) next[key] = value;
		});
		await router.push({ pathname: router.pathname, query: next }, undefined, { shallow: true, scroll: false });
	};

	const boardHandler = (key: BoardKey) =>
		router.push({ pathname: router.pathname, query: key === 'qna' ? {} : { board: key } }, undefined, {
			shallow: true,
		});

	const searchHandler = (event: React.FormEvent) => {
		event.preventDefault();
		pushQuery({ text: search.trim() || undefined, page: undefined });
	};

	const writeHandler = async () => {
		if (!user._id) {
			const login = await sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED);
			if (login) await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
			return;
		}
		await router.push({ pathname: '/community/write', query: { board: board.key } });
	};

	const canWrite = !user._id || (WRITERS[board.key] ?? []).includes(user.memberType);
	const writeLabel =
		board.key === 'qna' ? t('Ask a question') : board.key === 'tips' ? t('Write a tip') : t('Write a post');

	let list: React.ReactNode;
	if (result.loading && shown === 0) {
		list = (
			<Stack className={'article-list'}>
				{Array.from({ length: 3 }).map((_, index) => (
					<Skeleton key={index} variant={'rounded'} height={130} />
				))}
			</Stack>
		);
	} else if (shown === 0) {
		list = <EmptyState title={text ? t('Nothing found') : t('No posts yet')} />;
	} else if (board.key === 'reviews') {
		list = (
			<Box className={'review-grid'}>
				{reviews.map((review) => (
					<ReviewCard key={review._id} review={review} />
				))}
			</Box>
		);
	} else if (board.key === 'free' && !mobile) {
		list = (
			<div className={'free-table'} role={'table'} aria-label={t('Free board')}>
				<div className={'row head'} role={'row'}>
					<span role={'columnheader'}>{t('Title')}</span>
					<span role={'columnheader'}>{t('Author')}</span>
					<span role={'columnheader'}>{t('Date')}</span>
					<span role={'columnheader'}>{t('Views')}</span>
				</div>
				{articles.map((article) => (
					<Link key={article._id} href={`/community/detail?id=${article._id}`} className={'row'} role={'row'}>
						<span role={'cell'} className={'title'}>
							{article.articleTitle}
							{article.articleComments > 0 && <b> [{article.articleComments}]</b>}
						</span>
						<span role={'cell'}>{article.authorName}</span>
						<span role={'cell'}>{seoulTime(article.createdAt, router.locale, false)}</span>
						<span role={'cell'}>{article.articleViews}</span>
					</Link>
				))}
			</div>
		);
	} else {
		list = (
			<Stack className={'article-list'}>
				{articles.map((article) => (
					<ArticleCard key={article._id} article={article} />
				))}
			</Stack>
		);
	}

	return (
		<Stack className={'community-page'}>
			<ListBanner
				crumb={t('Community')}
				title={t('Community')}
				text={t('Ask questions and share real treatment experiences')}
			/>
			<Stack className={'container'}>
				<nav className={'board-tabs'} aria-label={t('Community')}>
					{BOARDS.map((item) => (
						<button
							key={item.key}
							type={'button'}
							className={item.key === board.key ? 'active' : ''}
							aria-current={item.key === board.key ? 'page' : undefined}
							onClick={() => boardHandler(item.key)}
						>
							{t(item.label)}
						</button>
					))}
				</nav>
				<p className={'board-rule'}>
					{t(
						'Doctors’ answers carry a doctor badge. Doctor accounts are created by verified clinics. Treatment reviews need a completed visit.',
					)}
				</p>

				<div className={'board-head'}>
					<div>
						<h2>{t(board.label)}</h2>
						<p>{t(board.text)}</p>
					</div>
					{board.key === 'reviews'
						? (!user._id || user.memberType === MemberType.USER) && (
								<Button variant={'outlined'} LinkComponent={Link} href={'/mypage/reviews'}>
									{t('Write a verified review')}
								</Button>
							)
						: canWrite && (
								<Button variant={'contained'} startIcon={<EditOutlinedIcon />} onClick={writeHandler}>
									{writeLabel}
								</Button>
							)}
				</div>

				{board.key !== 'reviews' && (
					<Box className={'board-tools'}>
						<Box component={'form'} className={'search'} onSubmit={searchHandler} role={'search'}>
							<TextField
								size={'small'}
								fullWidth
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder={t('Search posts')}
								inputProps={{ 'aria-label': t('Search posts') }}
								InputProps={{
									startAdornment: (
										<InputAdornment position={'start'}>
											<SearchRoundedIcon />
										</InputAdornment>
									),
								}}
							/>
						</Box>
						{board.key === 'qna' && (
							<div className={'booking-tabs'} role={'tablist'} aria-label={t('Answers')}>
								{[
									{ key: undefined, label: 'All' },
									{ key: 'yes', label: 'Doctor answered' },
									{ key: 'no', label: 'Waiting' },
								].map((item) => (
									<button
										key={item.label}
										type={'button'}
										role={'tab'}
										aria-selected={(query.answered ?? undefined) === item.key}
										onClick={() => pushQuery({ answered: item.key, page: undefined })}
									>
										{t(item.label)}
									</button>
								))}
							</div>
						)}
						<TextField
							select
							size={'small'}
							value={sort}
							onChange={(event) =>
								pushQuery({
									sort: event.target.value === 'createdAt' ? undefined : event.target.value,
									page: undefined,
								})
							}
							inputProps={{ 'aria-label': t('Sort') }}
						>
							{SORTS.map((item) => (
								<MenuItem key={item.key} value={item.key}>
									{t(item.label)}
								</MenuItem>
							))}
						</TextField>
					</Box>
				)}

				{list}

				{pageCount > 1 && (
					<Pagination
						className={'community-pagination'}
						count={pageCount}
						page={Math.min(page, pageCount)}
						onChange={(_, value) => pushQuery({ page: value > 1 ? String(value) : undefined })}
						shape={'rounded'}
						siblingCount={mobile ? 0 : 1}
					/>
				)}
				{board.key === 'tips' && (
					<p className={'board-rule'}>
						{t('News and service updates are in the Help center.')} <Link href={'/cs'}>{t('Open notices')}</Link>
					</p>
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(Community);
