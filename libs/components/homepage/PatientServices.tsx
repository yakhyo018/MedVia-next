import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Box } from '@mui/material';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import HomeSection from './HomeSection';

/**
 * The mockup's "Events and promotions" band. The API has no events, so it shows what MedVia
 * really does — static text from i18n, each card opening a filtered clinic list. No invented offers.
 */
const CARDS = [
	{
		key: 'interpreters',
		tone: 'teal',
		icon: <TranslateRoundedIcon />,
		chip: 'Interpreters',
		title: 'Clinics with Russian, Uzbek and Kazakh interpreters',
		text: 'Filter clinics by the language you speak and see who brings an interpreter to your visit.',
		href: '/clinics?interpreter=1',
		action: 'Find clinics',
	},
	{
		key: 'prices',
		tone: 'light',
		icon: <VerifiedUserOutlinedIcon />,
		chip: 'Clear prices',
		title: 'Every price in won, before you book',
		text: 'Verified clinics list each treatment with its price, so you can compare them side by side.',
		href: '/clinics?sort=price',
		action: 'Compare prices',
	},
];

const PatientServices = () => {
	const { t } = useTranslation('common');

	return (
		<HomeSection
			id={'patient-services'}
			title={t('For international patients')}
			text={t('What MedVia does for you before and after you book')}
		>
			<Box className={'service-grid'}>
				{CARDS.map((card) => (
					<article key={card.key} className={`service-card ${card.tone}`}>
						<span className={'chip'}>
							{card.icon}
							{t(card.chip)}
						</span>
						<h3>{t(card.title)}</h3>
						<p>{t(card.text)}</p>
						<Link href={card.href} className={'action'}>
							{t(card.action)}
							<ArrowForwardRoundedIcon />
						</Link>
					</article>
				))}
			</Box>
		</HomeSection>
	);
};

export default PatientServices;
