import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { Divider, Drawer, IconButton, InputAdornment, Menu, MenuItem, Skeleton, Stack, TextField } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import AdminMenu, { findAdminPage } from '../admin/AdminMenu';
import NotificationBell from '../common/NotificationBell';
import EmptyState from '../common/EmptyState';
import { sessionReadyVar, userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { MemberType } from '../../enums/member.enum';
import { ClientMessages } from '../../config';
import { sweetLoginConfirmAlert } from '../../sweetAlert';
import { initials, shortName } from '../../utils';
import { T } from '../../types/common';
import { ADMIN_I18N, ADMIN_NS } from '../admin/adminText';

/** The pages with a search: the top bar's field writes `?text=` and the page reads it. */
const SEARCH: Record<string, string> = {
	'/_admin/users': 'Search by name or email',
	'/_admin/clinics': 'Search clinics',
	'/_admin/clinics/all': 'Search clinics',
	'/_admin/doctors': 'Search doctors',
	'/_admin/bookings': 'Search booking ID or patient',
};

/**
 * The admin panel's own frame: a side menu instead of the site
 * header, a top bar with the breadcrumb, the page's search, the bell and the admin's menu. Only
 * admins get in — a guest is asked to log in, any other account sees a short refusal.
 */
const withLayoutAdmin = (Component: React.ComponentType<T>) => {
	const LayoutAdmin = (props: T) => {
		const router = useRouter();
		const device = useDeviceDetect();
		const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
		const user = useReactiveVar(userVar);
		const sessionReady = useReactiveVar(sessionReadyVar);
		const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
		const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
		const [searchText, setSearchText] = useState<string>('');
		const mobile = device === 'mobile';
		const isAdmin = user.memberType === MemberType.ADMIN;
		const { section, page } = findAdminPage(router.pathname);
		const crumbs = [section?.label, page && page.label !== section?.label ? page.label : undefined].filter(
			(label): label is string => Boolean(label),
		);
		const searchPlaceholder = SEARCH[router.pathname];
		const title = `${crumbs.map((label) => t(label)).join(' · ') || t('Admin')} | MedVia ${t('Admin')}`;

		/** LIFECYCLES **/
		useEffect(() => {
			if (!sessionReady || user._id) return;
			sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED).then((login) =>
				router.replace(login ? { pathname: '/account/join', query: { referrer: router.asPath } } : '/'),
			);
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [sessionReady, user._id]);

		useEffect(() => {
			// Back / forward and links keep the field in step with the URL.
			setSearchText(typeof router.query.text === 'string' ? router.query.text : '');
		}, [router.query.text, router.pathname]);

		/** HANDLERS **/
		const searchHandler = async (event: React.FormEvent) => {
			event.preventDefault();
			const query = { ...router.query };
			delete query.page;
			const text = searchText.trim();
			if (text) query.text = text;
			else delete query.text;
			await router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
		};

		const logoutHandler = async () => {
			setUserAnchor(null);
			await logOut();
		};

		let body: React.ReactNode = <Component {...props} />;
		if (!user._id) body = sessionReady ? null : <Skeleton variant={'rounded'} height={360} />;
		else if (!isAdmin)
			body = (
				<EmptyState
					title={t('The admin panel is for MedVia admins.')}
					action={<Link href={'/'}>{t('Go to the site')}</Link>}
				/>
			);

		const search = searchPlaceholder && isAdmin && (
			<form className={'admin-search'} onSubmit={searchHandler} role={'search'}>
				<TextField
					size={'small'}
					fullWidth
					value={searchText}
					placeholder={t(searchPlaceholder)}
					onChange={(event) => setSearchText(event.target.value)}
					inputProps={{ 'aria-label': t(searchPlaceholder), maxLength: 100 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position={'start'}>
								<SearchRoundedIcon />
							</InputAdornment>
						),
					}}
				/>
			</form>
		);

		return (
			<>
				<Head>
					<title>{title}</title>
					<meta name={'robots'} content={'noindex'} />
				</Head>
				<Stack id={mobile ? 'mobile-wrap' : 'pc-wrap'} className={'admin-layout'}>
					{!mobile && isAdmin && (
						<aside className={'admin-side'}>
							<AdminMenu />
						</aside>
					)}
					{mobile && (
						<Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ className: 'admin-drawer' }}>
							<AdminMenu onNavigate={() => setDrawerOpen(false)} />
						</Drawer>
					)}
					<Stack className={'admin-main'}>
						<header className={'admin-top'}>
							{mobile && isAdmin && (
								<IconButton className={'admin-burger'} aria-label={t('Menu')} onClick={() => setDrawerOpen(true)}>
									<MenuRoundedIcon />
								</IconButton>
							)}
							<nav className={'admin-crumbs'} aria-label={t('Breadcrumb')}>
								{crumbs.map((label, index) => (
									<React.Fragment key={label}>
										{index > 0 && <ChevronRightRoundedIcon className={'sep'} />}
										{index === 0 && crumbs.length > 1 && section ? (
											<Link href={section.href}>{t(label)}</Link>
										) : (
											<strong>{t(label)}</strong>
										)}
									</React.Fragment>
								))}
							</nav>
							{!mobile && search}
							{user._id && <NotificationBell mobile={mobile} />}
							{user._id && (
								<>
									<button
										type={'button'}
										className={'admin-user'}
										aria-haspopup={'menu'}
										aria-expanded={Boolean(userAnchor)}
										onClick={(event) => setUserAnchor(event.currentTarget)}
									>
										<span className={'avatar'}>{initials(user.memberFullName)}</span>
										{!mobile && <span className={'name'}>{shortName(user.memberFullName)}</span>}
									</button>
									<Menu
										anchorEl={userAnchor}
										open={Boolean(userAnchor)}
										onClose={() => setUserAnchor(null)}
										anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
										transformOrigin={{ vertical: 'top', horizontal: 'right' }}
										slotProps={{ paper: { className: 'mv-user-menu' } }}
									>
										<div className={'menu-head'}>
											<strong>{user.memberFullName}</strong>
											<span>{user.memberEmail}</span>
										</div>
										<Divider />
										<MenuItem onClick={() => router.push('/')}>
											<HomeOutlinedIcon />
											{t('Go to the site')}
										</MenuItem>
										<MenuItem onClick={logoutHandler}>
											<LogoutRoundedIcon />
											{t('Log out')}
										</MenuItem>
									</Menu>
								</>
							)}
						</header>
						{mobile && search}
						<main className={'admin-content'}>{body}</main>
					</Stack>
				</Stack>
			</>
		);
	};

	return LayoutAdmin;
};

export default withLayoutAdmin;
