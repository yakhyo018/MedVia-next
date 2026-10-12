import React from 'react';
import Head from 'next/head';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Top from '../Top';
import Footer from '../Footer';
import { T } from '../../types/common';

/** Pages that own the whole width (chat, schedules): header, the page edge to edge, footer. */
const withLayoutFull = (Component: React.ComponentType<T>) => {
	const LayoutFull = (props: T) => {
		const device = useDeviceDetect();

		return (
			<>
				<Head>
					<title>MedVia</title>
					<meta name={'title'} content={'MedVia'} />
				</Head>
				<Stack id={device === 'mobile' ? 'mobile-wrap' : 'pc-wrap'} className={'layout-full'}>
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

	return LayoutFull;
};

export default withLayoutFull;
