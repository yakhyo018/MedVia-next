import React, { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Top from '../Top';
import Footer from '../Footer';
import { T } from '../../types/common';

/** Inner pages: header, a light page background with a centred container, footer. */
const withLayoutBasic = (Component: React.ComponentType<T>) => {
	const LayoutBasic = (props: T) => {
		const router = useRouter();
		const device = useDeviceDetect();
		const { t } = useTranslation('common');

		const memoizedValues = useMemo(() => {
			let title = '';

			switch (router.pathname) {
				case '/clinics':
					title = 'Find a clinic';
					break;
				case '/doctors':
					title = 'Find a doctor';
					break;
				case '/doctors/detail':
					title = 'Doctor';
					break;
				case '/clinics/detail':
					title = 'Clinic';
					break;
				case '/booking':
					title = 'Booking';
					break;
				case '/mypage/bookings':
					title = 'My Bookings';
					break;
				case '/mypage/chat':
					title = 'Consultation Chat';
					break;
				case '/notifications':
					title = 'Notifications';
					break;
				case '/account/join':
					title = 'Log in / Sign up';
					break;
				case '/_dev/ui':
					title = 'UI kit';
					break;
				default:
					break;
			}

			return { title };
		}, [router.pathname]);

		const title = memoizedValues.title ? `${t(memoizedValues.title)} | MedVia` : 'MedVia';

		return (
			<>
				<Head>
					<title>{title}</title>
					<meta name={'title'} content={title} />
				</Head>
				<Stack id={device === 'mobile' ? 'mobile-wrap' : 'pc-wrap'} className={'layout-basic'}>
					<Stack id={'top'}>
						<Top />
					</Stack>

					<Stack id={'main'}>
						<Component {...props} />
					</Stack>

					<Stack id={'footer'}>
						<Footer />
					</Stack>
				</Stack>
			</>
		);
	};

	return LayoutBasic;
};

export default withLayoutBasic;
