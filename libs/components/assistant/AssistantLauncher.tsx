import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { Drawer } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import AssistantPanel from './AssistantPanel';
import { sessionReadyVar, userVar } from '../../../apollo/store';
import { MemberType } from '../../enums/member.enum';
import { ClientMessages } from '../../config';
import { sweetLoginConfirmAlert } from '../../sweetAlert';

/** Pages without the button: their own full-screen flows (admin, login, the booking form, chat). */
const HIDDEN = ['/_admin', '/_dev', '/account', '/booking', '/mypage/chat', '/dashboard', '/doctor-panel'];

/**
 * "Ask MedVia AI": a floating button for patients and guests on the public pages and My Page.
 * A patient opens the assistant panel (right side on a computer, full screen on a phone); a
 * guest is asked to log in first. Clinic, doctor and admin accounts never see it — the API
 * serves the assistant to patients only.
 */
const AssistantLauncher = () => {
	const router = useRouter();
	const device = useDeviceDetect();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [open, setOpen] = useState<boolean>(false);
	const mobile = device === 'mobile';
	const hidden = HIDDEN.some((path) => router.pathname === path || router.pathname.startsWith(`${path}/`));
	const allowed = !user._id || user.memberType === MemberType.USER;

	/** LIFECYCLES **/
	useEffect(() => {
		// A logout (or another account) closes the panel.
		if (!allowed) setOpen(false);
	}, [allowed]);

	/** HANDLERS **/
	const openHandler = async () => {
		if (!user._id) {
			const login = await sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED);
			if (login) await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
			return;
		}
		setOpen(true);
	};

	if (!sessionReady || !allowed || (hidden && !open)) return null;

	return (
		<>
			{!open && (
				<button
					type={'button'}
					className={`assistant-fab ${mobile ? 'mobile' : ''}`}
					aria-label={t('Ask MedVia AI')}
					onClick={openHandler}
				>
					<AutoAwesomeRoundedIcon />
					{!mobile && <span>{t('Ask MedVia AI')}</span>}
				</button>
			)}
			<Drawer
				anchor={'right'}
				open={open}
				onClose={() => setOpen(false)}
				PaperProps={{ className: `assistant-drawer ${mobile ? 'mobile' : ''}` }}
			>
				{open && <AssistantPanel onClose={() => setOpen(false)} />}
			</Drawer>
		</>
	);
};

export default AssistantLauncher;
