import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import WorkspaceFrame, { WorkspaceFrameProps } from '../layout/WorkspaceFrame';
import ClinicMenu from './ClinicMenu';
import { GET_MY_CLINIC } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { Clinic } from '../../types/clinic/clinic';
import { ClinicStatus } from '../../enums/clinic.enum';
import { MemberType } from '../../enums/member.enum';

/** Why a clinic is not live yet, in the clinic's words; with the admin's note when there is one. */
const STATUS_NOTICE: Partial<Record<ClinicStatus, string>> = {
	[ClinicStatus.PENDING]:
		'MedVia is reviewing your clinic. Patients will see it once it is approved — meanwhile add doctors, treatments and slots.',
	[ClinicStatus.CHANGES_REQUESTED]: 'MedVia asked for changes. Fix the profile and send it for review again.',
	[ClinicStatus.REJECTED]: 'Your clinic was not approved.',
	[ClinicStatus.SUSPENDED]: 'Your clinic is suspended. Patients cannot see or book it.',
};

/** Every Clinic Dashboard page sits in this frame; only clinic accounts get in. */
const ClinicFrame = (props: WorkspaceFrameProps) => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { data } = useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'cache-and-network',
		skip: user.memberType !== MemberType.AGENT,
	});
	const clinic: Clinic | undefined = data?.getMyClinic;
	const status = clinic?.clinicStatus;
	const notice = status && STATUS_NOTICE[status] && (
		<div className={`workspace-notice ${status === ClinicStatus.PENDING ? '' : 'danger'}`}>
			<strong>{t(STATUS_NOTICE[status] as string)}</strong>
			{clinic?.clinicReviewNote && status !== ClinicStatus.PENDING && (
				<span>
					{t('Note from MedVia')}: {clinic.clinicReviewNote}
				</span>
			)}
			{status === ClinicStatus.CHANGES_REQUESTED && <Link href={'/dashboard/profile'}>{t('Open the profile')}</Link>}
		</div>
	);

	return (
		<WorkspaceFrame
			{...props}
			home={{ href: '/dashboard', label: t('Clinic Dashboard') }}
			memberType={MemberType.AGENT}
			deniedText={t('The Clinic Dashboard is for clinic accounts.')}
			side={<ClinicMenu clinic={clinic} variant={'side'} />}
			mobileNav={<ClinicMenu clinic={clinic} variant={'tabs'} />}
			notice={notice}
		/>
	);
};

export default ClinicFrame;
