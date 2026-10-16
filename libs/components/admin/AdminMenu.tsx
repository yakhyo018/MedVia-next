import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
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
import Logo from '../common/Logo';
import { ADMIN_I18N, ADMIN_NS } from './adminText';

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

interface AdminMenuProps {
	/** A phone's drawer closes when a link is chosen. */
	onNavigate?: () => void;
}

/** The admin's side menu: the open section shows its sub-pages, as in the mockup. */
const AdminMenu = (props: AdminMenuProps) => {
	const { onNavigate } = props;
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const { section: current, page } = findAdminPage(router.pathname);

	return (
		<nav className={'admin-menu'} aria-label={t('Admin')}>
			<div className={'admin-logo'}>
				<Logo href={'/_admin'} />
			</div>
			<h2>{t('Admin')}</h2>
			{ADMIN_MENU.map((section) => {
				const open = section === current;
				return (
					<div key={section.href} className={'admin-menu-section'}>
						<Link
							href={section.href}
							className={`admin-menu-item ${open ? 'active' : ''}`}
							aria-current={open && !page ? 'page' : undefined}
							onClick={onNavigate}
						>
							<span className={'icon'}>{section.icon}</span>
							{t(section.label)}
						</Link>
						{open &&
							section.sub.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className={`admin-menu-sub ${link === page ? 'active' : ''}`}
									aria-current={link === page ? 'page' : undefined}
									onClick={onNavigate}
								>
									{t(link.label)}
								</Link>
							))}
					</div>
				);
			})}
		</nav>
	);
};

export default AdminMenu;
