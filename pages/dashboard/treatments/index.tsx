import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { DocumentNode, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import withLayoutBasic from '../../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../../libs/components/dashboard/ClinicFrame';
import StatusChip from '../../../libs/components/common/StatusChip';
import EmptyState from '../../../libs/components/common/EmptyState';
import { GET_MY_CLINIC_TREATMENTS } from '../../../apollo/user/query';
import {
	CANCEL_TREATMENT_REVIEW,
	HIDE_TREATMENT,
	REMOVE_TREATMENT,
	RESUBMIT_TREATMENT,
	SHOW_TREATMENT,
} from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { Treatment } from '../../../libs/types/treatment/treatment';
import { TreatmentStatus } from '../../../libs/enums/treatment.enum';
import { MemberType } from '../../../libs/enums/member.enum';
import { sweetDangerConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { formatKrw, initials } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const TABS: { key: string; label: string; statuses?: TreatmentStatus[] }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active', statuses: [TreatmentStatus.ACTIVE] },
	{ key: 'review', label: 'In review', statuses: [TreatmentStatus.PENDING] },
	{
		key: 'changes',
		label: 'Needs changes',
		statuses: [TreatmentStatus.CHANGES_REQUESTED, TreatmentStatus.REJECTED],
	},
	{ key: 'hidden', label: 'Hidden', statuses: [TreatmentStatus.HIDDEN] },
];

/** The treatment's own word for each state. */
const TREATMENT_STATUS_LABEL: Record<string, string> = {
	[TreatmentStatus.ACTIVE]: 'Active',
	[TreatmentStatus.PENDING]: 'In review',
	[TreatmentStatus.CHANGES_REQUESTED]: 'Needs changes',
	[TreatmentStatus.REJECTED]: 'Rejected',
	[TreatmentStatus.HIDDEN]: 'Hidden',
};

type Move = 'hide' | 'show' | 'cancel' | 'resubmit' | 'remove';

const MOVES: Record<Move, DocumentNode> = {
	hide: HIDE_TREATMENT,
	show: SHOW_TREATMENT,
	cancel: CANCEL_TREATMENT_REVIEW,
	resubmit: RESUBMIT_TREATMENT,
	remove: REMOVE_TREATMENT,
};

/**
 * The clinic's treatments and their review state. A new treatment, and a change to the name,
 * category, price, description or photos of a live one, waits for MedVia's check; the live
 * version stays bookable meanwhile.
 */
const ClinicTreatments: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [busyId, setBusyId] = useState<string>('');
	const active = TABS.find((item) => item.key === router.query.tab) ?? TABS[0];
	const isClinic = user.memberType === MemberType.AGENT;

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_MY_CLINIC_TREATMENTS, {
		fetchPolicy: 'cache-and-network',
		skip: !isClinic,
	});
	const [hide] = useMutation(MOVES.hide);
	const [show] = useMutation(MOVES.show);
	const [cancel] = useMutation(MOVES.cancel);
	const [resubmit] = useMutation(MOVES.resubmit);
	const [remove] = useMutation(MOVES.remove);
	const mutate: Record<Move, typeof hide> = { hide, show, cancel, resubmit, remove };
	const treatments: Treatment[] = data?.getMyClinicTreatments ?? [];
	const countOf = (statuses?: TreatmentStatus[]) =>
		statuses
			? treatments.filter((item) => statuses.includes(item.treatmentStatus ?? TreatmentStatus.PENDING)).length
			: treatments.length;
	const shown = treatments.filter(
		(item) => !active.statuses || active.statuses.includes(item.treatmentStatus ?? TreatmentStatus.PENDING),
	);

	/** HANDLERS **/
	const tabHandler = async (key: string) => {
		await router.push({ pathname: router.pathname, query: key === 'all' ? {} : { tab: key } }, undefined, {
			shallow: true,
		});
	};

	const moveHandler = async (treatment: Treatment, move: Move) => {
		try {
			if (move === 'remove' || move === 'cancel') {
				const sure = await sweetDangerConfirmAlert(
					move === 'remove'
						? t('Remove {{name}}? Patients will no longer see it.', { name: treatment.treatmentName })
						: treatment.treatmentDraft
							? t('Drop the change waiting for review? The live version stays.')
							: t('Withdraw {{name}} from review? It will be deleted.', { name: treatment.treatmentName }),
					move === 'remove' ? t('Remove') : t('Withdraw'),
				);
				if (!sure) return;
			}
			setBusyId(treatment._id);
			await mutate[move]({ variables: { treatmentId: treatment._id } });
			await refetch();
			await sweetTopSmallSuccessAlert(t('Saved'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setBusyId('');
		}
	};

	const actions = (treatment: Treatment) => {
		const status = treatment.treatmentStatus;
		const busy = busyId === treatment._id;
		const button = (move: Move, label: string, danger = false) => (
			<Button
				key={move}
				size={'small'}
				variant={'text'}
				color={danger ? 'error' : 'primary'}
				disabled={busy}
				onClick={() => moveHandler(treatment, move)}
			>
				{label}
			</Button>
		);
		return (
			<span className={'row-actions'}>
				{status !== TreatmentStatus.REJECTED && (
					<Button
						size={'small'}
						variant={'text'}
						LinkComponent={Link}
						href={`/dashboard/treatments/edit?id=${treatment._id}`}
					>
						{t('Edit')}
					</Button>
				)}
				{status === TreatmentStatus.ACTIVE && button('hide', t('Hide'))}
				{status === TreatmentStatus.HIDDEN && button('show', t('Show'))}
				{status === TreatmentStatus.CHANGES_REQUESTED && button('resubmit', t('Send again'))}
				{(status === TreatmentStatus.PENDING ||
					status === TreatmentStatus.CHANGES_REQUESTED ||
					treatment.treatmentDraft) &&
					button('cancel', treatment.treatmentDraft ? t('Drop change') : t('Withdraw'), true)}
				{(status === TreatmentStatus.ACTIVE ||
					status === TreatmentStatus.HIDDEN ||
					status === TreatmentStatus.REJECTED) &&
					button('remove', t('Remove'), true)}
			</span>
		);
	};

	return (
		<ClinicFrame
			title={t('Treatments')}
			text={t('Each treatment belongs to the clinic. Assign the doctors who perform it.')}
			className={'clinic-treatments'}
			action={
				<Button
					variant={'contained'}
					startIcon={<AddRoundedIcon />}
					LinkComponent={Link}
					href={'/dashboard/treatments/edit'}
				>
					{t('Add treatment')}
				</Button>
			}
		>
			<Box className={'booking-tabs'} role={'tablist'} aria-label={t('Treatments')}>
				{TABS.filter((tab) => tab.key !== 'changes' || countOf(tab.statuses) > 0).map((tab) => (
					<button
						key={tab.key}
						type={'button'}
						role={'tab'}
						aria-selected={tab.key === active.key}
						onClick={() => tabHandler(tab.key)}
					>
						{t(tab.label)} ({countOf(tab.statuses)})
					</button>
				))}
			</Box>
			<p className={'workspace-hint'}>
				{t('New and edited treatments are checked by MedVia against medical ad rules before patients see them.')}
			</p>

			{loading && treatments.length === 0 ? (
				<Skeleton variant={'rounded'} height={320} />
			) : shown.length === 0 ? (
				<EmptyState
					title={t('Nothing in this tab')}
					action={
						<Button variant={'contained'} LinkComponent={Link} href={'/dashboard/treatments/edit'}>
							{t('Add treatment')}
						</Button>
					}
				/>
			) : (
				<div className={'data-table treatments'} role={'table'} aria-label={t('Treatments')}>
					<div className={'row head'} role={'row'}>
						<span role={'columnheader'}>{t('Treatment')}</span>
						<span role={'columnheader'}>{t('Doctors')}</span>
						<span role={'columnheader'}>{t('Duration')}</span>
						<span role={'columnheader'}>{t('Price from')}</span>
						<span role={'columnheader'}>{t('Bookings')}</span>
						<span role={'columnheader'}>{t('Status')}</span>
						<span role={'columnheader'}>{t('Actions')}</span>
					</div>
					{shown.map((treatment) => (
						<div key={treatment._id} className={'row'} role={'row'}>
							<span role={'cell'} className={'name'}>
								<strong>{treatment.treatmentName}</strong>
								<small>{t(`category.${treatment.treatmentCategory}`)}</small>
								{treatment.treatmentDraft && <small className={'draft'}>{t('A change is waiting for review')}</small>}
								{treatment.treatmentReviewNote &&
									(treatment.treatmentStatus === TreatmentStatus.CHANGES_REQUESTED ||
										treatment.treatmentStatus === TreatmentStatus.REJECTED) && (
										<small className={'note'}>
											{t('Note from MedVia')}: {treatment.treatmentReviewNote}
										</small>
									)}
							</span>
							<span role={'cell'} className={'doctors'}>
								{(treatment.doctors ?? []).map((doctor) => (
									<span key={doctor._id} className={'mini-avatar'} title={doctor.doctorName}>
										{initials(doctor.doctorName)}
									</span>
								))}
							</span>
							<span role={'cell'}>{t('{{count}} min', { count: treatment.treatmentDuration })}</span>
							<span role={'cell'}>{formatKrw(treatment.treatmentPrice)}</span>
							<span role={'cell'}>
								{treatment.treatmentBookingsMonth
									? t('{{count}} / mo', { count: treatment.treatmentBookingsMonth })
									: '—'}
							</span>
							<span role={'cell'}>
								<StatusChip
									status={treatment.treatmentStatus ?? TreatmentStatus.PENDING}
									label={t(TREATMENT_STATUS_LABEL[treatment.treatmentStatus ?? TreatmentStatus.PENDING])}
									size={'small'}
								/>
							</span>
							<span role={'cell'}>{actions(treatment)}</span>
						</div>
					))}
				</div>
			)}
		</ClinicFrame>
	);
};

export default withLayoutBasic(ClinicTreatments);
