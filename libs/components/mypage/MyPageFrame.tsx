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
import MyMenu from './MyMenu';
import { sessionReadyVar, userVar } from '../../../apollo/store';
import { MemberType } from '../../enums/member.enum';
import { ClientMessages } from '../../config';
import { sweetLoginConfirmAlert } from '../../sweetAlert';

interface MyPageFrameProps {
	/** The section's own name: the page head and the breadcrumb's last item. */
	title: string;
	text?: string;
	/** Something on the right of the page head (e.g. "Clear history"). */
	action?: ReactNode;
	/** Extra class on the content column: the section's own styles hang on it. */
	className?: string;
	/** The phone's "‹ My Page" link; the overview itself has none. */
	back?: { href: string; label: string } | null;
	/** Leave out the page head (a full-screen chat room on a phone). */
	bare?: boolean;
	children: ReactNode;
}

/**
 * Every MyPage section sits in this frame: the teal band and the side menu on a computer, a back
 * link on a phone (the overview lists the sections there). It also guards the area: a guest is
 * asked to log in and comes back; a clinic, doctor or admin account has no patient pages.
 */
const MyPageFrame = (props: MyPageFrameProps) => {
	const { title, text, action, className = '', back, bare = false, children } = props;
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const mobile = device === 'mobile';
	const overview = router.pathname === '/mypage';
	const backLink = back === undefined ? { href: '/mypage', label: t('My Page') } : back;

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
	else if (user.memberType !== MemberType.USER) body = <EmptyState title={t('My Page is for patient accounts.')} />;

	const head = !bare && (
		<>
			{mobile && !overview && backLink && (
				<Link href={backLink.href} className={'my-page-back'}>
					<ChevronLeftRoundedIcon />
					{backLink.label}
				</Link>
			)}
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
						{head}
						{body}
					</Stack>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack className={'my-page'}>
			<ListBanner
				crumb={overview ? t('My Page') : title}
				parent={overview ? undefined : { href: '/mypage', label: t('My Page') }}
				title={t('My Page')}
			/>
			<Stack className={'container my-page-body'}>
				{user._id && user.memberType === MemberType.USER && <MyMenu variant={'side'} />}
				<Stack className={`my-page-main ${className}`}>
					{head}
					{body}
				</Stack>
			</Stack>
		</Stack>
	);
};

export default MyPageFrame;
