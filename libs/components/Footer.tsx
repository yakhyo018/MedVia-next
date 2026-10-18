import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Box, Stack } from '@mui/material';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import useDeviceDetect from '../hooks/useDeviceDetect';
import Logo from './common/Logo';
import { SUPPORT } from '../config';

const Footer = () => {
	const device = useDeviceDetect();
	const { t } = useTranslation('common');
	const year = new Date().getFullYear();

	const popular = ['Laser toning', 'Skin booster', 'Dental scaling', 'Health check-up'];
	const quickLinks = [
		{ label: 'Terms of Use', href: '/cs?tab=terms' },
		{ label: 'Privacy Policy', href: '/cs?tab=privacy' },
		{ label: 'Medical Ad Policy', href: '/cs?tab=ads' },
		{ label: 'Contact Support', href: '/cs?tab=inquiry' },
		{ label: 'FAQs', href: '/cs' },
	];

	const columns = (
		<>
			<Box component={'div'} className={'footer-box brand'}>
				<Logo />
				<div className={'contact'}>
					<span className={'icon'}>
						<PhoneOutlinedIcon />
					</span>
					<div>
						<span>{t('Total free customer care')}</span>
						<a href={SUPPORT.phoneHref}>
							<strong>{SUPPORT.phone}</strong>
						</a>
					</div>
				</div>
				<div className={'contact'}>
					<span className={'icon'}>
						<MailOutlineRoundedIcon />
					</span>
					<div>
						<span>{t('Need live support?')}</span>
						<a href={`mailto:${SUPPORT.email}`}>
							<strong>{SUPPORT.email}</strong>
						</a>
					</div>
				</div>
			</Box>
			<Box component={'div'} className={'footer-box'}>
				<strong>{t('Portfolio project')}</strong>
				<p>{t('Clinics, doctors, prices and reviews on MedVia are fictional sample data.')}</p>
			</Box>
			<Box component={'div'} className={'footer-box'}>
				<strong>{t('Popular search')}</strong>
				{popular.map((item) => (
					<Link key={item} href={{ pathname: '/clinics', query: { text: item } }}>
						{t(item)}
					</Link>
				))}
			</Box>
			<Box component={'div'} className={'footer-box'}>
				<strong>{t('Quick links')}</strong>
				{quickLinks.map((item) => (
					<Link key={item.label} href={item.href}>
						{t(item.label)}
					</Link>
				))}
			</Box>
		</>
	);

	if (device === 'mobile') {
		return (
			<Stack className={'footer-container'}>
				<Stack className={'main'}>{columns}</Stack>
				<Stack className={'second'}>
					<span>
						© {year} MedVia · {t('All rights reserved')}
					</span>
				</Stack>
			</Stack>
		);
	} else {
		return (
			<Stack className={'footer-container'}>
				<Stack className={'container'}>
					<Stack className={'main'}>{columns}</Stack>
					<Stack className={'second'}>
						<span>
							© {year} MedVia - {t('All rights reserved')}
						</span>
						<span>
							{t('Privacy')} · {t('Terms')} · {t('Sitemap')}
						</span>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Footer;
