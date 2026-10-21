import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

/** The closing band: one line, one button to the clinic search. */
const HomeCta = () => {
	const { t } = useTranslation('common');

	return (
		<section className={'home-cta'} aria-labelledby={'cta-title'}>
			<div className={'container'}>
				<div className={'cta-box'}>
					<h2 id={'cta-title'}>{t('Your Seoul clinic is one message away')}</h2>
					<p>{t('Free for patients. Confirmed by the clinic. In your language.')}</p>
					<Link href={'/clinics'} className={'cta-btn'}>
						{t('Start your search')}
						<ArrowForwardRoundedIcon />
					</Link>
				</div>
			</div>
		</section>
	);
};

export default HomeCta;
