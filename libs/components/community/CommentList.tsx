import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, MenuItem, Skeleton, TextField } from '@mui/material';
import AuthorBadge from './AuthorBadge';
import ReportDialog from './ReportDialog';
import { GET_ARTICLE, GET_COMMENTS } from '../../../apollo/user/query';
import { CREATE_COMMENT, REMOVE_COMMENT, UPDATE_COMMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { BoardArticle, Comment } from '../../types/board-article/board-article';
import { BoardArticleCategory, ReportGroup } from '../../enums/board-article.enum';
import { Language } from '../../enums/common.enum';
import { MemberType } from '../../enums/member.enum';
import { ClientMessages, LANGUAGES, LIST_MAX, localeToLanguage } from '../../config';
import {
	sweetDangerConfirmAlert,
	sweetLoginConfirmAlert,
	sweetMixinErrorAlert,
	sweetTopSmallSuccessAlert,
} from '../../sweetAlert';
import { initials, seoulClock, seoulDateKey, seoulTime } from '../../utils';

const PAGE_SIZE = 20;
const COMMENT_MAX = 2000;
/** Who may comment (the API's COMMENTERS): patients and doctors — not clinics, not the admin. */
const COMMENTERS: string[] = [MemberType.USER, MemberType.DOCTOR];

const langLabel = (code: Language) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code;

interface CommentListProps {
	article: BoardArticle;
}

/**
 * The comments under a post, oldest first, flat. A doctor's comment on a question is its answer
 * (the post gets "Doctor answered"). Authors edit and delete their own; others report.
 */
const CommentList = (props: CommentListProps) => {
	const { article } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const [text, setText] = useState<string>('');
	const [lang, setLang] = useState<Language | ''>('');
	const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
	const [reportId, setReportId] = useState<string>('');
	const canComment = COMMENTERS.includes(user.memberType);
	const question = article.articleCategory === BoardArticleCategory.QNA;
	const writeLang = (lang || user.memberLang || localeToLanguage(router.locale)) as Language;

	/** APOLLO REQUESTS **/
	const { data, previousData, loading, refetch } = useQuery(GET_COMMENTS, {
		variables: { input: { articleId: article._id, page: 1, limit } },
		fetchPolicy: 'cache-and-network',
	});
	const refetchArticle = { refetchQueries: [{ query: GET_ARTICLE, variables: { articleId: article._id } }] };
	const [createComment, { loading: posting }] = useMutation(CREATE_COMMENT, refetchArticle);
	const [updateComment, { loading: saving }] = useMutation(UPDATE_COMMENT);
	const [removeComment] = useMutation(REMOVE_COMMENT, refetchArticle);
	const comments: Comment[] = (data ?? previousData)?.getComments?.list ?? [];
	const total: number = (data ?? previousData)?.getComments?.metaCounter?.[0]?.total ?? 0;

	/** HANDLERS **/
	const loginHandler = async () => {
		const login = await sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED);
		if (login) await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
	};

	const postHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const body = text.trim();
		if (!body) return;
		try {
			await createComment({
				variables: { input: { articleId: article._id, commentContent: body, commentLang: writeLang } },
			});
			setText('');
			await refetch();
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const saveHandler = async () => {
		if (!editing || !editing.text.trim()) return;
		try {
			await updateComment({ variables: { input: { commentId: editing.id, commentContent: editing.text.trim() } } });
			setEditing(null);
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const removeHandler = async (comment: Comment) => {
		try {
			const sure = await sweetDangerConfirmAlert(t('Delete this comment?'), t('Delete'));
			if (!sure) return;
			await removeComment({ variables: { commentId: comment._id } });
			await refetch();
			await sweetTopSmallSuccessAlert(t('Comment deleted'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const when = (value: Date) =>
		seoulDateKey(value) === seoulDateKey(new Date()) ? seoulClock(value) : seoulTime(value, router.locale, false);

	let form: React.ReactNode;
	if (!user._id) {
		form = (
			<Box className={'comment-gate card'}>
				<span>{question ? t('Log in to answer or ask a follow-up.') : t('Log in to write a comment.')}</span>
				<Button variant={'contained'} onClick={loginHandler}>
					{t('Log in')}
				</Button>
			</Box>
		);
	} else if (!canComment) {
		form = (
			<p className={'comment-note'}>
				{user.memberType === MemberType.AGENT
					? t('Clinic accounts don’t comment in the community — that would be advertising. Your doctors can answer.')
					: t('Comments come from patients and doctors.')}
			</p>
		);
	} else {
		form = (
			<Box component={'form'} className={'comment-form card'} onSubmit={postHandler}>
				<label className={'label'} htmlFor={'comment-text'}>
					{user.memberType === MemberType.DOCTOR && question ? t('Your answer') : t('Write a comment')}
				</label>
				<TextField
					id={'comment-text'}
					multiline
					minRows={3}
					fullWidth
					value={text}
					placeholder={t('Share what you know — no prices of other clinics, no personal data.')}
					onChange={(event) => setText(event.target.value)}
					inputProps={{ maxLength: COMMENT_MAX }}
				/>
				{user.memberType === MemberType.DOCTOR && question && (
					<span className={'hint'}>
						{t('Public answers: no diagnosis, no price promises and no guaranteed results.')}
					</span>
				)}
				<div className={'comment-tools'}>
					<TextField
						select
						size={'small'}
						value={writeLang}
						onChange={(event) => setLang(event.target.value as Language)}
						inputProps={{ 'aria-label': t('Written in') }}
					>
						{LANGUAGES.map((item) => (
							<MenuItem key={item.code} value={item.code}>
								{item.label}
							</MenuItem>
						))}
					</TextField>
					<Button type={'submit'} variant={'contained'} disabled={posting || !text.trim()}>
						{user.memberType === MemberType.DOCTOR && question ? t('Post answer') : t('Post comment')}
					</Button>
				</div>
			</Box>
		);
	}

	return (
		<section className={'comments'} aria-label={t('Comments')}>
			<h2>
				{question ? t('Answers') : t('Comments')} ({article.articleComments})
			</h2>
			{loading && comments.length === 0 ? (
				<Skeleton variant={'rounded'} height={120} />
			) : comments.length === 0 ? (
				<p className={'comment-note'}>{question ? t('No answers yet.') : t('No comments yet.')}</p>
			) : (
				<div className={'comment-list'}>
					{comments.map((comment) => {
						const mine = comment.memberId === user._id;
						const doctor = comment.authorType === MemberType.DOCTOR;
						return (
							<article key={comment._id} className={`comment ${doctor ? 'doctor' : ''}`}>
								<span className={'avatar'}>{initials(comment.authorName)}</span>
								<div className={'body'}>
									<div className={'head'}>
										<strong>{comment.authorName}</strong>
										<AuthorBadge authorType={comment.authorType} />
										<time>{when(comment.createdAt)}</time>
									</div>
									{editing?.id === comment._id ? (
										<div className={'edit'}>
											<TextField
												multiline
												minRows={2}
												fullWidth
												value={editing.text}
												onChange={(event) => setEditing({ id: comment._id, text: event.target.value })}
												inputProps={{ maxLength: COMMENT_MAX, 'aria-label': t('Edit comment') }}
											/>
											<div className={'comment-tools'}>
												<Button variant={'text'} onClick={() => setEditing(null)}>
													{t('Cancel')}
												</Button>
												<Button variant={'contained'} disabled={saving} onClick={saveHandler}>
													{t('Save')}
												</Button>
											</div>
										</div>
									) : (
										<p>{comment.commentContent}</p>
									)}
									<div className={'meta'}>
										<span>{t('Written in {{lang}}', { lang: langLabel(comment.commentLang) })}</span>
										{mine ? (
											<>
												<button
													type={'button'}
													onClick={() => setEditing({ id: comment._id, text: comment.commentContent })}
												>
													{t('Edit')}
												</button>
												<button type={'button'} className={'danger'} onClick={() => removeHandler(comment)}>
													{t('Delete')}
												</button>
											</>
										) : (
											canComment && (
												<button type={'button'} className={'muted'} onClick={() => setReportId(comment._id)}>
													{t('Report')}
												</button>
											)
										)}
									</div>
								</div>
							</article>
						);
					})}
				</div>
			)}
			{comments.length < total && limit < LIST_MAX && (
				<Button
					variant={'outlined'}
					className={'more'}
					disabled={loading}
					onClick={() => setLimit(Math.min(limit + PAGE_SIZE, LIST_MAX))}
				>
					{t('Show more')}
				</Button>
			)}
			{form}
			<ReportDialog
				target={reportId ? { group: ReportGroup.COMMENT, id: reportId } : null}
				onClose={() => setReportId('')}
			/>
		</section>
	);
};

export default CommentList;
