import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Skeleton } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import withLayoutAdmin from '../../../libs/components/layout/LayoutAdmin';
import StatusChip from '../../../libs/components/common/StatusChip';
import EmptyState from '../../../libs/components/common/EmptyState';
import { ADMIN_I18N, ADMIN_NS, languageName, MEMBER_TYPES } from '../../../libs/components/admin/adminText';
import { GET_ACCESS_LOGS, GET_ADMIN_BOOKINGS, GET_MEMBER_DETAIL } from '../../../apollo/admin/query';
import { UPDATE_MEMBER_BY_ADMIN } from '../../../apollo/admin/mutation';
import { userVar } from '../../../apollo/store';
import { MemberDetail } from '../../../libs/types/admin/admin';
import { AccessLog } from '../../../libs/types/access-log/access-log';
import { MemberAuthType, MemberStatus, MemberType } from '../../../libs/enums/member.enum';
import { AccessType } from '../../../libs/enums/access-log.enum';
import { REACT_APP_API_URL } from '../../../libs/config';
import {
	sweetConfirmAlert,
	sweetDangerConfirmAlert,
	sweetMixinErrorAlert,
	sweetTopSmallSuccessAlert,
} from '../../../libs/sweetAlert';
import { imageUrl, initials, isObjectId, seoulTime } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

/**
 * One account: who it is, what the member did, the latest bookings — never the medical data.
 * The admin sees only the log of who opened it.
 */
const AdminUserDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const me = useReactiveVar(userVar);
	const [showLog, setShowLog] = useState<boolean>(false);
	const memberId = typeof router.query.id === 'string' && isObjectId(router.query.id) ? router.query.id : '';
	const locale = router.locale ?? 'en';

	/** APOLLO REQUESTS **/
	const { data, loading, error, refetch } = useQuery(GET_MEMBER_DETAIL, {
		variables: { memberId },
		fetchPolicy: 'cache-and-network',
		skip: !memberId,
	});
	const detail: MemberDetail | undefined = data?.getMemberDetailByAdmin;
	const member = detail?.member;
	const isPatient = member?.memberType === MemberType.USER;
	const { data: bookingsData } = useQuery(GET_ADMIN_BOOKINGS, {
		variables: { input: { page: 1, limit: 1, memberId } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const { data: logData, loading: logLoading } = useQuery(GET_ACCESS_LOGS, {
		variables: { input: { page: 1, limit: 20, patientId: memberId } },
		fetchPolicy: 'cache-and-network',
		skip: !showLog || !isPatient,
	});
	const [updateMemberByAdmin, { loading: saving }] = useMutation(UPDATE_MEMBER_BY_ADMIN);
	const bookingsTotal: number | undefined = bookingsData?.getBookings?.metaCounter?.[0]?.total;
	const logs: AccessLog[] = logData?.getAccessLogsByAdmin?.list ?? [];

	/** HANDLERS **/
	const statusHandler = async () => {
		if (!member) return;
		const blocking = member.memberStatus !== MemberStatus.BLOCK;
		const sure = blocking
			? await sweetDangerConfirmAlert(
					t('Block {{name}}? They are logged out everywhere and cannot sign in.', { name: member.memberFullName }),
					t('Block'),
				)
			: await sweetConfirmAlert(t('Unblock {{name}}?', { name: member.memberFullName }), t('Unblock'));
		if (!sure) return;
		try {
			const memberStatus = blocking ? MemberStatus.BLOCK : MemberStatus.ACTIVE;
			await updateMemberByAdmin({ variables: { input: { _id: member._id, memberStatus } } });
			await refetch();
			await sweetTopSmallSuccessAlert(blocking ? t('User blocked') : t('User unblocked'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const back = (
		<Link href={'/_admin/users'} className={'admin-back'}>
			<ChevronLeftRoundedIcon />
			{t('All users')}
		</Link>
	);

	if (!memberId || error) {
		return (
			<div id={'admin-user-detail'}>
				{back}
				<EmptyState title={t('User not found')} />
			</div>
		);
	}
	if (!member) {
		return (
			<div id={'admin-user-detail'}>
				{back}
				<Skeleton variant={'rounded'} height={loading ? 420 : 120} />
			</div>
		);
	}

	const type = MEMBER_TYPES[member.memberType];
	const canBlock =
		member.memberType !== MemberType.ADMIN && member._id !== me._id && member.memberStatus !== MemberStatus.DELETE;
	const rows: [string, string][] = [
		[t('Email'), member.memberEmail],
		[t('Signed in with'), member.memberAuthType === MemberAuthType.GOOGLE ? 'Google' : t('Email and password')],
		[t('Phone'), member.memberPhone || '—'],
		[t('Country'), member.memberCountry || '—'],
		[t('Preferred language'), languageName(member.memberLang)],
		[t('Joined'), seoulTime(member.createdAt, locale, false)],
	];
	const activity: [number | undefined, string][] = [
		...(isPatient
			? ([
					[bookingsTotal, t('Bookings')],
					[detail.completedVisits, t('Completed')],
					[detail.noShows, t('No-shows')],
				] as [number | undefined, string][])
			: []),
		[detail.posts, t('Posts')],
		[detail.reportsAgainst, t('Reports against')],
	];

	return (
		<div id={'admin-user-detail'}>
			{back}
			<section className={'admin-card admin-profile-head'}>
				<span className={'avatar'}>
					{member.memberImage ? (
						<img src={imageUrl(member.memberImage, REACT_APP_API_URL)} alt={''} />
					) : (
						initials(member.memberFullName)
					)}
				</span>
				<div className={'text'}>
					<div className={'name'}>
						<h1>{member.memberFullName}</h1>
						<span className={`admin-badge ${type.tone}`}>{t(type.label)}</span>
						<StatusChip status={member.memberStatus} size={'small'} />
					</div>
					<p>
						{[
							member.memberCountry,
							languageName(member.memberLang),
							t('joined {{date}}', { date: seoulTime(member.createdAt, locale, false) }),
							member.memberLastLoginAt
								? t('last login {{date}}', { date: seoulTime(member.memberLastLoginAt, locale) })
								: null,
						]
							.filter(Boolean)
							.join(' · ')}
					</p>
				</div>
				{canBlock && (
					<Button className={'admin-soft-btn'} disabled={saving} onClick={statusHandler}>
						{member.memberStatus === MemberStatus.BLOCK ? t('Unblock user') : t('Block user')}
					</Button>
				)}
			</section>

			<div className={'admin-grid halves'}>
				<section className={'admin-card'}>
					<h2>{t('Account')}</h2>
					<dl className={'admin-facts'}>
						{rows.map(([label, value]) => (
							<div key={label}>
								<dt>{label}</dt>
								<dd>{value}</dd>
							</div>
						))}
					</dl>
				</section>
				<section className={'admin-card'}>
					<h2>{t('Activity')}</h2>
					<div className={'admin-tiles'}>
						{activity.map(([value, label]) => (
							<div key={label}>
								<strong>{value ?? '—'}</strong>
								<span>{label}</span>
							</div>
						))}
					</div>
				</section>
			</div>

			{isPatient && (
				<section className={'admin-card'}>
					<h2>{t('Bookings')}</h2>
					{detail.recentBookings.length === 0 ? (
						<p className={'admin-muted'}>{t('No bookings yet.')}</p>
					) : (
						<div className={'admin-table-card inner'}>
							<div className={'admin-table-scroll'}>
								<table className={'admin-table'}>
									<thead>
										<tr>
											<th>{t('Booking')}</th>
											<th>{t('Clinic')}</th>
											<th>{t('Treatment')}</th>
											<th>{t('Date & time')}</th>
											<th>{t('Status')}</th>
										</tr>
									</thead>
									<tbody>
										{detail.recentBookings.map((booking) => (
											<tr key={booking._id}>
												<td className={'strong'}>{booking.bookingCode}</td>
												<td>{booking.clinicName ?? '—'}</td>
												<td>{booking.treatmentName ?? '—'}</td>
												<td>{seoulTime(booking.bookingDate, locale)}</td>
												<td>
													<StatusChip status={booking.bookingStatus} size={'small'} />
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</section>
			)}

			{isPatient && (
				<section className={'admin-card'}>
					<h2>{t('Medical data')}</h2>
					<div className={'admin-locked'}>
						<span className={'icon'}>
							<LockOutlinedIcon />
						</span>
						<div className={'text'}>
							<strong>{t('Hidden from admins')}</strong>
							<span>
								{t(
									'Only the patient and the clinic of a booking they consented to can open the answers and the AI summary. Every access is logged.',
								)}
							</span>
						</div>
						<Button variant={'outlined'} onClick={() => setShowLog(!showLog)}>
							{showLog ? t('Hide access log') : t('View access log')}
						</Button>
					</div>
					{showLog &&
						(logLoading && !logData ? (
							<Skeleton variant={'rounded'} height={120} />
						) : logs.length === 0 ? (
							<p className={'admin-muted'}>{t('Nobody has opened this patient’s data.')}</p>
						) : (
							<div className={'admin-table-card inner'}>
								<div className={'admin-table-scroll'}>
									<table className={'admin-table'}>
										<thead>
											<tr>
												<th>{t('When')}</th>
												<th>{t('Who')}</th>
												<th>{t('What')}</th>
												<th>{t('Booking')}</th>
											</tr>
										</thead>
										<tbody>
											{logs.map((log) => (
												<tr key={log._id}>
													<td>{seoulTime(log.createdAt, locale)}</td>
													<td className={'strong'}>
														{log.readerName ?? '—'} · {t(MEMBER_TYPES[log.readerType]?.label ?? log.readerType)}
													</td>
													<td>
														{log.accessType === AccessType.AI_SUMMARY ? t('AI summary') : t('Questionnaire answers')}
													</td>
													<td>{log.bookingCode ?? '—'}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						))}
				</section>
			)}
		</div>
	);
};

export default withLayoutAdmin(AdminUserDetail);
