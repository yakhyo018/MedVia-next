import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Box, Stack } from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutHome from '../libs/components/layout/LayoutHome';
import HeroSearch from '../libs/components/homepage/HeroSearch';
import HeroChat from '../libs/components/homepage/HeroChat';
import HeroWords from '../libs/components/homepage/HeroWords';
import HeroFloatCards from '../libs/components/homepage/HeroFloatCards';
import HeroMarquee from '../libs/components/homepage/HeroMarquee';
import { HeroLiveBadge, HeroTrust } from '../libs/components/homepage/HeroParts';
import WhyMedvia from '../libs/components/homepage/WhyMedvia';
import FlyInTreatments from '../libs/components/homepage/FlyInTreatments';
import HomeCta from '../libs/components/homepage/HomeCta';
import { T } from '../libs/types/common';
import { IMAGES } from '../libs/config';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const Home: NextPage = () => {
	const device = useDeviceDetect();
	const { t } = useTranslation('common');

	const heading = (
		<Box className={'hero-text'}>
			<HeroLiveBadge />
			<h1 className={'mv-enter'}>
				{t('Book trusted Korean clinics')} <HeroWords />
			</h1>
			<p className={'mv-enter'}>
				{t(
					'Compare verified dermatology, aesthetic, dental and check-up clinics in Seoul. Real prices, reviews from real visits, and a chat that translates for you.',
				)}
			</p>
		</Box>
	);

	if (device === 'mobile') {
		return (
			<Stack className={'home-page'}>
				<Stack className={'hero'}>
					<Stack className={'container'}>
						{heading}
						<Box className={'hero-media'}>
							<img src={IMAGES.hero.src} alt={t('Hero photo · doctor with patient')} className={'mv-enter-zoom'} />
							<span className={'verified-chip mv-enter'}>
								<VerifiedUserOutlinedIcon />
								{t('Verified clinics only')}
							</span>
							<HeroChat compact />
						</Box>
						<HeroSearch />
						<HeroTrust />
					</Stack>
				</Stack>
				<WhyMedvia />
				<FlyInTreatments />
				<HomeCta />
			</Stack>
		);
	} else {
		return (
			<Stack className={'home-page'}>
				<Stack className={'hero'}>
					<Stack className={'container'}>
						<Stack className={'left'}>
							{heading}
							<HeroSearch />
							<HeroTrust />
						</Stack>
						<Stack className={'right'}>
							<Box className={'photo mv-enter-zoom'}>
								<img src={IMAGES.hero.src} alt={t('Hero photo · doctor with patient')} />
							</Box>
							<Box className={'verified-card'}>
								<span className={'icon'}>
									<VerifiedUserOutlinedIcon />
								</span>
								<div>
									<strong>{t('Verified clinics only')}</strong>
									<span>{t('Reviewed by MedVia before listing')}</span>
								</div>
							</Box>
							<HeroChat />
							<HeroFloatCards />
						</Stack>
					</Stack>
					<HeroMarquee />
				</Stack>
				<WhyMedvia />
				<FlyInTreatments />
				<HomeCta />
			</Stack>
		);
	}
};

export default withLayoutHome(Home);
