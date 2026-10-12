import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	InputAdornment,
	Skeleton,
	Stack,
	Tab,
	Tabs,
	TextField,
} from '@mui/material';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import StatusChip from '../../libs/components/common/StatusChip';
import EmptyState from '../../libs/components/common/EmptyState';
import {
	sweetBasicAlert,
	sweetConfirmAlert,
	sweetDangerConfirmAlert,
	sweetErrorAlert,
	sweetLoginConfirmAlert,
	sweetMixinErrorAlert,
	sweetMixinSuccessAlert,
	sweetTopSmallSuccessAlert,
	sweetTopSuccessAlert,
} from '../../libs/sweetAlert';
import { Messages } from '../../libs/config';
import { formatKrw, seoulTime } from '../../libs/utils';
import { updateUserInfo } from '../../libs/auth';
import { T } from '../../libs/types/common';

/** Development only: every shared UI variant on one page, to compare with MedVia-design. */
export const getStaticProps = async ({ locale }: T) => {
	if (process.env.NODE_ENV === 'production') return { notFound: true };
	return {
		props: {
			...(await serverSideTranslations(locale, ['common'])),
		},
	};
};

const STATUSES = ['CONFIRMED', 'ACTIVE', 'PENDING', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'EXPIRED'];

const DevUi: NextPage = () => {
	const router = useRouter();
	const [tab, setTab] = useState<number>(0);
	const [lastResult, setLastResult] = useState<string>('');

	/** HANDLERS **/
	const confirmHandler = async () => {
		const ok = await sweetConfirmAlert('Send this booking request to the clinic?', 'Send request');
		setLastResult(`sweetConfirmAlert → ${ok}`);
	};

	const dangerHandler = async () => {
		const ok = await sweetDangerConfirmAlert('Cancel this booking? The clinic will be notified.', 'Cancel booking');
		setLastResult(`sweetDangerConfirmAlert → ${ok}`);
	};

	const loginHandler = async () => {
		const ok = await sweetLoginConfirmAlert('Please log in first!');
		setLastResult(`sweetLoginConfirmAlert → ${ok}`);
		if (ok) await router.push(`/account/join?referrer=${encodeURIComponent(router.asPath)}`);
	};

	/** An authenticated query: with an expired token it shows the refresh-and-retry in the network tab. */
	const profileHandler = async () => {
		try {
			await updateUserInfo();
			setLastResult('getMyProfile → ok');
		} catch (err) {
			setLastResult(`getMyProfile → ${(err as Error).message}`);
		}
	};

	const section = (title: string, children: React.ReactNode) => (
		<Box className={'ui-section'}>
			<h3>{title}</h3>
			<div className={'ui-row'}>{children}</div>
		</Box>
	);

	return (
		<Stack className={'dev-ui-page'}>
			<Stack className={'container'}>
				<h2>UI kit</h2>
				<p className={'hint'}>Development only — not built in production. Last result: {lastResult || '—'}</p>

				{section(
					'Buttons',
					<>
						<Button variant={'contained'}>Primary</Button>
						<Button variant={'contained'} endIcon={<ArrowForwardRoundedIcon />}>
							Log in
						</Button>
						<Button variant={'outlined'}>Outlined</Button>
						<Button variant={'contained'} color={'error'}>
							Danger
						</Button>
						<Button variant={'contained'} size={'small'}>
							Small
						</Button>
						<Button variant={'outlined'} size={'small'}>
							Small outlined
						</Button>
						<Button variant={'contained'} disabled>
							Disabled
						</Button>
						<Button variant={'contained'} disabled endIcon={<CircularProgress size={18} color={'inherit'} />}>
							Loading
						</Button>
					</>,
				)}

				{section(
					'Pills',
					<>
						<Chip label={'Skin booster'} variant={'outlined'} clickable />
						<Chip label={'Laser toning'} color={'primary'} clickable />
						<Chip label={'Dental implant'} variant={'outlined'} onDelete={() => undefined} />
					</>,
				)}

				{section(
					'Status chips',
					<>
						{STATUSES.map((status) => (
							<StatusChip key={status} status={status} />
						))}
					</>,
				)}

				{section(
					'Fields',
					<Box className={'ui-fields'}>
						<TextField placeholder={'name@example.com'} />
						<TextField
							placeholder={'With icon'}
							InputProps={{
								startAdornment: (
									<InputAdornment position={'start'}>
										<MailOutlineRoundedIcon />
									</InputAdornment>
								),
							}}
						/>
						<TextField value={'not-an-email'} error helperText={'Please enter a valid email address!'} />
					</Box>,
				)}

				{section(
					'Tabs',
					<Tabs value={tab} onChange={(_, value) => setTab(value)}>
						<Tab label={'Upcoming'} />
						<Tab label={'Past'} />
						<Tab label={'Cancelled'} />
					</Tabs>,
				)}

				{section(
					'Alerts',
					<>
						<Button variant={'contained'} onClick={confirmHandler}>
							Confirm
						</Button>
						<Button variant={'contained'} color={'error'} onClick={dangerHandler}>
							Danger confirm
						</Button>
						<Button variant={'outlined'} onClick={() => sweetMixinErrorAlert(Messages.WRONG_CREDENTIALS)}>
							Error
						</Button>
						<Button variant={'outlined'} onClick={() => sweetErrorAlert(Messages.SOMETHING_WENT_WRONG)}>
							Error (5s)
						</Button>
						<Button variant={'outlined'} onClick={() => sweetMixinSuccessAlert('Your account is ready!')}>
							Success
						</Button>
						<Button variant={'outlined'} onClick={() => sweetTopSuccessAlert('Saved!')}>
							Top success
						</Button>
						<Button variant={'outlined'} onClick={() => sweetTopSmallSuccessAlert('Welcome back!')}>
							Toast
						</Button>
						<Button variant={'outlined'} onClick={loginHandler}>
							Login prompt
						</Button>
						<Button variant={'outlined'} onClick={() => sweetBasicAlert('Clinic sign-up opens soon.')}>
							Basic
						</Button>
					</>,
				)}

				{section(
					'Session',
					<Button variant={'outlined'} onClick={profileHandler}>
						getMyProfile
					</Button>,
				)}

				{section(
					'Loading',
					<>
						<CircularProgress />
						<Box className={'ui-skeletons'}>
							<Skeleton variant={'rounded'} height={140} />
							<Skeleton width={'70%'} />
							<Skeleton width={'40%'} />
						</Box>
					</>,
				)}

				{section(
					'Empty state',
					<EmptyState
						title={'No bookings yet'}
						text={'Find a clinic and pick a time — your requests will show up here.'}
						action={<Button variant={'contained'}>Find a clinic</Button>}
					/>,
				)}

				{section(
					'Formatting',
					<code>
						{formatKrw(99000)} · {seoulTime('2026-10-12T05:00:00Z', router.locale)} (05:00 UTC → Seoul)
					</code>,
				)}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(DevUi);
