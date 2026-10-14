import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, MenuItem, Skeleton, Stack, TextField } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import { BOARDS, BoardKey, WRITERS } from '../../libs/components/community/boards';
import { GET_ARTICLE } from '../../apollo/user/query';
import { CREATE_ARTICLE, UPDATE_ARTICLE } from '../../apollo/user/mutation';
import { sessionReadyVar, userVar } from '../../apollo/store';
import { ArticleInput, BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Language } from '../../libs/enums/common.enum';
import { ClientMessages, LANGUAGES, localeToLanguage } from '../../libs/config';
import { sweetLoginConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { isObjectId } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** The API's limits (ArticleInput). */
const TITLE_MIN = 2;
const TITLE_MAX = 150;
const CONTENT_MIN = 10;
const CONTENT_MAX = 5000;

const GUIDELINES = [
	'Share your own experience',
	'Mention prices only as you paid them',
	'No before/after photos or personal data of others',
	'No links to clinics outside MedVia',
];

const DEFAULT_INPUT: ArticleInput = {
	articleCategory: BoardArticleCategory.QNA,
	articleTitle: '',
	articleContent: '',
	articleLang: Language.EN,
};

/**
 * Write a post (`?board=qna|free|tips`) or edit one (`?id=`). The board is fixed once posted;
 * a patient picks Q and A or the free board, a doctor writes health tips. Posts go live at once.
 */
const WriteArticle: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [input, setInput] = useState<ArticleInput>(DEFAULT_INPUT);
	const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
	const [filled, setFilled] = useState<boolean>(false);
	const articleId = isObjectId(router.query.id) ? router.query.id : '';
	const boards = BOARDS.filter((board) => board.category && (WRITERS[board.key] ?? []).includes(user.memberType));

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_ARTICLE, {
		variables: { articleId },
		fetchPolicy: 'network-only',
		skip: !articleId,
	});
	const [createArticle, { loading: creating }] = useMutation(CREATE_ARTICLE);
	const [updateArticle, { loading: updating }] = useMutation(UPDATE_ARTICLE);
	const article: BoardArticle | undefined = data?.getArticle;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!sessionReady || user._id) return;
		sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED).then((login) =>
			router.replace(login ? { pathname: '/account/join', query: { referrer: router.asPath } } : '/community'),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionReady, user._id]);

	useEffect(() => {
		if (filled || !router.isReady || !user._id) return;
		if (articleId) {
			if (!article) return;
			setInput({
				articleCategory: article.articleCategory,
				articleTitle: article.articleTitle,
				articleContent: article.articleContent ?? '',
				articleLang: article.articleLang,
			});
		} else {
			const wanted = boards.find((board) => board.key === (router.query.board as BoardKey)) ?? boards[0];
			setInput({
				...DEFAULT_INPUT,
				articleCategory: wanted?.category ?? BoardArticleCategory.QNA,
				articleLang: (user.memberLang || localeToLanguage(router.locale)) as Language,
			});
		}
		setFilled(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.isReady, user._id, articleId, article]);

	/** HANDLERS **/
	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const title = input.articleTitle.trim();
		const content = input.articleContent.trim();
		const found: typeof errors = {};
		if (title.length < TITLE_MIN || title.length > TITLE_MAX) found.title = t('Write 2 to 150 characters');
		if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) found.content = t('Write 10 to 5000 characters');
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		try {
			let id = articleId;
			if (articleId) {
				await updateArticle({
					variables: {
						input: { articleId, articleTitle: title, articleContent: content, articleLang: input.articleLang },
					},
				});
			} else {
				const result = await createArticle({
					variables: { input: { ...input, articleTitle: title, articleContent: content } },
				});
				id = result.data.createArticle._id;
			}
			await sweetTopSmallSuccessAlert(articleId ? t('Saved') : t('Published'));
			await router.push(`/community/detail?id=${id}`);
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const title = articleId ? t('Edit post') : t('Write a post');
	let body: React.ReactNode;
	if (!user._id || (articleId && loading && !article)) {
		body = <Skeleton variant={'rounded'} height={420} />;
	} else if (articleId && (!article || article.memberId !== user._id)) {
		body = <EmptyState title={t('You can edit only your own posts.')} />;
	} else if (!articleId && boards.length === 0) {
		body = (
			<EmptyState
				title={t('Clinic accounts don’t post in the community — that would be advertising.')}
				text={t('Your doctors can write health tips and answer questions from the Doctor Panel.')}
			/>
		);
	} else {
		const board = BOARDS.find((item) => item.category === input.articleCategory);
		body = (
			<Box className={'write-layout'}>
				<Box component={'form'} noValidate onSubmit={submitHandler} className={'write-form card'}>
					<TextField
						select
						label={t('Board')}
						value={input.articleCategory}
						disabled={Boolean(articleId) || boards.length < 2}
						onChange={(event) => setInput({ ...input, articleCategory: event.target.value as BoardArticleCategory })}
						helperText={board ? t(board.text) : undefined}
					>
						{(articleId && board ? [board] : boards).map((item) => (
							<MenuItem key={item.key} value={item.category}>
								{t(item.label)}
							</MenuItem>
						))}
					</TextField>
					<TextField
						label={t('Title')}
						value={input.articleTitle}
						onChange={(event) => {
							setErrors({ ...errors, title: undefined });
							setInput({ ...input, articleTitle: event.target.value });
						}}
						error={Boolean(errors.title)}
						helperText={errors.title}
						inputProps={{ maxLength: TITLE_MAX }}
					/>
					<TextField
						label={input.articleCategory === BoardArticleCategory.QNA ? t('Your question') : t('Text')}
						multiline
						minRows={10}
						value={input.articleContent}
						onChange={(event) => {
							setErrors({ ...errors, content: undefined });
							setInput({ ...input, articleContent: event.target.value });
						}}
						error={Boolean(errors.content)}
						helperText={errors.content ?? `${input.articleContent.trim().length} / ${CONTENT_MAX}`}
						inputProps={{ maxLength: CONTENT_MAX }}
					/>
					<TextField
						select
						label={t('Written in')}
						value={input.articleLang}
						onChange={(event) => setInput({ ...input, articleLang: event.target.value as Language })}
						helperText={t('Readers see the post in this language.')}
					>
						{LANGUAGES.map((lang) => (
							<MenuItem key={lang.code} value={lang.code}>
								{lang.label}
							</MenuItem>
						))}
					</TextField>
					<div className={'form-actions'}>
						<Button
							variant={'outlined'}
							LinkComponent={Link}
							href={articleId ? `/community/detail?id=${articleId}` : '/community'}
						>
							{t('Cancel')}
						</Button>
						<Button type={'submit'} variant={'contained'} disabled={creating || updating}>
							{articleId ? t('Save changes') : t('Publish')}
						</Button>
					</div>
				</Box>
				<aside className={'guidelines card'}>
					<h2>{t('Community guidelines')}</h2>
					<ul>
						{GUIDELINES.map((rule) => (
							<li key={rule}>
								<CheckRoundedIcon />
								{t(rule)}
							</li>
						))}
					</ul>
					<p className={'hint'}>{t('Five reports from readers hide a post until MedVia looks at it.')}</p>
					<h2>{t('Reviewing a treatment?')}</h2>
					<p className={'hint'}>
						{t('Reviews come from a completed MedVia booking and get the “Verified visit” badge.')}{' '}
						<Link href={'/mypage/reviews'}>{t('My Reviews')}</Link>
					</p>
				</aside>
			</Box>
		);
	}

	return (
		<Stack className={'write-page'}>
			<Stack className={'container'}>
				<nav className={'crumbs'} aria-label={t('Breadcrumb')}>
					<Link href={'/'}>{t('Home')}</Link>
					<span>/</span>
					<Link href={'/community'}>{t('Community')}</Link>
					<span>/</span>
					<span>{title}</span>
				</nav>
				<h1>{title}</h1>
				{body}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(WriteArticle);
