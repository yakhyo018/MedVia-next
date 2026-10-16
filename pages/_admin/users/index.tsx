import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Skeleton } from '@mui/material';
import withLayoutAdmin from '../../../libs/components/layout/LayoutAdmin';
import AdminPills, { AdminPill } from '../../../libs/components/admin/AdminPills';
import AdminPager from '../../../libs/components/admin/AdminPager';
import StatusChip from '../../../libs/components/common/StatusChip';
import EmptyState from '../../../libs/components/common/EmptyState';
import { ADMIN_I18N, ADMIN_NS, languageName, MEMBER_TYPES } from '../../../libs/components/admin/adminText';
import useUrlQuery from '../../../libs/hooks/useUrlQuery';
import { COUNT_MEMBERS, GET_ALL_MEMBERS } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { userVar } from '../../../apollo/store';
import { Member } from '../../../libs/types/member/member';
import { MembersInquiry, MembersSearch } from '../../../libs/types/admin/admin';
import { MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { Direction } from '../../../libs/enums/common.enum';
import { REACT_APP_API_URL } from '../../../libs/config';
import {
	sweetConfirmAlert,
	sweetDangerConfirmAlert,
	sweetMixinErrorAlert,
	sweetTopSmallSuccessAlert,
} from '../../../libs/sweetAlert';
import { imageUrl, initials, seoulTime } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 10;

const DEFAULT_INPUT: MembersInquiry = { page: 1, limit: LIMIT, sort: 'createdAt', direction: Direction.DESC };

/** The pills: each is a search of `getAllMembersByAdmin`; the counts come in one request. */
const TABS: { key: string; label: string; search: MembersSearch }[] = [
	{ key: 'all', label: 'All', search: {} },
	{ key: 'patients', label: 'Patients', search: { memberType: MemberType.USER } },
	{ key: 'clinics', label: 'Clinics', search: { memberType: MemberType.AGENT } },
	{ key: 'doctors', label: 'Doctors', search: { memberType: MemberType.DOCTOR } },
	{ key: 'admins', label: 'Admins', search: { memberType: MemberType.ADMIN } },
	{ key: 'blocked', label: 'Blocked', search: { memberStatus: MemberStatus.BLOCK } },
];

const COUNT_INPUT = Object.fromEntries(TABS.map((tab) => [tab.key, { page: 1, limit: 1, search: tab.search }]));

/** Every account — patients, clinics, doctors, admins — with block / unblock. */
const AdminUsers: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const me = useReactiveVar(userVar);
	const url = useUrlQuery();
	const [busyId, setBusyId] = useState<string>('');
	const tab = TABS.find((item) => item.key === url.get('tab')) ?? TABS[0];
	const text = url.get('text');
	const input: MembersInquiry = {
		...DEFAULT_INPUT,
		page: url.page,
		search: { ...tab.search, ...(text ? { text } : {}) },
	};

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_ALL_MEMBERS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const { data: countData, refetch: refetchCounts } = useQuery(COUNT_MEMBERS, {
		variables: COUNT_INPUT,
		fetchPolicy: 'cache-and-network',
	});
	const [updateMemberByAdmin] = useMutation(UPDATE_MEMBER_BY_ADMIN);
	const members: Member[] = data?.getAllMembersByAdmin?.list ?? [];
	const total: number = data?.getAllMembersByAdmin?.metaCounter?.[0]?.total ?? 0;
	const pills: AdminPill[] = TABS.map((item) => ({
		key: item.key,
		label: t(item.label),
		count: countData?.[item.key]?.metaCounter?.[0]?.total ?? 0,
	}));

	/** HANDLERS **/
	const statusHandler = async (member: Member, memberStatus: MemberStatus) => {
		const blocking = memberStatus === MemberStatus.BLOCK;
		const sure = blocking
			? await sweetDangerConfirmAlert(
					t('Block {{name}}? They are logged out everywhere and cannot sign in.', { name: member.memberFullName }),
					t('Block'),
				)
			: await sweetConfirmAlert(t('Unblock {{name}}?', { name: member.memberFullName }), t('Unblock'));
		if (!sure) return;
		try {
			setBusyId(member._id);
			await updateMemberByAdmin({ variables: { input: { _id: member._id, memberStatus } } });
			await Promise.all([refetch(), refetchCounts()]);
			await sweetTopSmallSuccessAlert(blocking ? t('User blocked') : t('User unblocked'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setBusyId('');
		}
	};

	return (
		<div id={'admin-users'}>
			<AdminPills
				pills={pills}
				active={tab.key}
				onChange={(key) => url.set({ tab: key === 'all' ? undefined : key })}
				label={t('Users')}
			/>
			<div className={'admin-table-card'}>
				{loading && !data ? (
					<Skeleton variant={'rectangular'} height={420} />
				) : members.length === 0 ? (
					<EmptyState title={text ? t('No users match "{{text}}".', { text }) : t('No users here.')} />
				) : (
					<div className={'admin-table-scroll'}>
						<table className={'admin-table'}>
							<thead>
								<tr>
									<th>{t('User')}</th>
									<th>{t('Type')}</th>
									<th>{t('Country')}</th>
									<th>{t('Language')}</th>
									<th>{t('Joined')}</th>
									<th>{t('Status')}</th>
									<th>{t('Actions')}</th>
								</tr>
							</thead>
							<tbody>
								{members.map((member) => {
									const type = MEMBER_TYPES[member.memberType];
									const blocked = member.memberStatus === MemberStatus.BLOCK;
									const canBlock = member.memberType !== MemberType.ADMIN && member._id !== me._id;
									return (
										<tr key={member._id}>
											<td>
												<div className={'who'}>
													<span className={'avatar'}>
														{member.memberImage ? (
															<img src={imageUrl(member.memberImage, REACT_APP_API_URL)} alt={''} />
														) : (
															initials(member.memberFullName)
														)}
													</span>
													<div>
														<strong>{member.memberFullName}</strong>
														<span>{member.memberEmail}</span>
													</div>
												</div>
											</td>
											<td>
												<span className={`admin-badge ${type.tone}`}>{t(type.label)}</span>
											</td>
											<td>{member.memberCountry || '—'}</td>
											<td>{languageName(member.memberLang)}</td>
											<td>{seoulTime(member.createdAt, router.locale, false)}</td>
											<td>
												<StatusChip status={member.memberStatus} size={'small'} />
											</td>
											<td>
												<div className={'actions'}>
													<Button
														variant={'outlined'}
														onClick={() => router.push(`/_admin/users/detail?id=${member._id}`)}
													>
														{t('View')}
													</Button>
													{canBlock && member.memberStatus !== MemberStatus.DELETE && (
														<Button
															className={'admin-soft-btn'}
															disabled={busyId === member._id}
															onClick={() => statusHandler(member, blocked ? MemberStatus.ACTIVE : MemberStatus.BLOCK)}
														>
															{blocked ? t('Unblock') : t('Block')}
														</Button>
													)}
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
						shown={members.length}
						onChange={(page) => url.set({ page })}
					/>
				)}
			</div>
		</div>
	);
};

export default withLayoutAdmin(AdminUsers);
