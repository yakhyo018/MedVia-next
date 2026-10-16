import React, { useState } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Skeleton } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import withLayoutAdmin from '../../libs/components/layout/LayoutAdmin';
import AdminPills, { AdminPill } from '../../libs/components/admin/AdminPills';
import AdminPager from '../../libs/components/admin/AdminPager';
import StatusChip from '../../libs/components/common/StatusChip';
import EmptyState from '../../libs/components/common/EmptyState';
import PromptDialog from '../../libs/components/common/PromptDialog';
import useUrlQuery from '../../libs/hooks/useUrlQuery';
import { GET_TREATMENTS_BY_ADMIN } from '../../apollo/admin/query';
import { REVIEW_TREATMENT } from '../../apollo/admin/mutation';
import { Treatment } from '../../libs/types/treatment/treatment';
import { AdminTreatmentsInquiry } from '../../libs/types/admin/admin';
import { TreatmentStatus } from '../../libs/enums/treatment.enum';
import { ReviewDecision } from '../../libs/enums/admin.enum';
import { REACT_APP_API_URL } from '../../libs/config';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { formatKrw, imageUrl } from '../../libs/utils';
import { T } from '../../libs/types/common';
import { ADMIN_I18N, ADMIN_NS } from '../../libs/components/admin/adminText';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 10;

const TABS: { key: string; label: string; input: Partial<AdminTreatmentsInquiry> }[] = [
	{ key: 'pending', label: 'Pending', input: { reviewQueue: true } },
	{ key: 'approved', label: 'Approved', input: { treatmentStatus: TreatmentStatus.ACTIVE } },
	{ key: 'changes', label: 'Changes requested', input: { treatmentStatus: TreatmentStatus.CHANGES_REQUESTED } },
	{ key: 'rejected', label: 'Rejected', input: { treatmentStatus: TreatmentStatus.REJECTED } },
];

/** What the admin checks before a treatment goes live (Korean medical-ad rules). */
const AD_RULES = [
	'No before/after photos',
	'No guaranteed results',
	'No discounts tied to reviews',
	'Price is the real starting price',
	'Listed doctors really perform it',
];

/** Each decision but Approve needs a message to the clinic. */
const PROMPTS: Partial<Record<ReviewDecision, { title: string; confirm: string }>> = {
	[ReviewDecision.REQUEST_CHANGES]: { title: 'Request an edit of {{name}}', confirm: 'Request edit' },
	[ReviewDecision.REJECT]: { title: 'Reject {{name}}', confirm: 'Reject' },
};

