import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import FaceRetouchingNaturalOutlinedIcon from '@mui/icons-material/FaceRetouchingNaturalOutlined';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { LANGUAGES, REACT_APP_API_URL } from '../../config';
import { imageUrl, initials } from '../../utils';

export interface MyMenuItem {
	href: string;
	label: string;
	icon: ReactNode;
}

export interface MyMenuGroup {
	title: string;
	items: MyMenuItem[];
}

/** The MyPage sections, in the mockup's order. The overview sits on its own above the groups. */
export const MY_MENU: MyMenuGroup[] = [
	{
		title: 'Bookings',
		items: [
			{ href: '/mypage/bookings', label: 'My Bookings', icon: <CalendarMonthOutlinedIcon /> },
			{ href: '/mypage/chat', label: 'Consultation Chat', icon: <ChatBubbleOutlineRoundedIcon /> },
			{ href: '/mypage/medical', label: 'Medical data & consent', icon: <VerifiedUserOutlinedIcon /> },
			{ href: '/mypage/face-scan', label: 'Face scan', icon: <FaceRetouchingNaturalOutlinedIcon /> },
		],
	},
	{
		title: 'Activity',
		items: [
			{ href: '/mypage/favorites', label: 'My Favorites', icon: <FavoriteBorderRoundedIcon /> },
			{ href: '/mypage/recent', label: 'Recently Visited', icon: <HistoryRoundedIcon /> },
			{ href: '/mypage/followings', label: 'My Followings', icon: <GroupOutlinedIcon /> },
			{ href: '/mypage/reviews', label: 'My Reviews', icon: <StarBorderRoundedIcon /> },
		],
	},
	{
		title: 'Account',
		items: [{ href: '/mypage/profile', label: 'My Profile', icon: <PersonOutlineRoundedIcon /> }],
	},
];

interface MyMenuProps {
	/** 'side': the desktop sidebar card. 'list': the phone overview's grouped rows, with badges. */
	variant: 'side' | 'list';
	/** Small counters next to a row, keyed by href (e.g. upcoming bookings). */
	badges?: Record<string, string>;
}

/** The MyPage menu: who is signed in, then every MyPage section; the current one highlighted. */
const MyMenu = (props: MyMenuProps) => {
	const { variant, badges = {} } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const lang = LANGUAGES.find((item) => item.code === user.memberLang)?.label;
	const isActive = (href: string) =>
		href === '/mypage' ? router.pathname === '/mypage' : router.pathname.startsWith(href);

	const logoutHandler = async () => {
		await logOut();
	};

	const row = (item: MyMenuItem) => (
		<Link
			key={item.href}
			href={item.href}
			className={`my-menu-item ${isActive(item.href) ? 'active' : ''}`}
			aria-current={isActive(item.href) ? 'page' : undefined}
		>
			<span className={'icon'}>{item.icon}</span>
			<span className={'label'}>{t(item.label)}</span>
			{badges[item.href] && <span className={'badge'}>{badges[item.href]}</span>}
			{variant === 'list' && <ChevronRightRoundedIcon className={'chevron'} />}
		</Link>
	);

	if (variant === 'list') {
		return (
			<nav className={'my-menu list'} aria-label={t('My Page')}>
				{MY_MENU.map((group) => (
					<section key={group.title}>
						<h2>{t(group.title)}</h2>
						<div className={'group'}>
							{group.items.map(row)}
							{group.title === 'Account' && (
								<button type={'button'} className={'my-menu-item logout'} onClick={logoutHandler}>
									<span className={'icon'}>
										<LogoutRoundedIcon />
									</span>
									<span className={'label'}>{t('Log out')}</span>
								</button>
							)}
						</div>
					</section>
				))}
			</nav>
		);
	}

	return (
		<nav className={'my-menu side'} aria-label={t('My Page')}>
			<div className={'who'}>
				<span className={'avatar'}>
					{user.memberImage ? (
						<img src={imageUrl(user.memberImage, REACT_APP_API_URL)} alt={''} />
					) : (
						initials(user.memberFullName)
					)}
				</span>
				<strong>{user.memberFullName}</strong>
				<span>
					{t('Patient')}
					{lang ? ` · ${lang}` : ''}
				</span>
			</div>
			<h2>{t('Overview')}</h2>
			{row({ href: '/mypage', label: 'My Page', icon: <HomeOutlinedIcon /> })}
			{MY_MENU.map((group) => (
				<div key={group.title} className={'group'}>
					<h2>{t(group.title)}</h2>
					{group.items.map(row)}
				</div>
			))}
			<button type={'button'} className={'my-menu-item logout'} onClick={logoutHandler}>
				<span className={'icon'}>
					<LogoutRoundedIcon />
				</span>
				<span className={'label'}>{t('Log out')}</span>
			</button>
		</nav>
	);
};

export default MyMenu;
