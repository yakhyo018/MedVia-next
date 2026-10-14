import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Pagination, Skeleton, Stack, TextField } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import DoctorFrame from '../../libs/components/doctor-panel/DoctorFrame';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_BOARD_ARTICLES } from '../../apollo/user/query';
import { CREATE_COMMENT } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { BoardArticle } from '../../libs/types/board-article/board-article';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';
import { Language } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { LANGUAGES } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 10;
const ANSWER_MAX = 2000;
const langLabel = (code: Language) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code;

interface QuestionProps {
	article: BoardArticle;
	onAnswered: () => void;
}

/** A question with a box for the doctor's answer; posting it gives the question "Doctor answered". */
const Question = (props: QuestionProps) => {
	const { article, onAnswered } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [open, setOpen] = useState<boolean>(false);
	const [text, setText] = useState<string>('');
	const [createComment, { loading }] = useMutation(CREATE_COMMENT);

	const answerHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!text.trim()) return;
		try {
			// The doctor answers in the patient's language when they can; Korean otherwise.
			await createComment({
				variables: {
					input: {
						articleId: article._id,
						commentContent: text.trim(),
						commentLang: (user.memberLang || Language.KO) as Language,
					},
				},
			});
			setText('');
			setOpen(false);
			await sweetTopSmallSuccessAlert(t('Answer posted'));
			onAnswered();
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return (
		<Box component={'article'} className={'qna-item card'}>
			<span className={`state ${article.articleAnswered ? 'answered' : 'waiting'}`}>
				{article.articleAnswered ? t('Doctor answered') : t('Waiting for a doctor')}
			</span>
			<Link href={`/community/detail?id=${article._id}`} className={'title'}>
				{article.articleTitle}
			</Link>
			<span className={'meta'}>
				{article.authorName} · {seoulTime(article.createdAt, router.locale, false)} ·{' '}
				{t('{{count}} answers', { count: article.articleComments })} ·{' '}
				{t('Written in {{lang}}', { lang: langLabel(article.articleLang) })}
			</span>
			{article.articleContent && <p className={'excerpt'}>{article.articleContent}</p>}
			{open ? (
				<form className={'answer'} onSubmit={answerHandler}>
					<TextField
						multiline
						minRows={4}
						fullWidth
						autoFocus
						value={text}
						label={t('Your answer')}
						onChange={(event) => setText(event.target.value)}
						inputProps={{ maxLength: ANSWER_MAX }}
					/>
					<span className={'hint'}>
						{t(
							'Public answers: no diagnosis, no price promises and no guaranteed results. For personal advice, suggest a consultation at the clinic.',
						)}
					</span>
					<div className={'comment-tools'}>
						<Button variant={'text'} onClick={() => setOpen(false)}>
							{t('Cancel')}
						</Button>
						<Button type={'submit'} variant={'contained'} disabled={loading || !text.trim()}>
							{t('Post answer')}
						</Button>
					</div>
				</form>
			) : (
				<div className={'comment-tools'}>
					<Button variant={'outlined'} LinkComponent={Link} href={`/community/detail?id=${article._id}`}>
						{t('Open the thread')}
					</Button>
					<Button variant={'contained'} onClick={() => setOpen(true)}>
						{t('Answer')}
					</Button>
				</div>
			)}
		</Box>
	);
};

/** "Q&A Answers": patients' questions waiting for a doctor, and the ones already answered. */
const DoctorQna: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [answered, setAnswered] = useState<boolean>(false);
	const [page, setPage] = useState<number>(1);
	const isDoctor = user.memberType === MemberType.DOCTOR;
	const search = (value: boolean) => ({ articleCategory: BoardArticleCategory.QNA, answered: value });

	const { data, previousData, loading, refetch } = useQuery(GET_BOARD_ARTICLES, {
		variables: { input: { page, limit: PAGE_SIZE, search: search(answered) } },
		fetchPolicy: 'cache-and-network',
		skip: !isDoctor,
	});
	const counts = {
		waiting: useQuery(GET_BOARD_ARTICLES, {
			variables: { input: { page: 1, limit: 1, search: search(false) } },
			fetchPolicy: 'cache-and-network',
			skip: !isDoctor,
		}),
		answered: useQuery(GET_BOARD_ARTICLES, {
			variables: { input: { page: 1, limit: 1, search: search(true) } },
			fetchPolicy: 'cache-and-network',
			skip: !isDoctor,
		}),
	};
	const list: BoardArticle[] = (data ?? previousData)?.getArticles?.list ?? [];
	const total: number = (data ?? previousData)?.getArticles?.metaCounter?.[0]?.total ?? 0;
	const countOf = (key: 'waiting' | 'answered') => counts[key].data?.getArticles?.metaCounter?.[0]?.total ?? 0;

	const answeredHandler = async () => {
		await Promise.all([refetch(), counts.waiting.refetch(), counts.answered.refetch()]);
	};

	return (
		<DoctorFrame
			title={t('Q&A Answers')}
			text={t('Patients’ questions in the community. Your answer shows a doctor badge.')}
			className={'doctor-qna'}
		>
			<div className={'booking-tabs'} role={'tablist'} aria-label={t('Q&A Answers')}>
				{[
					{ key: false, label: 'Waiting', n: countOf('waiting') },
					{ key: true, label: 'Answered', n: countOf('answered') },
				].map((item) => (
					<button
						key={item.label}
						type={'button'}
						role={'tab'}
						aria-selected={answered === item.key}
						onClick={() => {
							setAnswered(item.key);
							setPage(1);
						}}
					>
						{t(item.label)} ({item.n})
					</button>
				))}
			</div>
			{loading && list.length === 0 ? (
				<Skeleton variant={'rounded'} height={240} />
			) : list.length === 0 ? (
				<EmptyState title={answered ? t('No answered questions yet') : t('No questions are waiting')} />
			) : (
				<Stack className={'qna-list'}>
					{list.map((article) => (
						<Question key={article._id} article={article} onAnswered={answeredHandler} />
					))}
				</Stack>
			)}
			{total > PAGE_SIZE && (
				<Pagination
					className={'community-pagination'}
					count={Math.ceil(total / PAGE_SIZE)}
					page={page}
					onChange={(_, value) => setPage(value)}
					shape={'rounded'}
				/>
			)}
		</DoctorFrame>
	);
};

export default withLayoutBasic(DoctorQna);
