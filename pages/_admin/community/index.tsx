import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Skeleton } from '@mui/material';
import withLayoutAdmin from '../../../libs/components/layout/LayoutAdmin';
import AdminPills, { AdminPill } from '../../../libs/components/admin/AdminPills';
import AdminPager from '../../../libs/components/admin/AdminPager';
import EmptyState from '../../../libs/components/common/EmptyState';
import PromptDialog from '../../../libs/components/common/PromptDialog';
import { BOARDS } from '../../../libs/components/community/boards';
import useUrlQuery from '../../../libs/hooks/useUrlQuery';
import { GET_ARTICLES_BY_ADMIN } from '../../../apollo/admin/query';
import { MODERATE_CONTENT } from '../../../apollo/admin/mutation';
import { BoardArticle } from '../../../libs/types/board-article/board-article';
import { AdminArticlesInquiry } from '../../../libs/types/admin/admin';
import {
	BoardArticleCategory,
	BoardArticleStatus,
	ModerationDecision,
	ReportGroup,
} from '../../../libs/enums/board-article.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { seoulTime } from '../../../libs/utils';
import { T } from '../../../libs/types/common';
import { ADMIN_I18N, ADMIN_NS } from '../../../libs/components/admin/adminText';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 10;

/** The boards that hold posts (treatment reviews are verified reviews, moderated on Reviews). */
const TABS: { key: string; label: string; input: Partial<AdminArticlesInquiry> }[] = [
	{ key: 'all', label: 'All boards', input: {} },
	...BOARDS.filter((board) => board.category).map((board) => ({
		key: board.key,
		label: board.label,
		input: { articleCategory: board.category },
	})),
	{ key: 'reported', label: 'Reported', input: { reported: true } },
	{ key: 'hidden', label: 'Hidden', input: { articleStatus: BoardArticleStatus.HIDDEN } },
];

const boardLabel = (category: BoardArticleCategory) =>
	BOARDS.find((board) => board.category === category)?.label ?? category;

