import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import OutlinedFlagRoundedIcon from '@mui/icons-material/OutlinedFlagRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import Logo from '../common/Logo';
import { ADMIN_I18N, ADMIN_NS, ADMIN_QUEUES_INPUT } from './adminText';
import { GET_ADMIN_COUNTS } from '../../../apollo/admin/query';
import { userVar } from '../../../apollo/store';
import { initials } from '../../utils';
import { T } from '../../types/common';

export interface AdminMenuLink {
	href: string;
	label: string;
	/** Detail pages that belong to this item (the user detail lights "All users"). */
	also?: string[];
}

export interface AdminMenuSection extends AdminMenuLink {
	icon: ReactNode;
	sub: AdminMenuLink[];
}

/** The admin sections in the mockup's order; Audit log is new (no mockup). */
export const ADMIN_MENU: AdminMenuSection[] = [
	{ href: '/_admin', label: 'Dashboard', icon: <GridViewOutlinedIcon />, sub: [] },
	{
		href: '/_admin/users',
		label: 'Users',
		icon: <PeopleAltOutlinedIcon />,
		sub: [{ href: '/_admin/users', label: 'All users', also: ['/_admin/users/detail'] }],
	},
	{
		href: '/_admin/clinics',
		label: 'Clinics',
		icon: <ApartmentOutlinedIcon />,
		sub: [
			{ href: '/_admin/clinics', label: 'Verification', also: ['/_admin/clinics/review'] },
			{ href: '/_admin/clinics/all', label: 'All clinics' },
		],
	},
	{
		href: '/_admin/doctors',
		label: 'Doctors',
		icon: <MedicalServicesOutlinedIcon />,
		sub: [{ href: '/_admin/doctors', label: 'All doctors' }],
	},
	{
		href: '/_admin/treatments',
		label: 'Treatments',
		icon: <FormatListBulletedRoundedIcon />,
		sub: [{ href: '/_admin/treatments', label: 'Review' }],
	},
	{
		href: '/_admin/bookings',
		label: 'Bookings',
		icon: <CalendarTodayOutlinedIcon />,
		sub: [{ href: '/_admin/bookings', label: 'Monitor' }],
	},
	{
		href: '/_admin/reviews',
		label: 'Reviews',
		icon: <StarBorderRoundedIcon />,
		sub: [{ href: '/_admin/reviews', label: 'Moderation' }],
	},
	{
		href: '/_admin/community',
		label: 'Community',
		icon: <ChatBubbleOutlineRoundedIcon />,
		sub: [
			{ href: '/_admin/community', label: 'Posts' },
			{ href: '/_admin/community/reports', label: 'Reports' },
		],
	},
	{
		href: '/_admin/cs',
		label: 'CS',
		icon: <HelpOutlineRoundedIcon />,
		sub: [
			{ href: '/_admin/cs', label: 'Inquiries' },
			{ href: '/_admin/cs/notices', label: 'Notices & FAQ' },
		],
	},
	{ href: '/_admin/audit', label: 'Audit log', icon: <HistoryRoundedIcon />, sub: [] },
];

const matches = (link: AdminMenuLink, pathname: string) =>
	link.href === pathname || Boolean(link.also?.includes(pathname));

/** The section and the sub-page of a path: the menu's lit items and the top bar's breadcrumb. */
export const findAdminPage = (pathname: string): { section?: AdminMenuSection; page?: AdminMenuLink } => {
	for (const section of ADMIN_MENU) {
		const page = section.sub.find((link) => matches(link, pathname));
		if (page) return { section, page };
		if (matches(section, pathname)) return { section };
	}
	return {};
};

/** A queue whose pending total shows as the item's badge. */
type Queue = 'pendingClinics' | 'pendingTreatments' | 'pendingReviews' | 'pendingReports';

interface AdminNavItem extends AdminMenuLink {
	icon: ReactNode;
	queue?: Queue;
}

/**
 * The side menu as the Motion mockup draws it: flat items under group titles, the review queues'
 * totals as badges. The same pages as ADMIN_MENU (which still drives the breadcrumb).
 */
