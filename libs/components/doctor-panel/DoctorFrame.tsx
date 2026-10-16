import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Button } from '@mui/material';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import WorkspaceFrame, { WorkspaceFrameProps } from '../layout/WorkspaceFrame';
import ChangePasswordDialog from '../mypage/ChangePasswordDialog';
import { GET_MY_DOCTOR_PROFILE } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { Doctor } from '../../types/doctor/doctor';
import { MemberType } from '../../enums/member.enum';
import { REACT_APP_API_URL } from '../../config';
import { formatCount, imageUrl, initials } from '../../utils';

const DOCTOR_MENU = [
	{ group: 'Community', href: '/doctor-panel/qna', label: 'Q&A Answers', icon: <QuestionAnswerOutlinedIcon /> },
	{ group: 'Community', href: '/doctor-panel/articles', label: 'My Articles', icon: <ArticleOutlinedIcon /> },
	{ group: 'Patients', href: '/doctor-panel/reviews', label: 'Review Replies', icon: <ReplyRoundedIcon /> },
	{ group: 'Account', href: '/doctor-panel', label: 'My Profile', icon: <PersonOutlineRoundedIcon /> },
];
const GROUPS = ['Community', 'Patients', 'Account'];

/**
 * The Doctor Panel: answers to patients' questions, health tips, replies to the reviews of their
 * visits and the doctor's own profile. Bookings,
 * slots and chat belong to the clinic account. A doctor still on the clinic's temporary
 * password is asked to set their own.
 */
const DoctorFrame = (props: WorkspaceFrameProps) => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [passwordOpen, setPasswordOpen] = useState<boolean>(false);
	const { data } = useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'cache-and-network',
		skip: user.memberType !== MemberType.DOCTOR,
	});
	const doctor: Doctor | undefined = data?.getMyDoctorProfile;
	const clinicName = doctor?.clinicData?.clinicName ?? '';

	const item = (entry: (typeof DOCTOR_MENU)[number], withIcon: boolean) => (
		<Link
			key={entry.href}
			href={entry.href}
			className={`my-menu-item ${router.pathname === entry.href ? 'active' : ''}`}
			aria-current={router.pathname === entry.href ? 'page' : undefined}
		>
			{withIcon && <span className={'icon'}>{entry.icon}</span>}
			<span className={'label'}>{t(entry.label)}</span>
		</Link>
	);

	const side = (
		<div className={'workspace-side'}>
			<nav className={'my-menu side'} aria-label={t('Doctor Panel')}>
				<div className={'who'}>
					<span className={'avatar'}>
						{doctor?.doctorImage ? (
							<img src={imageUrl(doctor.doctorImage, REACT_APP_API_URL)} alt={''} />
						) : (
							initials(doctor?.doctorName)
						)}
					</span>
					<strong>
						{t('Dr.')} {doctor?.doctorName}
					</strong>
					<span>
						{doctor?.doctorSpecialty && t(`specialty.${doctor.doctorSpecialty}`)}
						{clinicName && ` · ${clinicName}`}
					</span>
				</div>
				{GROUPS.map((group) => (
					<div key={group} className={'group'}>
						<h2>{t(group)}</h2>
						{DOCTOR_MENU.filter((entry) => entry.group === group).map((entry) => item(entry, true))}
					</div>
				))}
				<button type={'button'} className={'my-menu-item logout'} onClick={() => logOut()}>
					<span className={'icon'}>
						<LogoutRoundedIcon />
					</span>
					<span className={'label'}>{t('Log out')}</span>
				</button>
			</nav>
			{clinicName && (
				<p className={'workspace-hint side-note'}>
					{t('Bookings, time slots and patient chat are handled by {{clinic}}.', { clinic: clinicName })}
				</p>
			)}
			{doctor && (
				<div className={'public-card'}>
					<strong>{t('Public profile')}</strong>
					<div className={'numbers'}>
						<span>
							<b>{formatCount(doctor.doctorFollowers)}</b>
							{t('Followers')}
						</span>
						<span>
							<b>{doctor.doctorReviews ? doctor.doctorRating?.toFixed(1) : '—'}</b>
							{t('{{count}} reviews', { count: doctor.doctorReviews ?? 0 })}
						</span>
						<span>
							<b>{formatCount(doctor.doctorViews)}</b>
							{t('Views')}
						</span>
					</div>
					<Link href={`/doctors/detail?id=${doctor._id}`}>{t('View public profile')}</Link>
				</div>
			)}
		</div>
	);

	const notice = user.memberMustChangePassword && (
		<div className={'workspace-notice'}>
			<strong>{t('You are signed in with a temporary password from the clinic.')}</strong>
			<Button size={'small'} variant={'contained'} onClick={() => setPasswordOpen(true)}>
				{t('Set my own password')}
			</Button>
		</div>
	);

	return (
		<>
			<WorkspaceFrame
				{...props}
				home={{ href: '/doctor-panel', label: t('Doctor Panel') }}
				memberType={MemberType.DOCTOR}
				deniedText={t('The Doctor Panel is for doctor accounts.')}
				side={side}
				mobileNav={<nav className={'clinic-tabs'}>{DOCTOR_MENU.map((entry) => item(entry, false))}</nav>}
				notice={notice}
			/>
			<ChangePasswordDialog open={passwordOpen} hasPassword onClose={() => setPasswordOpen(false)} />
		</>
	);
};

export default DoctorFrame;