/** Community posts: hide one (its pending reports close with the decision) or show it again. */
const AdminCommunity: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const [target, setTarget] = useState<{ article: BoardArticle; decision: ModerationDecision } | null>(null);
	const tab = TABS.find((item) => item.key === url.get('tab')) ?? TABS[0];

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_ARTICLES_BY_ADMIN, {
		variables: { input: { page: url.page, limit: LIMIT, ...tab.input } },
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const { data: reportedData, refetch: refetchReported } = useQuery(GET_ARTICLES_BY_ADMIN, {
		variables: { input: { page: 1, limit: 1, reported: true } },
		fetchPolicy: 'cache-and-network',
	});
	const [moderateContent, { loading: saving }] = useMutation(MODERATE_CONTENT);
	const articles: BoardArticle[] = data?.getArticlesByAdmin?.list ?? [];
	const total: number = data?.getArticlesByAdmin?.metaCounter?.[0]?.total ?? 0;
	const pills: AdminPill[] = TABS.map((item) => ({
		key: item.key,
		label: t(item.label),
		count: item.key === 'reported' ? reportedData?.getArticlesByAdmin?.metaCounter?.[0]?.total : undefined,
	}));
	const hiding = target?.decision === ModerationDecision.HIDE;
	// SHOW on a visible post keeps it and dismisses its reports.
	const dismissing = !hiding && target?.article.articleStatus !== BoardArticleStatus.HIDDEN;

	/** HANDLERS **/
	const moderateHandler = async (note: string) => {
		if (!target) return;
		try {
			const { decision } = target;
			const { data: result } = await moderateContent({
				variables: {
					input: {
						reportGroup: ReportGroup.ARTICLE,
						refId: target.article._id,
						decision,
						...(note.trim() ? { note: note.trim() } : {}),
					},
				},
			});
			await Promise.all([refetch(), refetchReported()]);
			setTarget(null);
			const closed: number = result?.moderateContent?.reportsClosed ?? 0;
			await sweetTopSmallSuccessAlert(
				`${hiding ? t('Post hidden') : dismissing ? t('Reports dismissed') : t('Post shown again')}${closed ? ` · ${t('{{count}} reports closed', { count: closed })}` : ''}`,
			);
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return (
		<div id={'admin-community'}>
			<AdminPills
				pills={pills}
				active={tab.key}
				onChange={(key) => url.set({ tab: key === 'all' ? undefined : key })}
				label={t('Community')}
			/>
			<div className={'admin-table-card'}>
				{loading && !data ? (
					<Skeleton variant={'rectangular'} height={420} />
				) : articles.length === 0 ? (
					<EmptyState title={t('No posts here.')} />
				) : (
					<div className={'admin-table-scroll'}>
						<table className={'admin-table'}>
							<thead>
								<tr>
									<th>{t('Post')}</th>
									<th>{t('Board')}</th>
									<th>{t('Author')}</th>
									<th>{t('Reports')}</th>
									<th>{t('Comments')}</th>
									<th>{t('Status')}</th>
									<th>{t('Actions')}</th>
								</tr>
							</thead>
							<tbody>
								{articles.map((article) => {
									const hidden = article.articleStatus === BoardArticleStatus.HIDDEN;
									return (
										<tr key={article._id}>
											<td className={'wide'}>
												<div className={'who'}>
													<div>
														<strong>{article.articleTitle}</strong>
														<span>{seoulTime(article.createdAt, router.locale, false)}</span>
													</div>
												</div>
											</td>
											<td>
												<span className={'admin-badge teal'}>{t(boardLabel(article.articleCategory))}</span>
											</td>
											<td>
												{article.memberId ? (
													<a href={`/_admin/users/detail?id=${article.memberId}`}>{article.authorName ?? '—'}</a>
												) : (
													(article.authorName ?? '—')
												)}
											</td>
											<td>
												{article.articleReports ? (
													<span className={'admin-badge danger'}>
														{t('{{count}} reports', { count: article.articleReports })}
													</span>
												) : (
													'—'
												)}
											</td>
											<td>{article.articleComments}</td>
											<td>
												<span className={`admin-badge ${hidden ? 'neutral' : 'success'}`}>
													{hidden ? t('Hidden') : t('Visible')}
												</span>
											</td>
											<td>
												<div className={'actions'}>
													{!hidden && (
														<Button variant={'outlined'} href={`/community/detail?id=${article._id}`} target={'_blank'}>
															{t('View')}
														</Button>
													)}
													{!hidden && Boolean(article.articleReports) && (
														<Button
															variant={'outlined'}
															onClick={() => setTarget({ article, decision: ModerationDecision.SHOW })}
														>
															{t('Dismiss')}
														</Button>
													)}
													<Button
														className={'admin-soft-btn'}
														onClick={() =>
															setTarget({
																article,
																decision: hidden ? ModerationDecision.SHOW : ModerationDecision.HIDE,
															})
														}
													>
														{hidden ? t('Show') : t('Hide')}
													</Button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
				{total > 0 && (
					<AdminPager
						page={url.page}
						limit={LIMIT}
						total={total}
						shown={articles.length}
						onChange={(page) => url.set({ page })}
					/>
				)}
			</div>
			<PromptDialog
				open={Boolean(target)}
				title={
					hiding
						? t('Hide “{{title}}”?', { title: target?.article.articleTitle })
						: dismissing
							? t('Dismiss the reports of “{{title}}”?', { title: target?.article.articleTitle })
							: t('Show “{{title}}” again?', { title: target?.article.articleTitle })
				}
				text={
					hiding
						? t('Readers stop seeing the post; its pending reports close.')
						: dismissing
							? t('The post stays public; its pending reports close.')
							: t('The post is public again; its pending reports close.')
				}
				label={t('Note for the audit log (optional)')}
				confirmText={hiding ? t('Hide') : dismissing ? t('Dismiss') : t('Show')}
				danger={hiding}
				busy={saving}
				onConfirm={moderateHandler}
				onClose={() => setTarget(null)}
			/>
		</div>
	);
};

export default withLayoutAdmin(AdminCommunity);
