import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { Box, Button, Divider, Drawer, IconButton, Menu, MenuItem, Stack } from '@mui/material';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import useDeviceDetect from '../hooks/useDeviceDetect';
import { sessionReadyVar, userVar } from '../../apollo/store';
import { logOut } from '../auth';
import { LANGUAGES, REACT_APP_API_URL } from '../config';
import { MemberType } from '../enums/member.enum';
import { imageUrl, initials, shortName } from '../utils';
import Logo from './common/Logo';
import NotificationBell from './common/NotificationBell';

const Top = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
	const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
	const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
	const [scrolled, setScrolled] = useState<boolean>(false);
	const [langSheetOpen, setLangSheetOpen] = useState<boolean>(false);

	const currentLocale = router.locale ?? 'en';
	/**
	 * Each role's own area under its own name: My Page (patient), Clinic Dashboard (clinic),
	 * Doctor Panel (doctor). The admin gets "Admin" with F7; until then nothing.
	 */
	const workspaces: Partial<Record<MemberType, { href: string; label: string }>> = {
		[MemberType.USER]: { href: '/mypage', label: t('My Page') },
		[MemberType.AGENT]: { href: '/dashboard', label: t('Clinic Dashboard') },
		[MemberType.DOCTOR]: { href: '/doctor-panel', label: t('Doctor Panel') },
	};
	const workspace = user.memberType ? (workspaces[user.memberType] ?? null) : null;
	const menu = [
		{ href: '/', label: t('Home') },
		{ href: '/clinics', label: t('Clinics') },
		{ href: '/doctors', label: t('Doctors') },
		...(workspace ? [workspace] : []),
		{ href: '/community', label: t('Community') },
		{ href: '/cs', label: t('CS') },
	];

	/** LIFECYCLES **/
	useEffect(() => {
		// The header gets a soft shadow once the page moves under it.
		const changeNavbarHandler = () => setScrolled(window.scrollY > 8);
		changeNavbarHandler();
		window.addEventListener('scroll', changeNavbarHandler, { passive: true });
		return () => window.removeEventListener('scroll', changeNavbarHandler);
	}, []);

	/** HANDLERS **/
	const langChoiceHandler = async (locale: string) => {
		setLangAnchor(null);
		setLangSheetOpen(false);
		setDrawerOpen(false);
		await router.push(router.asPath, router.asPath, { locale });
	};

	const logoutHandler = async () => {
		setUserAnchor(null);
		setDrawerOpen(false);
		await logOut();
	};

	const isActive = (href: string) => (href === '/' ? router.pathname === '/' : router.pathname.startsWith(href));

	const avatar = (
		<span className={'avatar'}>
			{user.memberImage ? (
				<img src={imageUrl(user.memberImage, REACT_APP_API_URL)} alt={user.memberFullName} />
			) : (
				initials(user.memberFullName)
			)}
		</span>
	);

	const langButton = (
		<Button
			disableRipple
			className={'lang-btn'}
			onClick={(e) => setLangAnchor(e.currentTarget)}
			startIcon={<LanguageOutlinedIcon />}
			endIcon={<KeyboardArrowDownRoundedIcon />}
			aria-label={t('Language')}
		>
			{currentLocale.toUpperCase()}
		</Button>
	);

	const langMenu = (
		<Menu
			anchorEl={langAnchor}
			open={Boolean(langAnchor)}
			onClose={() => setLangAnchor(null)}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			slotProps={{ paper: { className: 'mv-lang-menu' } }}
		>
			{LANGUAGES.map((lang) => (
				<MenuItem
					key={lang.locale}
					selected={lang.locale === currentLocale}
					onClick={() => langChoiceHandler(lang.locale)}
				>
					<span className={'code'}>{lang.code}</span>
					<span className={'label'}>{lang.label}</span>
					{lang.locale === currentLocale && <CheckRoundedIcon className={'check'} />}
				</MenuItem>
			))}
			<Divider />
			<p className={'hint'}>{t('Chat translation follows this language')}</p>
		</Menu>
	);

	const currentLanguage = LANGUAGES.find((lang) => lang.locale === currentLocale);

	/** Mobile: the language list is a bottom sheet — big rows a thumb can reach. */
	const langSheet = (
		<Drawer
			anchor={'bottom'}
			open={langSheetOpen}
			onClose={() => setLangSheetOpen(false)}
			PaperProps={{ className: 'mv-lang-sheet' }}
		>
			<span className={'handle'} />
			<strong className={'title'}>{t('Language')}</strong>
			{LANGUAGES.map((lang) => (
				<button
					key={lang.locale}
					className={lang.locale === currentLocale ? 'active' : ''}
					onClick={() => langChoiceHandler(lang.locale)}
				>
					<span className={'code'}>{lang.code}</span>
					<span className={'label'}>{lang.label}</span>
					{lang.locale === currentLocale && <CheckRoundedIcon className={'check'} />}
				</button>
			))}
			<p className={'hint'}>{t('Chat translation follows this language')}</p>
		</Drawer>
	);

	if (device === 'mobile') {
		return (
			<Stack className={`top ${scrolled ? 'scrolled' : ''}`}>
				<Logo />
				<Box className={'actions'}>
					<Button
						disableRipple
						className={'lang-btn'}
						onClick={() => setLangSheetOpen(true)}
						startIcon={<LanguageOutlinedIcon />}
						endIcon={<KeyboardArrowDownRoundedIcon />}
						aria-label={t('Language')}
					>
						{currentLocale.toUpperCase()}
					</Button>
					{langSheet}
					{user._id && <NotificationBell mobile />}
					<IconButton aria-label={t('Menu')} onClick={() => setDrawerOpen(true)}>
						<MenuRoundedIcon />
					</IconButton>
				</Box>
				<Drawer anchor={'right'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
					<Stack className={'mv-drawer'}>
						{sessionReady && user._id ? (
							<Box className={'drawer-user'}>
								{avatar}
								<div>
									<strong>{user.memberFullName}</strong>
									<span>{user.memberEmail}</span>
								</div>
							</Box>
						) : (
							<Stack className={'drawer-auth'}>
								<Button variant={'contained'} fullWidth onClick={() => router.push('/account/join?mode=signup')}>
									{t('Sign up')}
								</Button>
								<Button variant={'outlined'} fullWidth onClick={() => router.push('/account/join')}>
									{t('Log in')}
								</Button>
							</Stack>
						)}
						<nav>
							{menu.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={isActive(item.href) ? 'active' : ''}
									onClick={() => setDrawerOpen(false)}
								>
									{item.label}
								</Link>
							))}
						</nav>
						<button
							className={'drawer-lang'}
							onClick={() => {
								setDrawerOpen(false);
								setLangSheetOpen(true);
							}}
						>
							<LanguageOutlinedIcon />
							<span>{t('Language')}</span>
							<em>{currentLanguage?.label}</em>
						</button>
						{user._id && (
							<Button className={'drawer-logout'} startIcon={<LogoutRoundedIcon />} onClick={logoutHandler}>
								{t('Log out')}
							</Button>
						)}
					</Stack>
				</Drawer>
			</Stack>
		);
	} else {
		return (
			<Stack className={'navbar'}>
				<Stack className={`navbar-main ${scrolled ? 'scrolled' : ''}`}>
					<Stack className={'container'}>
						<Box component={'div'} className={'logo-box'}>
							<Logo />
						</Box>
						<Box component={'nav'} className={'router-box'}>
							{menu.map((item) => (
								<Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''}>
									{item.label}
								</Link>
							))}
						</Box>
						<Box component={'div'} className={'user-box'}>
							{langButton}
							{langMenu}
							{user._id && <NotificationBell mobile={false} />}
							{!sessionReady ? (
								<span className={'user-placeholder'} />
							) : user._id ? (
								<>
									<button
										className={'login-user'}
										aria-haspopup={'menu'}
										aria-expanded={Boolean(userAnchor)}
										onClick={(e) => setUserAnchor(e.currentTarget)}
									>
										{avatar}
										<span className={'name'}>{shortName(user.memberFullName)}</span>
										<KeyboardArrowDownRoundedIcon className={'caret'} />
									</button>
									<Menu
										anchorEl={userAnchor}
										open={Boolean(userAnchor)}
										onClose={() => setUserAnchor(null)}
										anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
										transformOrigin={{ vertical: 'top', horizontal: 'right' }}
										slotProps={{ paper: { className: 'mv-user-menu' } }}
									>
										<Box className={'menu-head'}>
											<strong>{user.memberFullName}</strong>
											<span>{user.memberEmail}</span>
										</Box>
										<Divider />
										{workspace && (
											<MenuItem onClick={() => router.push(workspace.href)}>
												<PersonOutlineRoundedIcon />
												{workspace.label}
											</MenuItem>
										)}
										<MenuItem onClick={logoutHandler}>
											<LogoutRoundedIcon />
											{t('Log out')}
										</MenuItem>
									</Menu>
								</>
							) : (
								<>
									<Link href={'/account/join'} className={'login-link'}>
										{t('Log in')}
									</Link>
									<Button variant={'contained'} onClick={() => router.push('/account/join?mode=signup')}>
										{t('Sign up')}
									</Button>
								</>
							)}
						</Box>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Top;
