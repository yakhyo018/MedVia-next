import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Box, Stack } from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import useDeviceDetect from '../libs/hooks/useDeviceDetect';
import withLayoutHome from '../libs/components/layout/LayoutHome';
import HeroSearch from '../libs/components/homepage/HeroSearch';
import HeroChat from '../libs/components/homepage/HeroChat';
import TrendingTreatments from '../libs/components/homepage/TrendingTreatments';
import TopClinics from '../libs/components/homepage/TopClinics';
import TopDoctors from '../libs/components/homepage/TopDoctors';
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
			<span className={'badge mv-enter'}>
				<i />
				{t('For international patients in Korea')}
			</span>
			<h1 className={'mv-enter'}>
				{t('Book trusted Korean clinics')} <em>{t('in your language')}</em>.
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
					</Stack>
				</Stack>
				<TopClinics />
				<TrendingTreatments />
				<TopDoctors />
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
						</Stack>
					</Stack>
				</Stack>
				<TopClinics />
				<TrendingTreatments />
				<TopDoctors />
			</Stack>
		);
	}
};

export default withLayoutHome(Home);
