import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { MenuItem, Skeleton, TextField } from '@mui/material';
import withLayoutAdmin from '../../libs/components/layout/LayoutAdmin';
import AdminPills, { AdminPill } from '../../libs/components/admin/AdminPills';
import AdminPager from '../../libs/components/admin/AdminPager';
import EmptyState from '../../libs/components/common/EmptyState';
import {
	ADMIN_I18N,
	ADMIN_NS,
	AUDIT_ACTIONS,
	AUDIT_GROUPS,
	auditTargetHref,
} from '../../libs/components/admin/adminText';
import useUrlQuery from '../../libs/hooks/useUrlQuery';
import { GET_AUDIT_FEED } from '../../apollo/admin/query';
import { AuditLog } from '../../libs/types/admin/admin';
import { AuditAction, AuditGroup } from '../../libs/enums/admin.enum';
import { seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 20;

const GROUPS = Object.values(AuditGroup);

/** The decision's prefix in AuditAction ("CLINIC_APPROVE" belongs to CLINIC). */
const actionsOf = (group?: AuditGroup): AuditAction[] =>
	Object.values(AuditAction).filter((action) => !group || action.startsWith(`${group}_`));

/** A Seoul calendar day (YYYY-MM-DD) as the UTC instants of its start and end. */
const seoulDayStart = (day: string) => new Date(`${day}T00:00:00+09:00`);
const seoulDayEnd = (day: string) => new Date(`${day}T23:59:59.999+09:00`);

/**
 * Every admin decision, newest first: who, what, when and the note. The filters live in the URL
 * (`?group=&action=&from=&to=`).
 */
const AdminAudit: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const group = GROUPS.find((item) => item === url.get('group'));
	const action = actionsOf(group).find((item) => item === url.get('action'));
	const from = /^\d{4}-\d{2}-\d{2}$/.test(url.get('from')) ? url.get('from') : '';
	const to = /^\d{4}-\d{2}-\d{2}$/.test(url.get('to')) ? url.get('to') : '';

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_AUDIT_FEED, {
		variables: {
			input: {
				page: url.page,
				limit: LIMIT,
				...(group ? { auditGroup: group } : {}),
				...(action ? { auditAction: action } : {}),
				...(from ? { from: seoulDayStart(from) } : {}),
				...(to ? { to: seoulDayEnd(to) } : {}),
			},
		},
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const logs: AuditLog[] = data?.getAuditFeedByAdmin?.list ?? [];
	const total: number = data?.getAuditFeedByAdmin?.metaCounter?.[0]?.total ?? 0;
	const pills: AdminPill[] = [
		{ key: 'all', label: t('All') },
		...GROUPS.map((item) => ({ key: item, label: t(AUDIT_GROUPS[item]) })),
	];

	return (
		<div id={'admin-audit'}>
			<AdminPills
				pills={pills}
				active={group ?? 'all'}
				onChange={(key) => url.set({ group: key === 'all' ? undefined : key, action: undefined })}
				label={t('Audit log')}
			/>
			<div className={'admin-filters'}>
				<TextField
					select
					size={'small'}
					label={t('Decision')}
					value={action ?? ''}
					onChange={(event) => url.set({ action: event.target.value || undefined })}
				>
					<MenuItem value={''}>{t('All decisions')}</MenuItem>
					{actionsOf(group).map((item) => (
						<MenuItem key={item} value={item}>
							{t(AUDIT_ACTIONS[item].label)}
						</MenuItem>
					))}
				</TextField>
				<TextField
					type={'date'}
					size={'small'}
					label={t('From')}
					value={from}
					InputLabelProps={{ shrink: true }}
					onChange={(event) => url.set({ from: event.target.value })}
				/>
				<TextField
					type={'date'}
					size={'small'}
					label={t('To')}
					value={to}
					InputLabelProps={{ shrink: true }}
					onChange={(event) => url.set({ to: event.target.value })}
				/>
				<span className={'admin-muted small'}>{t('Seoul time')}</span>
			</div>
			<div className={'admin-table-card'}>
				{loading && !data ? (
					<Skeleton variant={'rectangular'} height={420} />
				) : logs.length === 0 ? (
					<EmptyState title={t('No decisions match these filters.')} />
				) : (
					<div className={'admin-table-scroll'}>
						<table className={'admin-table'}>
							<thead>
								<tr>
									<th>{t('When')}</th>
									<th>{t('Decision')}</th>
									<th>{t('Note')}</th>
									<th>{t('Admin')}</th>
									<th>{t('Target')}</th>
								</tr>
							</thead>
							<tbody>
								{logs.map((log) => {
									const meta = AUDIT_ACTIONS[log.auditAction];
									const href = auditTargetHref(log.auditGroup, log.auditRefId);
									return (
										<tr key={log._id}>
											<td>{seoulTime(log.createdAt, router.locale)}</td>
											<td>
												<span className={`admin-badge ${meta?.tone ?? 'neutral'}`}>
													{t(meta?.label ?? log.auditAction)}
												</span>
											</td>
											<td className={'wide'}>{log.auditNote || '—'}</td>
											<td>{log.adminName ?? '—'}</td>
											<td>
												{href ? (
													<a href={href} target={href.startsWith('/_admin') ? undefined : '_blank'} rel={'noreferrer'}>
														{t(AUDIT_GROUPS[log.auditGroup])}
													</a>
												) : (
													t(AUDIT_GROUPS[log.auditGroup])
												)}
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
						shown={logs.length}
						onChange={(page) => url.set({ page })}
					/>
				)}
			</div>
		</div>
	);
};

export default withLayoutAdmin(AdminAudit);
