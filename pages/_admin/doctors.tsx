import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Skeleton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import withLayoutAdmin from '../../libs/components/layout/LayoutAdmin';
import AdminPills, { AdminPill } from '../../libs/components/admin/AdminPills';
import AdminPager from '../../libs/components/admin/AdminPager';
import StatusChip from '../../libs/components/common/StatusChip';
import EmptyState from '../../libs/components/common/EmptyState';
import PromptDialog from '../../libs/components/common/PromptDialog';
import useUrlQuery from '../../libs/hooks/useUrlQuery';
import { GET_ALL_DOCTORS } from '../../apollo/admin/query';
import { RESTORE_DOCTOR, SUSPEND_DOCTOR } from '../../apollo/admin/mutation';
import { Doctor } from '../../libs/types/doctor/doctor';
import { DoctorStatus } from '../../libs/enums/doctor.enum';
import { ClinicStatus } from '../../libs/enums/clinic.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { imageUrl, initials, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';
import { ADMIN_I18N, ADMIN_NS } from '../../libs/components/admin/adminText';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 10;

const TABS: { key: string; label: string; status?: DoctorStatus }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active', status: DoctorStatus.ACTIVE },
	{ key: 'hidden', label: 'Hidden by clinic', status: DoctorStatus.HIDDEN },
	{ key: 'suspended', label: 'Suspended', status: DoctorStatus.SUSPENDED },
];

/**
 * Every doctor account. Clinics create and hide their doctors; the admin only suspends one
 * (and restores it) — a doctor is public only while doctor and clinic are both active.
 */
const AdminDoctors: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const [busy, setBusy] = useState<boolean>(false);
	const [statusFor, setStatusFor] = useState<Doctor | null>(null);
	const tab = TABS.find((item) => item.key === url.get('tab')) ?? TABS[0];
	const text = url.get('text');

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_ALL_DOCTORS, {
		variables: {
			input: {
				page: url.page,
				limit: LIMIT,
				...(tab.status ? { doctorStatus: tab.status } : {}),
				...(text ? { text } : {}),
			},
		},
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const [suspendDoctor] = useMutation(SUSPEND_DOCTOR);
	const [restoreDoctor] = useMutation(RESTORE_DOCTOR);
	const doctors: Doctor[] = data?.getAllDoctorsByAdmin?.list ?? [];
	const total: number = data?.getAllDoctorsByAdmin?.metaCounter?.[0]?.total ?? 0;
	const pills: AdminPill[] = TABS.map((item) => ({
		key: item.key,
		label: t(item.label),
		count: item.key === tab.key && data ? total : undefined,
	}));
	const waiting = doctors.find((doctor) => doctor.clinicData && doctor.clinicData.clinicStatus !== ClinicStatus.ACTIVE);

	/** HANDLERS **/
	const statusHandler = async (note: string) => {
		const doctor = statusFor;
		if (!doctor) return;
		const suspending = doctor.doctorStatus !== DoctorStatus.SUSPENDED;
		const input = { doctorId: doctor._id, ...(note.trim() ? { note: note.trim() } : {}) };
		try {
			setBusy(true);
			if (suspending) await suspendDoctor({ variables: { input } });
			else await restoreDoctor({ variables: { input } });
			await refetch();
			setStatusFor(null);
			await sweetTopSmallSuccessAlert(suspending ? t('Doctor suspended') : t('Doctor restored'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div id={'admin-doctors'}>
			<AdminPills
				pills={pills}
				active={tab.key}
				onChange={(key) => url.set({ tab: key === 'all' ? undefined : key })}
				label={t('Doctors')}
			/>
			<div className={'admin-info'}>
				<InfoOutlinedIcon />
				<span>
					{t('Doctor accounts are created by their clinic. A doctor is listed only while their clinic is verified.')}
					{waiting &&
						` ${t('Dr. {{name}} stays hidden until {{clinic}} is approved.', {
							name: waiting.doctorName,
							clinic: waiting.clinicData?.clinicName,
						})}`}
				</span>
			</div>
			<div className={'admin-table-card'}>
				{loading && !data ? (
					<Skeleton variant={'rectangular'} height={420} />
				) : doctors.length === 0 ? (
					<EmptyState title={text ? t('No doctors match "{{text}}".', { text }) : t('No doctors here.')} />
				) : (
					<div className={'admin-table-scroll'}>
						<table className={'admin-table'}>
							<thead>
								<tr>
									<th>{t('Doctor')}</th>
									<th>{t('Specialty')}</th>
									<th>{t('Languages')}</th>
									<th>{t('Rating')}</th>
									<th>{t('Joined')}</th>
									<th>{t('Status')}</th>
									<th>{t('Actions')}</th>
								</tr>
							</thead>
							<tbody>
								{doctors.map((doctor) => {
									const live =
										doctor.doctorStatus === DoctorStatus.ACTIVE &&
										doctor.clinicData?.clinicStatus === ClinicStatus.ACTIVE;
									return (
										<tr key={doctor._id}>
											<td>
												<div className={'who'}>
													<span className={'avatar'}>
														{doctor.doctorImage ? (
															<img src={imageUrl(doctor.doctorImage, REACT_APP_API_URL)} alt={''} />
														) : (
															initials(doctor.doctorName)
														)}
													</span>
													<div>
														<strong>{`${t('Dr.')} ${doctor.doctorName}`}</strong>
														<span>{doctor.clinicData?.clinicName ?? '—'}</span>
													</div>
												</div>
											</td>
											<td>{doctor.doctorSpecialty ? t(`specialty.${doctor.doctorSpecialty}`) : '—'}</td>
											<td>{(doctor.doctorLangs ?? []).join(' ')}</td>
											<td>{doctor.doctorReviews ? doctor.doctorRating?.toFixed(1) : '—'}</td>
											<td>{doctor.createdAt ? seoulTime(doctor.createdAt, router.locale, false) : '—'}</td>
											<td>
												<StatusChip status={doctor.doctorStatus ?? DoctorStatus.ACTIVE} size={'small'} />
											</td>
											<td>
												<div className={'actions'}>
													{live && (
														<Button variant={'outlined'} href={`/doctors/detail?id=${doctor._id}`} target={'_blank'}>
															{t('View')}
														</Button>
													)}
													{doctor.doctorStatus !== DoctorStatus.HIDDEN && (
														<Button className={'admin-soft-btn'} onClick={() => setStatusFor(doctor)}>
															{doctor.doctorStatus === DoctorStatus.SUSPENDED ? t('Restore') : t('Suspend')}
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
						shown={doctors.length}
						onChange={(page) => url.set({ page })}
					/>
				)}
			</div>
			<PromptDialog
				open={Boolean(statusFor)}
				title={
					statusFor?.doctorStatus === DoctorStatus.SUSPENDED
						? t('Restore Dr. {{name}}?', { name: statusFor?.doctorName })
						: t('Suspend Dr. {{name}}?', { name: statusFor?.doctorName })
				}
				text={
					statusFor?.doctorStatus === DoctorStatus.SUSPENDED
						? t('The doctor is public again while the clinic is verified.')
						: t('Patients stop seeing the doctor; the clinic cannot show them again.')
				}
				label={t('Note for the audit log (optional)')}
				confirmText={statusFor?.doctorStatus === DoctorStatus.SUSPENDED ? t('Restore') : t('Suspend')}
				danger={statusFor?.doctorStatus !== DoctorStatus.SUSPENDED}
				busy={busy}
				onConfirm={statusHandler}
				onClose={() => setStatusFor(null)}
			/>
		</div>
	);
};

export default withLayoutAdmin(AdminDoctors);
