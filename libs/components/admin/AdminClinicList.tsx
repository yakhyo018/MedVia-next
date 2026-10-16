import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Skeleton } from '@mui/material';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import OutlinedFlagRoundedIcon from '@mui/icons-material/OutlinedFlagRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AdminPills, { AdminPill } from './AdminPills';
import AdminPager from './AdminPager';
import AdminStatCard from './AdminStatCard';
import StatusChip from '../common/StatusChip';
import EmptyState from '../common/EmptyState';
import PromptDialog from '../common/PromptDialog';
import useUrlQuery from '../../hooks/useUrlQuery';
import { COUNT_CLINICS_BY_STATUS, GET_CLINICS_BY_ADMIN } from '../../../apollo/admin/query';
import { RESTORE_CLINIC, REVIEW_CLINIC, SUSPEND_CLINIC } from '../../../apollo/admin/mutation';
import { Clinic } from '../../types/clinic/clinic';
import { ClinicStatus } from '../../enums/clinic.enum';
import { ReviewDecision } from '../../enums/admin.enum';
import { REACT_APP_API_URL } from '../../config';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { imageUrl, initials, seoulTime } from '../../utils';
import { ADMIN_I18N, ADMIN_NS } from './adminText';

const LIMIT = 10;

const COUNT_INPUT = {
	pending: { page: 1, limit: 1, clinicStatus: ClinicStatus.PENDING },
	active: { page: 1, limit: 1, clinicStatus: ClinicStatus.ACTIVE },
	changes: { page: 1, limit: 1, clinicStatus: ClinicStatus.CHANGES_REQUESTED },
	rejected: { page: 1, limit: 1, clinicStatus: ClinicStatus.REJECTED },
	suspended: { page: 1, limit: 1, clinicStatus: ClinicStatus.SUSPENDED },
};

interface ClinicTab {
	key: string;
	label: string;
	status?: ClinicStatus;
	/** The alias in COUNT_CLINICS_BY_STATUS. */
	countKey?: keyof typeof COUNT_INPUT;
}

/** Verification: the review queue first. All clinics: live and suspended ones. */
const TABS: Record<'verification' | 'all', ClinicTab[]> = {
	verification: [
		{ key: 'pending', label: 'Pending', status: ClinicStatus.PENDING, countKey: 'pending' },
		{ key: 'changes', label: 'Changes requested', status: ClinicStatus.CHANGES_REQUESTED, countKey: 'changes' },
		{ key: 'verified', label: 'Verified', status: ClinicStatus.ACTIVE, countKey: 'active' },
		{ key: 'rejected', label: 'Rejected', status: ClinicStatus.REJECTED, countKey: 'rejected' },
		{ key: 'all', label: 'All' },
	],
	all: [
		{ key: 'all', label: 'All' },
		{ key: 'live', label: 'Live', status: ClinicStatus.ACTIVE, countKey: 'active' },
		{ key: 'suspended', label: 'Suspended', status: ClinicStatus.SUSPENDED, countKey: 'suspended' },
	],
};

/** Statuses the review page can open (the API serves only these to it). */
export const REVIEWABLE = [ClinicStatus.PENDING, ClinicStatus.CHANGES_REQUESTED, ClinicStatus.REJECTED];

interface AdminClinicListProps {
	mode: 'verification' | 'all';
}