const ADMIN_NAV: { title?: string; items: AdminNavItem[] }[] = [
	{ items: [{ href: '/_admin', label: 'Dashboard', icon: <GridViewOutlinedIcon /> }] },
	{
		title: 'Operations',
		items: [
			{
				href: '/_admin/clinics',
				label: 'Verification',
				icon: <VerifiedOutlinedIcon />,
				also: ['/_admin/clinics/review'],
				queue: 'pendingClinics',
			},
			{ href: '/_admin/clinics/all', label: 'All clinics', icon: <ViewListOutlinedIcon /> },
			{ href: '/_admin/doctors', label: 'Doctors', icon: <MedicalServicesOutlinedIcon /> },
			{
				href: '/_admin/treatments',
				label: 'Treatments',
				icon: <FormatListBulletedRoundedIcon />,
				queue: 'pendingTreatments',
			},
			{ href: '/_admin/bookings', label: 'Bookings', icon: <CalendarTodayOutlinedIcon /> },
		],
	},
	{
		title: 'People',
		items: [
			{ href: '/_admin/users', label: 'Users', icon: <PeopleAltOutlinedIcon />, also: ['/_admin/users/detail'] },
			{ href: '/_admin/reviews', label: 'Reviews', icon: <StarBorderRoundedIcon />, queue: 'pendingReviews' },
			{ href: '/_admin/community', label: 'Community', icon: <ChatBubbleOutlineRoundedIcon /> },
			{
				href: '/_admin/community/reports',
				label: 'Reports',
				icon: <OutlinedFlagRoundedIcon />,
				queue: 'pendingReports',
			},
		],
	},
	{
		title: 'Support',
		items: [
			{ href: '/_admin/cs', label: 'Inquiries', icon: <MailOutlineRoundedIcon /> },
			{ href: '/_admin/cs/notices', label: 'Notices & FAQ', icon: <CampaignOutlinedIcon /> },
			{ href: '/_admin/audit', label: 'Audit log', icon: <HistoryRoundedIcon /> },
		],
	},
];

interface AdminMenuProps {
	/** A phone's drawer closes when a link is chosen. */
	onNavigate?: () => void;
}

/** The admin's side menu: group titles, flat items with queue badges, the signed-in admin at the bottom. */
const AdminMenu = (props: AdminMenuProps) => {
	const { onNavigate } = props;
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const user = useReactiveVar(userVar);
	const { data } = useQuery(GET_ADMIN_COUNTS, { variables: ADMIN_QUEUES_INPUT, fetchPolicy: 'cache-and-network' });
	const count = (queue?: Queue): number =>
		queue ? ((data as T | undefined)?.[queue]?.metaCounter?.[0]?.total ?? 0) : 0;

	return (
		<nav className={'admin-menu'} aria-label={t('Admin')}>
			<div className={'admin-logo'}>
				<Logo href={'/_admin'} />
			</div>
			{ADMIN_NAV.map((group, index) => (
				<div key={group.title ?? index} className={'admin-menu-section'}>
					<h2>{t(group.title ?? 'Admin')}</h2>
					{group.items.map((item) => {
						const active = matches(item, router.pathname);
						const badge = count(item.queue);
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`admin-menu-item ${active ? 'active' : ''}`}
								aria-current={active ? 'page' : undefined}
								onClick={onNavigate}
							>
								<span className={'icon'}>{item.icon}</span>
								<span className={'label'}>{t(item.label)}</span>
								{badge > 0 && <span className={'badge'}>{badge}</span>}
							</Link>
						);
					})}
				</div>
			))}
			{user._id && (
				<div className={'admin-menu-foot'}>
					<span className={'avatar'}>{initials(user.memberFullName)}</span>
					<span className={'who'}>
						<b>{user.memberFullName}</b>
						<small>{t('Admin')}</small>
					</span>
				</div>
			)}
		</nav>
	);
};

export default AdminMenu;
