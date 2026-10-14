import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import StatusChip from '../common/StatusChip';
import { logOut } from '../../auth';
import { Clinic } from '../../types/clinic/clinic';
import { REACT_APP_API_URL } from '../../config';
import { formatCount, imageUrl, initials } from '../../utils';

interface ClinicMenuItem {
	href: string;
	label: string;
	/** The phone's short tab name. */
	short: string;
	icon: ReactNode;
}

/** The dashboard sections, grouped as in the mockup. */
const CLINIC_MENU: { title: string; items: ClinicMenuItem[] }[] = [
	{
		title: 'Practice',
		items: [
			{ href: '/dashboard', label: 'Dashboard', short: 'Dashboard', icon: <DashboardOutlinedIcon /> },
			{ href: '/dashboard/bookings', label: 'Bookings', short: 'Bookings', icon: <EventNoteOutlinedIcon /> },
			{
				href: '/dashboard/schedule',
				label: 'Schedule & Slots',
				short: 'Schedule',
				icon: <CalendarMonthOutlinedIcon />,
			},
			{
				href: '/dashboard/chat',
				label: 'Consultations',
				short: 'Chat',
				icon: <ChatBubbleOutlineRoundedIcon />,
			},
		],
	},
	{
		title: 'Catalog',
		items: [
			{
				href: '/dashboard/treatments',
				label: 'Treatments',
				short: 'Treatments',
				icon: <MedicalServicesOutlinedIcon />,
			},
			{
				href: '/dashboard/treatments/edit',
				label: 'Add Treatment',
				short: 'Add treatment',
				icon: <AddCircleOutlineRoundedIcon />,
			},
			{ href: '/dashboard/doctors', label: 'Doctors', short: 'Doctors', icon: <GroupOutlinedIcon /> },
		],
	},
	{
		title: 'Feedback',
		items: [{ href: '/dashboard/reviews', label: 'Reviews', short: 'Reviews', icon: <StarBorderRoundedIcon /> }],
	},
	{
		title: 'Account',
		items: [
			{ href: '/dashboard/profile', label: 'Clinic Profile', short: 'Profile', icon: <StorefrontOutlinedIcon /> },
		],
	},
];

interface ClinicMenuProps {
	clinic?: Clinic;
	/** 'side': the computer's sidebar. 'tabs': a row of pills above a phone's page head. */
	variant: 'side' | 'tabs';
}

/** The Clinic Dashboard menu: the clinic, its sections, and its public page in numbers. */
const ClinicMenu = (props: ClinicMenuProps) => {
	const { clinic, variant } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	// "Add Treatment" is the same page as editing one; "Treatments" stays lit only on the list.
	const isActive = (href: string) =>
		href === '/dashboard' || href === '/dashboard/treatments'
			? router.pathname === href
			: router.pathname.startsWith(href);

	const item = (entry: ClinicMenuItem) => (
		<Link
			key={entry.href}
			href={entry.href}
			className={`my-menu-item ${isActive(entry.href) ? 'active' : ''}`}
			aria-current={isActive(entry.href) ? 'page' : undefined}
		>
			{variant === 'side' && <span className={'icon'}>{entry.icon}</span>}
			<span className={'label'}>{t(variant === 'side' ? entry.label : entry.short)}</span>
		</Link>
	);

	if (variant === 'tabs') {
		return (
			<>
				{clinic && (
					<div className={'clinic-strip'}>
						<span className={'avatar'}>
							{clinic.clinicLogo ? (
								<img src={imageUrl(clinic.clinicLogo, REACT_APP_API_URL)} alt={''} />
							) : (
								initials(clinic.clinicName)
							)}
						</span>
						<span className={'text'}>
							<strong>{clinic.clinicName}</strong>
							<span>
								{clinic.clinicSpecialty && t(`specialty.${clinic.clinicSpecialty}`)}
								{clinic.clinicDistrict && ` · ${t(`district.${clinic.clinicDistrict}`)}`}
							</span>
						</span>
						{clinic.clinicStatus && (
							<StatusChip
								status={clinic.clinicStatus}
								label={t(`clinicStatus.${clinic.clinicStatus}`)}
								size={'small'}
							/>
						)}
					</div>
				)}
				<nav className={'clinic-tabs'} aria-label={t('Clinic Dashboard')}>
					{CLINIC_MENU.flatMap((group) => group.items).map(item)}
				</nav>
			</>
		);
	}

	return (
		<div className={'workspace-side'}>
			<nav className={'my-menu side'} aria-label={t('Clinic Dashboard')}>
				<div className={'who'}>
					<span className={'avatar square'}>
						{clinic?.clinicLogo ? (
							<img src={imageUrl(clinic.clinicLogo, REACT_APP_API_URL)} alt={''} />
						) : (
							initials(clinic?.clinicName)
						)}
					</span>
					<strong>{clinic?.clinicName}</strong>
					<span>
						{clinic?.clinicSpecialty && t(`specialty.${clinic.clinicSpecialty}`)}
						{clinic?.clinicDistrict && ` · ${t(`district.${clinic.clinicDistrict}`)}`}
					</span>
					{clinic?.clinicStatus && (
						<StatusChip status={clinic.clinicStatus} label={t(`clinicStatus.${clinic.clinicStatus}`)} size={'small'} />
					)}
				</div>
				{CLINIC_MENU.map((group) => (
					<div key={group.title} className={'group'}>
						<h2>{t(group.title)}</h2>
						{group.items.map(item)}
					</div>
				))}
				<button type={'button'} className={'my-menu-item logout'} onClick={() => logOut()}>
					<span className={'icon'}>
						<LogoutRoundedIcon />
					</span>
					<span className={'label'}>{t('Log out')}</span>
				</button>
			</nav>
			{clinic && (
				<div className={'public-card'}>
					<strong>{t('Public page')}</strong>
					<div className={'numbers'}>
						<span>
							<b>{formatCount(clinic.clinicFollowers)}</b>
							{t('Followers')}
						</span>
						<span>
							<b>{clinic.clinicReviews ? clinic.clinicRating?.toFixed(1) : '—'}</b>
							{t('{{count}} reviews', { count: clinic.clinicReviews ?? 0 })}
						</span>
						<span>
							<b>{formatCount(clinic.clinicViews)}</b>
							{t('Views')}
						</span>
					</div>
					<Link href={`/clinics/detail?id=${clinic._id}`}>{t('View public page')}</Link>
				</div>
			)}
		</div>
	);
};

export default ClinicMenu;
