import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Checkbox, FormControlLabel, Radio, Skeleton, TextField } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import OutlinedFlagRoundedIcon from '@mui/icons-material/OutlinedFlagRounded';
import withLayoutAdmin from '../../../libs/components/layout/LayoutAdmin';
import StatusChip from '../../../libs/components/common/StatusChip';
import EmptyState from '../../../libs/components/common/EmptyState';
import { ADMIN_I18N, ADMIN_NS, languageName } from '../../../libs/components/admin/adminText';
import { GET_CLINICS_TO_REVIEW } from '../../../apollo/admin/query';
import { REVIEW_CLINIC } from '../../../apollo/admin/mutation';
import { Clinic } from '../../../libs/types/clinic/clinic';
import { ClinicStatus } from '../../../libs/enums/clinic.enum';
import { ReviewDecision } from '../../../libs/enums/admin.enum';
import { LIST_MAX, REACT_APP_API_URL } from '../../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { formatKrw, imageUrl, initials, isObjectId, seoulTime } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const QUEUE_INPUT = {
	pending: { page: 1, limit: LIST_MAX, clinicStatus: ClinicStatus.PENDING },
	changes: { page: 1, limit: LIST_MAX, clinicStatus: ClinicStatus.CHANGES_REQUESTED },
	rejected: { page: 1, limit: LIST_MAX, clinicStatus: ClinicStatus.REJECTED },
};

const DECISIONS: { value: ReviewDecision; title: string; text: string }[] = [
	{ value: ReviewDecision.APPROVE, title: 'Approve', text: 'The clinic goes live and patients can book it.' },
	{
		value: ReviewDecision.REQUEST_CHANGES,
		title: 'Request changes',
		text: 'The clinic fixes its details and sends them again.',
	},
	{ value: ReviewDecision.REJECT, title: 'Reject', text: 'Not a real clinic, or the details can’t be confirmed.' },
];

/** The team's hand check, as in the mockup. Ticks stay on this page — the API keeps only the decision. */
const CHECKLIST = [
	{ title: 'Address matches the map pin', text: 'Street view shows the clinic entrance' },
	{ title: 'Photos show a real clinic', text: 'Reception, rooms and devices' },
	{ title: 'Prices look realistic', text: 'Compared with similar clinics' },
	{ title: 'Contact details answer', text: 'A test call or email to the manager' },
];

const NOTE_MAX = 1000;

