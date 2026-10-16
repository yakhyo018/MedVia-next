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
				case '/mypage':
					title = 'My Page';
					break;
				case '/mypage/bookings':
					title = 'My Bookings';
					break;
				case '/mypage/medical':
					title = 'Medical data & consent';
					break;
				case '/mypage/favorites':
					title = 'My Favorites';
					break;
				case '/mypage/recent':
					title = 'Recently Visited';
					break;
				case '/mypage/followings':
					title = 'My Followings';
					break;
				case '/mypage/reviews':
					title = 'My Reviews';
					break;
				case '/mypage/reviews/write':
					title = 'Write a verified review';
					break;
				case '/mypage/profile':
					title = 'My Profile';
					break;
				case '/mypage/chat':
					title = 'Consultation Chat';
					break;
				case '/dashboard':
					title = 'Clinic Dashboard';
					break;
				case '/dashboard/bookings':
					title = 'Bookings';
					break;
				case '/dashboard/schedule':
					title = 'Schedule & Slots';
					break;
				case '/dashboard/chat':
					title = 'Consultations';
					break;
				case '/dashboard/treatments':
					title = 'Treatments';
					break;
				case '/dashboard/treatments/edit':
					title = 'Treatments';
					break;
				case '/dashboard/doctors':
					title = 'Doctors';
					break;
				case '/dashboard/reviews':
					title = 'Reviews';
					break;
				case '/dashboard/profile':
					title = 'Clinic Profile';
					break;
				case '/doctor-panel':
					title = 'Doctor Panel';
					break;
				case '/doctor-panel/reviews':
					title = 'Review Replies';
					break;
				case '/community':
					title = 'Community';
					break;
				case '/community/detail':
					title = 'Community';
					break;
				case '/community/write':
					title = 'Write a post';
					break;
				case '/cs':
					title = 'Help center';
					break;
				case '/cs/notice':
					title = 'Notices';
					break;
				case '/cs/inquiry':
					title = '1:1 Inquiry';
					break;
				case '/doctor-panel/qna':
					title = 'Q&A Answers';
					break;
				case '/doctor-panel/articles':
					title = 'My Articles';
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
