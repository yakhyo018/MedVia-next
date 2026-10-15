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
import { REASONS } from '../../../libs/components/community/ReportDialog';
import useUrlQuery from '../../../libs/hooks/useUrlQuery';
import { GET_REPORTS_BY_ADMIN } from '../../../apollo/admin/query';
import { MODERATE_CONTENT } from '../../../apollo/admin/mutation';
import { Report } from '../../../libs/types/admin/admin';
import { ModerationDecision, ReportGroup, ReportStatus } from '../../../libs/enums/board-article.enum';
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

const TABS: { key: string; label: string; status: ReportStatus }[] = [
	{ key: 'pending', label: 'Pending', status: ReportStatus.PENDING },
	{ key: 'resolved', label: 'Hidden after a report', status: ReportStatus.RESOLVED },
	{ key: 'dismissed', label: 'Dismissed', status: ReportStatus.DISMISSED },
];

/**
 * Every report — posts and comments — oldest first. One decision covers the target: hiding it or
 * dismissing closes all its pending reports.
 */
const AdminReports: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const [target, setTarget] = useState<{ report: Report; decision: ModerationDecision } | null>(null);
	const tab = TABS.find((item) => item.key === url.get('tab')) ?? TABS[0];
	const pending = tab.status === ReportStatus.PENDING;

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_REPORTS_BY_ADMIN, {
		variables: { input: { page: url.page, limit: LIMIT, reportStatus: tab.status } },
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const [moderateContent, { loading: saving }] = useMutation(MODERATE_CONTENT);
	const reports: Report[] = data?.getReportsByAdmin?.list ?? [];
	const total: number = data?.getReportsByAdmin?.metaCounter?.[0]?.total ?? 0;
	const pills: AdminPill[] = TABS.map((item) => ({
		key: item.key,
		label: t(item.label),
		count: item.key === tab.key && data ? total : undefined,
	}));
	const hiding = target?.decision === ModerationDecision.HIDE;

	/** HANDLERS **/
	const moderateHandler = async (note: string) => {
		if (!target) return;
		try {
			const { report, decision } = target;
			const { data: result } = await moderateContent({
				variables: {
					input: {
						reportGroup: report.reportGroup,
						refId: report.reportRefId,
						decision,
						...(note.trim() ? { note: note.trim() } : {}),
					},
				},
				refetchQueries: ['GetArticlesByAdmin'],
			});
			await refetch();
			setTarget(null);
			const closed: number = result?.moderateContent?.reportsClosed ?? 0;
			await sweetTopSmallSuccessAlert(t('{{count}} reports closed', { count: closed }));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return (
		<div id={'admin-reports'}>
			<AdminPills
				pills={pills}
				active={tab.key}
				onChange={(key) => url.set({ tab: key === 'pending' ? undefined : key })}
				label={t('Reports')}
			/>
			<div className={'admin-table-card'}>
				{loading && !data ? (
					<Skeleton variant={'rectangular'} height={360} />
				) : reports.length === 0 ? (
					<EmptyState title={pending ? t('No reports waiting.') : t('No reports here.')} />
				) : (
					<div className={'admin-table-scroll'}>
						<table className={'admin-table'}>
							<thead>
								<tr>
									<th>{t('Reported')}</th>
									<th>{t('Reason')}</th>
									<th>{t('When')}</th>
									<th>{t('Status')}</th>
									{pending && <th>{t('Actions')}</th>}
								</tr>
							</thead>
							<tbody>
								{reports.map((report) => {
									const post = report.reportGroup === ReportGroup.ARTICLE;
									return (
										<tr key={report._id}>
											<td className={'wide'}>
												<div className={'who'}>
													<div>
														<span className={`admin-badge ${post ? 'teal' : 'neutral'} inline`}>
															{post ? t('Post') : t('Comment')}
														</span>
														{post && report.targetStatus !== 'HIDDEN' ? (
															<a
																href={`/community/detail?id=${report.reportRefId}`}
																target={'_blank'}
																rel={'noreferrer'}
															>
																<strong>{report.targetText ?? '—'}</strong>
															</a>
														) : (
															<strong>{report.targetText ?? '—'}</strong>
														)}
													</div>
												</div>
											</td>
											<td>
												<strong className={'strong'}>{t(REASONS[report.reportReason] ?? report.reportReason)}</strong>
												{report.reportDetail && <div className={'admin-small'}>{report.reportDetail}</div>}
											</td>
											<td>{seoulTime(report.createdAt, router.locale)}</td>
											<td>
												<span className={`admin-badge ${report.targetStatus === 'HIDDEN' ? 'neutral' : 'success'}`}>
													{report.targetStatus === 'HIDDEN' ? t('Hidden') : t('Visible')}
												</span>
											</td>
											{pending && (
												<td>
													<div className={'actions'}>
														<Button
															variant={'outlined'}
															onClick={() => setTarget({ report, decision: ModerationDecision.SHOW })}
														>
															{t('Dismiss')}
														</Button>
														{report.targetStatus !== 'HIDDEN' && (
															<Button
																className={'admin-soft-btn'}
																onClick={() => setTarget({ report, decision: ModerationDecision.HIDE })}
															>
																{t('Hide')}
															</Button>
														)}
													</div>
												</td>
											)}
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
						shown={reports.length}
						onChange={(page) => url.set({ page })}
					/>
				)}
			</div>
			<PromptDialog
				open={Boolean(target)}
				title={
					hiding
						? target?.report.reportGroup === ReportGroup.ARTICLE
							? t('Hide this post?')
							: t('Hide this comment?')
						: t('Dismiss the reports?')
				}
				text={
					hiding
						? t('Readers stop seeing it; every pending report of it closes.')
						: t('It stays public; every pending report of it closes.')
				}
				label={t('Note for the audit log (optional)')}
				confirmText={hiding ? t('Hide') : t('Dismiss')}
				danger={hiding}
				busy={saving}
				onConfirm={moderateHandler}
				onClose={() => setTarget(null)}
			/>
		</div>
	);
};

export default withLayoutAdmin(AdminReports);
