import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { Skeleton, Stack } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ListBanner from '../common/ListBanner';
import EmptyState from '../common/EmptyState';
import { sessionReadyVar, userVar } from '../../../apollo/store';
import { MemberType } from '../../enums/member.enum';
import { ClientMessages } from '../../config';
import { sweetLoginConfirmAlert } from '../../sweetAlert';

export interface WorkspaceFrameProps {
	/** The section's own name: the page head and the breadcrumb's last item. */
	title: string;
	text?: string;
	/** Something on the right of the page head (e.g. "Clear history"). */
	action?: ReactNode;
	/** Extra class on the content column: the section's own styles hang on it. */
	className?: string;
	/** The phone's back link; `null` for none. Defaults to the area's home. */
	back?: { href: string; label: string } | null;
	/** Leave out the page head (a full-screen chat room on a phone). */
	bare?: boolean;
	children: ReactNode;
}

interface WorkspaceProps extends WorkspaceFrameProps {
	/** The area's home: "My Page" → /mypage, "Clinic Dashboard" → /dashboard. */
	home: { href: string; label: string };
	/** Who may use the area. */
	memberType: MemberType;
	/** Shown to a signed-in account of another type. */
	deniedText: string;
	/** The computer's side menu. */
	side: ReactNode;
	/** Above the page head on a phone (the clinic's section tabs); MyPage lists them on its overview. */
	mobileNav?: ReactNode;
	/** Above the page head everywhere (e.g. "Your clinic is under review"). */
	notice?: ReactNode;
}

/**
 * A signed-in area — MyPage, the Clinic Dashboard, the Doctor Panel: the teal band and the side
 * menu on a computer, a back link on a phone. It also guards the area: a guest is asked to log
 * in and comes back; another account type gets `deniedText`.
 */
const WorkspaceFrame = (props: WorkspaceProps) => {
	const { title, text, action, className = '', back, bare = false, children } = props;
	const { home, memberType, deniedText, side, mobileNav, notice } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const mobile = device === 'mobile';
	const atHome = router.pathname === home.href;
	// With section tabs on the phone a link back home is noise; an explicit `back` still shows.
	const backLink = back === undefined ? (mobileNav ? null : home) : back;
	const allowed = Boolean(user._id) && user.memberType === memberType;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!sessionReady || user._id) return;
		sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED).then((login) =>
			router.replace(login ? { pathname: '/account/join', query: { referrer: router.asPath } } : '/'),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionReady, user._id]);

	let body: ReactNode = children;
	// While the session is being restored the page keeps its height (no footer jumping up).
	if (!user._id) body = sessionReady ? null : <Skeleton variant={'rounded'} height={360} />;
	else if (!allowed) body = <EmptyState title={deniedText} />;

	const head = !bare && (
		<>
			{mobile && !atHome && backLink && (
				<Link href={backLink.href} className={'my-page-back'}>
					<ChevronLeftRoundedIcon />
					{backLink.label}
				</Link>
			)}
			{allowed && notice}
			<div className={'page-head'}>
				<div>
					<h1>{title}</h1>
					{text && <p>{text}</p>}
				</div>
				{action}
			</div>
		</>
	);

	if (mobile) {
		return (
			<Stack className={'my-page'}>
				<Stack className={'container my-page-body'}>
					<Stack className={`my-page-main ${className}`}>
						{allowed && !bare && mobileNav}
						{head}
						{body}
					</Stack>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack className={'my-page'}>
			<ListBanner crumb={atHome ? home.label : title} parent={atHome ? undefined : home} title={home.label} />
			<Stack className={'container my-page-body'}>
				{allowed && side}
				<Stack className={`my-page-main ${className}`}>
					{head}
					{body}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default WorkspaceFrame;
