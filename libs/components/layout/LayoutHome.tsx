import React from 'react';
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Top from '../Top';
import Footer from '../Footer';
import { T } from '../../types/common';

/** The landing page: header, full-width sections, footer. */
const withLayoutHome = (Component: React.ComponentType<T>) => {
	const LayoutHome = (props: T) => {
		const device = useDeviceDetect();
		const { t } = useTranslation('common');
		const title = `MedVia — ${t('Book trusted Korean clinics in your language')}`;

		return (
			<>
				<Head>
					<title>{title}</title>
					<meta name={'title'} content={title} />
				</Head>
				<Stack id={device === 'mobile' ? 'mobile-wrap' : 'pc-wrap'} className={'layout-home'}>
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

	return LayoutHome;
};

export default withLayoutHome;
