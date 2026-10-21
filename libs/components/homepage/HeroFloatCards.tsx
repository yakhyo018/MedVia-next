import { useTranslation } from 'next-i18next';

/**
 * Two glass cards around the hero photo (desktop): a pulse line for check-ups and a booking that
 * confirms itself. Showcase only, like HeroChat — no numbers that would pass for real data.
 */
const HeroFloatCards = () => {
	const { t } = useTranslation('common');

	return (
		<>
			<div className={'hero-float pulse-card'} aria-hidden={'true'}>
				<span className={'label'}>{t('Health check-up')}</span>
				<svg viewBox={'0 0 184 44'} width={184} height={44}>
					<path
						d={'M0 26h46l8-14 10 26 8-18 6 6h106'}
						fill={'none'}
						strokeWidth={2.6}
						strokeLinecap={'round'}
						strokeLinejoin={'round'}
					/>
				</svg>
			</div>
			<div className={'hero-float booking-card'} aria-hidden={'true'}>
				<span className={'check'}>
					<svg viewBox={'0 0 22 22'} width={22} height={22}>
						<path
							d={'M5 11.5l4 4 8-9'}
							fill={'none'}
							strokeWidth={2.6}
							strokeLinecap={'round'}
							strokeLinejoin={'round'}
						/>
					</svg>
				</span>
				<span className={'text'}>
					<strong>{t('Booking confirmed')}</strong>
					<span>10:30 · {t('Seoul time')}</span>
				</span>
			</div>
		</>
	);
};

export default HeroFloatCards;
