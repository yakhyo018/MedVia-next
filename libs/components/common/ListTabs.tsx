import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box } from '@mui/material';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import { COUNT_CLINICS, COUNT_DOCTORS } from '../../../apollo/user/query';

interface ListTabsProps {
	active: 'clinics' | 'doctors';
}

/** "Clinics 15 | Doctors 40": switches between the two public lists; totals without filters. */
const ListTabs = (props: ListTabsProps) => {
	const { active } = props;
	const { t } = useTranslation('common');
	const total = { input: { page: 1, limit: 1 } };
	const { data: clinicsData } = useQuery(COUNT_CLINICS, { variables: total, fetchPolicy: 'cache-first' });
	const { data: doctorsData } = useQuery(COUNT_DOCTORS, { variables: total, fetchPolicy: 'cache-first' });
	const count = (data: { [key: string]: { metaCounter?: { total?: number }[] } } | undefined, key: string) =>
		data?.[key]?.metaCounter?.[0]?.total;

	const tabs = [
		{
			key: 'clinics',
			href: '/clinics',
			label: t('Clinics'),
			icon: <ApartmentOutlinedIcon />,
			n: count(clinicsData, 'getClinics'),
		},
		{
			key: 'doctors',
			href: '/doctors',
			label: t('Doctors'),
			icon: <MedicalServicesOutlinedIcon />,
			n: count(doctorsData, 'getDoctors'),
		},
	];

	return (
		<Box className={'list-tabs'} component={'nav'} aria-label={t('Clinics') + ' / ' + t('Doctors')}>
			{tabs.map((tab) => (
				<Link
					key={tab.key}
					href={tab.href}
					className={tab.key === active ? 'active' : ''}
					aria-current={tab.key === active ? 'page' : undefined}
				>
					{tab.icon}
					{tab.label}
					{tab.n !== undefined && <span>{tab.n}</span>}
				</Link>
			))}
		</Box>
	);
};

export default ListTabs;