/** The clinics table of both Clinics pages. */
const AdminClinicList = (props: AdminClinicListProps) => {
	const { mode } = props;
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const [busyId, setBusyId] = useState<string>('');
	const [statusFor, setStatusFor] = useState<Clinic | null>(null);
	const tabs = TABS[mode];
	const tab = tabs.find((item) => item.key === url.get('tab')) ?? tabs[0];
	const text = url.get('text');
	const locale = router.locale ?? 'en';

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_CLINICS_BY_ADMIN, {
		variables: {
			input: {
				page: url.page,
				limit: LIMIT,
				...(tab.status ? { clinicStatus: tab.status } : {}),
				...(text ? { text } : {}),
			},
		},
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const { data: countData, refetch: refetchCounts } = useQuery(COUNT_CLINICS_BY_STATUS, {
		variables: COUNT_INPUT,
		fetchPolicy: 'cache-and-network',
	});
	const [reviewClinic] = useMutation(REVIEW_CLINIC);
	const [suspendClinic, { loading: suspending }] = useMutation(SUSPEND_CLINIC);
	const [restoreClinic, { loading: restoring }] = useMutation(RESTORE_CLINIC);
	const clinics: Clinic[] = data?.getClinicsByAdmin?.list ?? [];
	const total: number = data?.getClinicsByAdmin?.metaCounter?.[0]?.total ?? 0;
	const count = (key?: keyof typeof COUNT_INPUT): number | undefined =>
		key && countData ? (countData[key]?.metaCounter?.[0]?.total ?? 0) : undefined;
	const pills: AdminPill[] = tabs.map((item) => ({ key: item.key, label: t(item.label), count: count(item.countKey) }));

	/** HANDLERS **/
	const run = async (clinic: Clinic, action: () => Promise<unknown>, done: string) => {
		try {
			setBusyId(clinic._id);
			await action();
			await Promise.all([refetch(), refetchCounts()]);
			await sweetTopSmallSuccessAlert(done);
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setBusyId('');
		}
	};

	const approveHandler = async (clinic: Clinic) => {
		const sure = await sweetConfirmAlert(
			t('Approve {{name}}? The clinic goes live and patients can book it.', { name: clinic.clinicName }),
			t('Approve'),
		);
		if (!sure) return;
		await run(
			clinic,
			() => reviewClinic({ variables: { input: { clinicId: clinic._id, decision: ReviewDecision.APPROVE } } }),
			t('Clinic approved'),
		);
	};

	const statusHandler = async (note: string) => {
		const clinic = statusFor;
		if (!clinic) return;
		const suspending = clinic.clinicStatus === ClinicStatus.ACTIVE;
		const input = { clinicId: clinic._id, ...(note.trim() ? { note: note.trim() } : {}) };
		await run(
			clinic,
			() => (suspending ? suspendClinic({ variables: { input } }) : restoreClinic({ variables: { input } })),
			suspending ? t('Clinic suspended') : t('Clinic restored'),
		);
		setStatusFor(null);
	};

	const actions = (clinic: Clinic) => {
		const status = clinic.clinicStatus;
		return (
			<div className={'actions'}>
				{status && REVIEWABLE.includes(status) && (
					<Button variant={'outlined'} onClick={() => router.push(`/_admin/clinics/review?id=${clinic._id}`)}>
						{t('Review')}
					</Button>
				)}
				{status === ClinicStatus.PENDING && (
					<Button variant={'contained'} disabled={busyId === clinic._id} onClick={() => approveHandler(clinic)}>
						{t('Approve')}
					</Button>
				)}
				{status === ClinicStatus.ACTIVE && (
					<Button variant={'outlined'} href={`/clinics/detail?id=${clinic._id}`} target={'_blank'}>
						{t('View')}
					</Button>
				)}
				{mode === 'all' && (status === ClinicStatus.ACTIVE || status === ClinicStatus.SUSPENDED) && (
					<Button className={'admin-soft-btn'} disabled={busyId === clinic._id} onClick={() => setStatusFor(clinic)}>
						{status === ClinicStatus.ACTIVE ? t('Suspend') : t('Restore')}
					</Button>
				)}
			</div>
		);
	};

	return (
		<>
			{mode === 'verification' && (
				<div className={'admin-stats four'}>
					<AdminStatCard
						label={t('Waiting for review')}
						value={count('pending')}
						icon={<ScheduleRoundedIcon />}
						tone={'warning'}
					/>
					<AdminStatCard
						label={t('Verified')}
						value={count('active')}
						icon={<VerifiedUserOutlinedIcon />}
						tone={'success'}
					/>
					<AdminStatCard label={t('Changes requested')} value={count('changes')} icon={<OutlinedFlagRoundedIcon />} />
					<AdminStatCard label={t('Rejected')} value={count('rejected')} icon={<CloseRoundedIcon />} tone={'danger'} />
				</div>
			)}
			<AdminPills
				pills={pills}
				active={tab.key}
				onChange={(key) => url.set({ tab: key === tabs[0].key ? undefined : key })}
				end={mode === 'verification' ? t('Each new clinic is reviewed by hand before it goes live') : undefined}
				label={t('Clinics')}
			/>
			<div className={'admin-table-card'}>
				{loading && !data ? (
					<Skeleton variant={'rectangular'} height={420} />
				) : clinics.length === 0 ? (
					<EmptyState title={text ? t('No clinics match "{{text}}".', { text }) : t('No clinics here.')} />
				) : (
					<div className={'admin-table-scroll'}>
						<table className={'admin-table'}>
							<thead>
								<tr>
									<th>{t('Clinic')}</th>
									<th>{t('Specialty')}</th>
									<th>{t('District')}</th>
									<th>{t('Treatments')}</th>
									{mode === 'all' ? <th>{t('Rating')}</th> : <th>{t('Submitted')}</th>}
									<th>{t('Status')}</th>
									<th>{t('Actions')}</th>
								</tr>
							</thead>
							<tbody>
								{clinics.map((clinic) => (
									<tr key={clinic._id}>
										<td>
											<div className={'who'}>
												<span className={'avatar square'}>
													{clinic.clinicLogo || clinic.clinicImages?.[0] ? (
														<img
															src={imageUrl(clinic.clinicLogo || clinic.clinicImages?.[0], REACT_APP_API_URL)}
															alt={''}
														/>
													) : (
														initials(clinic.clinicName)
													)}
												</span>
												<div>
													<strong>{clinic.clinicName}</strong>
													{clinic.memberData?.memberEmail && <span>{clinic.memberData.memberEmail}</span>}
												</div>
											</div>
										</td>
										<td>{clinic.clinicSpecialty ? t(`specialty.${clinic.clinicSpecialty}`) : '—'}</td>
										<td>{clinic.clinicDistrict ? t(`district.${clinic.clinicDistrict}`) : '—'}</td>
										<td>{clinic.clinicTreatmentNames?.length ?? 0}</td>
										{mode === 'all' ? (
											<td>{clinic.clinicReviews ? clinic.clinicRating?.toFixed(1) : '—'}</td>
										) : (
											<td>{seoulTime(clinic.submittedAt ?? clinic.createdAt ?? '', locale, false) || '—'}</td>
										)}
										<td>
											{clinic.clinicStatus && (
												<StatusChip
													status={clinic.clinicStatus}
													label={t(`clinicStatus.${clinic.clinicStatus}`)}
													size={'small'}
												/>
											)}
										</td>
										<td>{actions(clinic)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{total > 0 && (
					<AdminPager
						page={url.page}
						limit={LIMIT}
						total={total}
						shown={clinics.length}
						onChange={(page) => url.set({ page })}
					/>
				)}
			</div>
			<PromptDialog
				open={Boolean(statusFor)}
				title={
					statusFor?.clinicStatus === ClinicStatus.ACTIVE
						? t('Suspend {{name}}?', { name: statusFor?.clinicName })
						: t('Restore {{name}}?', { name: statusFor?.clinicName })
				}
				text={
					statusFor?.clinicStatus === ClinicStatus.ACTIVE
						? t('Patients stop seeing the clinic and its doctors; booked visits stay.')
						: t('The clinic and its doctors are public again.')
				}
				label={t('Note for the audit log (optional)')}
				confirmText={statusFor?.clinicStatus === ClinicStatus.ACTIVE ? t('Suspend') : t('Restore')}
				danger={statusFor?.clinicStatus === ClinicStatus.ACTIVE}
				busy={suspending || restoring}
				onConfirm={statusHandler}
				onClose={() => setStatusFor(null)}
			/>
		</>
	);
};

export default AdminClinicList;