/** The treatments queue: new treatments and edits of live ones, oldest first. */
const AdminTreatments: NextPage = () => {
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const [busyId, setBusyId] = useState<string>('');
	const [prompt, setPrompt] = useState<{ treatment: Treatment; decision: ReviewDecision } | null>(null);
	const tab = TABS.find((item) => item.key === url.get('tab')) ?? TABS[0];
	const pending = tab.key === 'pending';

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_TREATMENTS_BY_ADMIN, {
		variables: { input: { page: url.page, limit: LIMIT, ...tab.input } },
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const { data: queueData, refetch: refetchQueue } = useQuery(GET_TREATMENTS_BY_ADMIN, {
		variables: { input: { page: 1, limit: 1, reviewQueue: true } },
		fetchPolicy: 'cache-and-network',
	});
	const [reviewTreatment] = useMutation(REVIEW_TREATMENT);
	const treatments: Treatment[] = data?.getTreatmentsByAdmin?.list ?? [];
	const total: number = data?.getTreatmentsByAdmin?.metaCounter?.[0]?.total ?? 0;
	const pills: AdminPill[] = TABS.map((item) => ({
		key: item.key,
		label: t(item.label),
		count: item.key === 'pending' ? queueData?.getTreatmentsByAdmin?.metaCounter?.[0]?.total : undefined,
	}));

	/** HANDLERS **/
	const decide = async (treatment: Treatment, decision: ReviewDecision, note?: string) => {
		try {
			setBusyId(treatment._id);
			await reviewTreatment({
				variables: {
					input: {
						treatmentId: treatment._id,
						decision,
						...(note ? { treatmentReviewNote: note } : {}),
						// An edit: the draft the admin looked at — refused if the clinic changed it since.
						...(treatment.treatmentDraft ? { draftSubmittedAt: treatment.treatmentDraft.submittedAt } : {}),
					},
				},
			});
			await Promise.all([refetch(), refetchQueue()]);
			setPrompt(null);
			await sweetTopSmallSuccessAlert(t('Decision sent'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setBusyId('');
		}
	};

	const approveHandler = async (treatment: Treatment) => {
		const name = treatment.treatmentDraft?.treatmentName ?? treatment.treatmentName;
		const sure = await sweetConfirmAlert(t('Approve {{name}}? Patients see it right away.', { name }), t('Approve'));
		if (sure) await decide(treatment, ReviewDecision.APPROVE);
	};

	/** What an edit changes, in one line. */
	const changes = (treatment: Treatment): string[] => {
		const draft = treatment.treatmentDraft;
		if (!draft) return [];
		const lines: string[] = [];
		if (draft.treatmentName && draft.treatmentName !== treatment.treatmentName)
			lines.push(t('Name: {{from}} → {{to}}', { from: treatment.treatmentName, to: draft.treatmentName }));
		if (
			draft.treatmentPrice !== undefined &&
			draft.treatmentPrice !== null &&
			draft.treatmentPrice !== treatment.treatmentPrice
		)
			lines.push(
				t('Price: {{from}} → {{to}}', {
					from: formatKrw(treatment.treatmentPrice),
					to: formatKrw(draft.treatmentPrice),
				}),
			);
		if (draft.treatmentCategory && draft.treatmentCategory !== treatment.treatmentCategory)
			lines.push(t('Category changed'));
		if (
			draft.treatmentDesc !== undefined &&
			draft.treatmentDesc !== null &&
			draft.treatmentDesc !== treatment.treatmentDesc
		)
			lines.push(t('Description changed'));
		if (draft.treatmentImages && draft.treatmentImages.join() !== (treatment.treatmentImages ?? []).join())
			lines.push(t('Photos changed'));
		return lines.length ? lines : [t('No visible changes')];
	};

	const card = (treatment: Treatment) => {
		const draft = treatment.treatmentDraft;
		const name = draft?.treatmentName ?? treatment.treatmentName;
		const image = draft?.treatmentImages?.[0] ?? treatment.treatmentImages?.[0];
		const price = draft?.treatmentPrice ?? treatment.treatmentPrice;
		const category = draft?.treatmentCategory ?? treatment.treatmentCategory;
		const isNew = treatment.treatmentStatus === TreatmentStatus.PENDING;
		return (
			<article key={treatment._id} className={'admin-card admin-review-item'}>
				<div className={'top'}>
					<span className={'photo'}>
						{image ? <img src={imageUrl(image, REACT_APP_API_URL)} alt={''} /> : t('Photo')}
					</span>
					<div className={'text'}>
						<div className={'name'}>
							<h3>{name}</h3>
							{pending ? (
								<span className={`admin-badge ${isNew ? 'teal' : 'neutral'}`}>{isNew ? t('New') : t('Edited')}</span>
							) : (
								treatment.treatmentStatus && <StatusChip status={treatment.treatmentStatus} size={'small'} />
							)}
						</div>
						<span>
							{treatment.clinicData?.clinicName ?? '—'}
							{treatment.doctors?.length
								? ` · ${treatment.doctors.map((doctor) => `${t('Dr.')} ${doctor.doctorName}`).join(', ')}`
								: ''}
						</span>
						<span>
							{[
								category && t(`category.${category}`),
								t('{{count}} min', { count: treatment.treatmentDuration }),
								t('from {{price}}', { price: formatKrw(price) }),
							]
								.filter(Boolean)
								.join(' · ')}
						</span>
					</div>
				</div>
				{draft && <p className={'admin-diff'}>{changes(treatment).join(' · ')}</p>}
				{(draft?.treatmentDesc ?? treatment.treatmentDesc) && (
					<p className={'admin-desc'}>{draft?.treatmentDesc ?? treatment.treatmentDesc}</p>
				)}
				{treatment.treatmentReviewNote && !pending && (
					<p className={'admin-note'}>
						{t('Note to the clinic')}: {treatment.treatmentReviewNote}
					</p>
				)}
				{pending && (
					<div className={'buttons'}>
						<Button variant={'contained'} disabled={busyId === treatment._id} onClick={() => approveHandler(treatment)}>
							{t('Approve')}
						</Button>
						{isNew && (
							<Button
								variant={'outlined'}
								disabled={busyId === treatment._id}
								onClick={() => setPrompt({ treatment, decision: ReviewDecision.REQUEST_CHANGES })}
							>
								{t('Request edit')}
							</Button>
						)}
						<button
							type={'button'}
							className={'admin-text-danger'}
							disabled={busyId === treatment._id}
							onClick={() => setPrompt({ treatment, decision: ReviewDecision.REJECT })}
						>
							{t('Reject')}
						</button>
					</div>
				)}
			</article>
		);
	};

	const promptText = prompt ? PROMPTS[prompt.decision] : undefined;

	return (
		<div id={'admin-treatments'}>
			<AdminPills
				pills={pills}
				active={tab.key}
				onChange={(key) => url.set({ tab: key === 'pending' ? undefined : key })}
				label={t('Treatments')}
			/>
			<div className={'admin-grid main-side'}>
				<div className={'admin-stack'}>
					{loading && !data ? (
						<Skeleton variant={'rounded'} height={300} />
					) : treatments.length === 0 ? (
						<div className={'admin-card'}>
							<EmptyState title={pending ? t('Nothing to review. Nice!') : t('No treatments here.')} />
						</div>
					) : (
						treatments.map(card)
					)}
					{total > LIMIT && (
						<div className={'admin-table-card'}>
							<AdminPager
								page={url.page}
								limit={LIMIT}
								total={total}
								shown={treatments.length}
								onChange={(page) => url.set({ page })}
							/>
						</div>
					)}
				</div>
				<aside className={'admin-card admin-rules'}>
					<div>
						<h2>{t('Medical ad rules')}</h2>
						<p>{t('Checked before a treatment goes live')}</p>
					</div>
					<ul>
						{AD_RULES.map((rule) => (
							<li key={rule}>
								<CheckRoundedIcon />
								{t(rule)}
							</li>
						))}
					</ul>
					<p className={'admin-muted small'}>
						{t(
							'An edit of a live treatment is approved or rejected as a whole; the live version stays bookable meanwhile.',
						)}
					</p>
				</aside>
			</div>
			<PromptDialog
				open={Boolean(prompt)}
				title={
					promptText && prompt
						? t(promptText.title, {
								name: prompt.treatment.treatmentDraft?.treatmentName ?? prompt.treatment.treatmentName,
							})
						: ''
				}
				text={t('The clinic sees this message.')}
				label={t('Message to the clinic')}
				confirmText={promptText ? t(promptText.confirm) : ''}
				danger={prompt?.decision === ReviewDecision.REJECT}
				minLength={5}
				maxLength={1000}
				errorText={t('Tell the clinic what to fix (at least 5 characters).')}
				busy={Boolean(busyId)}
				onConfirm={(note) => prompt && decide(prompt.treatment, prompt.decision, note.trim())}
				onClose={() => setPrompt(null)}
			/>
		</div>
	);
};

export default withLayoutAdmin(AdminTreatments);