/** One clinic's submitted details, the checklist and the decision (Approve / Request changes / Reject). */
const AdminClinicReview: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const [decision, setDecision] = useState<ReviewDecision>(ReviewDecision.APPROVE);
	const [note, setNote] = useState<string>('');
	const [noteError, setNoteError] = useState<boolean>(false);
	const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false));
	const clinicId = typeof router.query.id === 'string' && isObjectId(router.query.id) ? router.query.id : '';
	const locale = router.locale ?? 'en';

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_CLINICS_TO_REVIEW, {
		variables: QUEUE_INPUT,
		fetchPolicy: 'cache-and-network',
		skip: !clinicId,
	});
	const [reviewClinic, { loading: sending }] = useMutation(REVIEW_CLINIC);
	const clinic: Clinic | undefined = data
		? [...data.pending.list, ...data.changes.list, ...data.rejected.list].find((item: Clinic) => item._id === clinicId)
		: undefined;
	const canDecide = clinic?.clinicStatus === ClinicStatus.PENDING;
	const missingKo = clinic && !clinic.clinicNameKo;

	/** HANDLERS **/
	const sendHandler = async () => {
		if (!clinic) return;
		const message = note.trim();
		if (decision !== ReviewDecision.APPROVE && message.length < 5) {
			setNoteError(true);
			return;
		}
		try {
			await reviewClinic({
				variables: {
					input: {
						clinicId: clinic._id,
						decision,
						...(message && decision !== ReviewDecision.APPROVE ? { clinicReviewNote: message } : {}),
					},
				},
				refetchQueries: ['GetClinicsByAdmin', 'CountClinicsByStatus'],
			});
			await sweetTopSmallSuccessAlert(t('Decision sent'));
			await router.push('/_admin/clinics');
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const back = (
		<Link href={'/_admin/clinics'} className={'admin-back'}>
			<ChevronLeftRoundedIcon />
			{t('Verification')}
		</Link>
	);

	if (!clinicId || (data && !clinic)) {
		return (
			<div id={'admin-clinic-review'}>
				{back}
				<EmptyState
					title={t('This clinic is not waiting for a review.')}
					text={t('Live and suspended clinics are on All clinics.')}
					action={<Link href={'/_admin/clinics/all'}>{t('All clinics')}</Link>}
				/>
			</div>
		);
	}
	if (!clinic) {
		return (
			<div id={'admin-clinic-review'}>
				{back}
				<Skeleton variant={'rounded'} height={loading ? 460 : 120} />
			</div>
		);
	}

	const facts: [string, string][] = [
		[t('Clinic name'), clinic.clinicName],
		[t('Name on the signboard'), clinic.clinicNameKo || '—'],
		[t('Specialty'), clinic.clinicSpecialty ? t(`specialty.${clinic.clinicSpecialty}`) : '—'],
		[t('District'), clinic.clinicDistrict ? t(`district.${clinic.clinicDistrict}`) : '—'],
		[t('Address'), clinic.clinicAddress || '—'],
		[t('Manager'), clinic.memberData?.memberFullName || '—'],
		[t('Work email'), clinic.memberData?.memberEmail || '—'],
		[t('Phone'), clinic.clinicPhone || clinic.memberData?.memberPhone || '—'],
		[t('Languages'), (clinic.clinicLangs ?? []).map(languageName).join(', ') || '—'],
		[
			t('Treatments'),
			clinic.clinicTreatmentNames?.length
				? `${clinic.clinicTreatmentNames.length} · ${t('from {{price}}', { price: formatKrw(clinic.clinicMinPrice) })}`
				: t('None yet'),
		],
	];

	return (
		<div id={'admin-clinic-review'}>
			{back}
			<div className={'admin-review-head'}>
				<span className={'logo'}>
					{clinic.clinicLogo ? (
						<img src={imageUrl(clinic.clinicLogo, REACT_APP_API_URL)} alt={''} />
					) : (
						initials(clinic.clinicName)
					)}
				</span>
				<div className={'text'}>
					<h1>{clinic.clinicName}</h1>
					<p>
						{[
							clinic.clinicSpecialty && t(`specialty.${clinic.clinicSpecialty}`),
							clinic.clinicDistrict && t(`district.${clinic.clinicDistrict}`),
							t('submitted {{date}}', { date: seoulTime(clinic.submittedAt ?? clinic.createdAt ?? '', locale, false) }),
						]
							.filter(Boolean)
							.join(' · ')}
					</p>
				</div>
				<div className={'chips'}>
					{clinic.clinicStatus && (
						<StatusChip status={clinic.clinicStatus} label={t(`clinicStatus.${clinic.clinicStatus}`)} />
					)}
					{missingKo && (
						<span className={'admin-badge warning'}>
							<OutlinedFlagRoundedIcon />
							{t('Korean name missing')}
						</span>
					)}
				</div>
			</div>

			<div className={'admin-grid main-side'}>
				<div className={'admin-stack'}>
					<section className={'admin-card'}>
						<h2>{t('Submitted by the clinic')}</h2>
						<dl className={'admin-facts two'}>
							{facts.map(([label, value]) => (
								<div key={label}>
									<dt>{label}</dt>
									<dd>{value}</dd>
								</div>
							))}
						</dl>
						{clinic.clinicDesc && <p className={'admin-desc'}>{clinic.clinicDesc}</p>}
						{Boolean(clinic.clinicImages?.length) && (
							<div className={'admin-photos'}>
								{clinic.clinicImages?.map((image) => (
									<img key={image} src={imageUrl(image, REACT_APP_API_URL)} alt={''} />
								))}
							</div>
						)}
					</section>
					<section className={'admin-card'}>
						<div className={'admin-card-head'}>
							<div>
								<h2>{t('Review checklist')}</h2>
								<p>{t('Checked by hand by the MedVia team')}</p>
							</div>
						</div>
						<ul className={'admin-checklist'}>
							{CHECKLIST.map((item, index) => (
								<li key={item.title}>
									<FormControlLabel
										control={
											<Checkbox
												checked={checked[index]}
												onChange={(event) =>
													setChecked(checked.map((value, i) => (i === index ? event.target.checked : value)))
												}
											/>
										}
										label={
											<span className={'text'}>
												<strong>{t(item.title)}</strong>
												<span>{t(item.text)}</span>
											</span>
										}
									/>
								</li>
							))}
							{missingKo && (
								<li className={'flag'}>
									<span className={'icon'}>
										<OutlinedFlagRoundedIcon />
									</span>
									<span className={'text'}>
										<strong>{t('Name on the signboard')}</strong>
										<span>{t('Empty — patients use the Korean name to find the entrance')}</span>
									</span>
								</li>
							)}
						</ul>
					</section>
				</div>

				<section className={'admin-card admin-decision'}>
					<h2>{t('Decision')}</h2>
					{!canDecide && (
						<p className={'admin-muted'}>
							{clinic.clinicStatus === ClinicStatus.CHANGES_REQUESTED
								? t('Waiting for the clinic to send its details again.')
								: t('This clinic was rejected.')}
						</p>
					)}
					{DECISIONS.map((item) => (
						<label
							key={item.value}
							className={`admin-choice ${decision === item.value ? 'active' : ''} ${canDecide ? '' : 'disabled'}`}
						>
							<Radio
								checked={decision === item.value}
								disabled={!canDecide}
								onChange={() => {
									setDecision(item.value);
									setNoteError(false);
								}}
							/>
							<span>
								<strong>{t(item.title)}</strong>
								<span>{t(item.text)}</span>
							</span>
						</label>
					))}
					{clinic.clinicReviewNote && (
						<p className={'admin-note'}>
							{t('Earlier message')}: {clinic.clinicReviewNote}
						</p>
					)}
					{decision !== ReviewDecision.APPROVE && (
						<TextField
							label={t('Message to the clinic')}
							value={note}
							multiline
							minRows={4}
							disabled={!canDecide}
							error={noteError}
							helperText={noteError ? t('Tell the clinic what to fix (at least 5 characters).') : undefined}
							inputProps={{ maxLength: NOTE_MAX }}
							onChange={(event) => {
								setNote(event.target.value);
								setNoteError(false);
							}}
						/>
					)}
					<Button
						variant={'contained'}
						size={'large'}
						endIcon={<SendRoundedIcon />}
						disabled={!canDecide || sending}
						onClick={sendHandler}
					>
						{t('Send decision')}
					</Button>
					<p className={'admin-muted small'}>{t('Every decision is logged with your admin name.')}</p>
				</section>
			</div>
		</div>
	);
};

export default withLayoutAdmin(AdminClinicReview);
