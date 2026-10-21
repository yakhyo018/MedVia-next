import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { initials, seoulClock } from '../../utils';
import { useHomeReviews, useMounted, useTopClinics } from './homeData';

/** The badge above the heading: how many clinics are listed and the time in Seoul right now. */
export const HeroLiveBadge = () => {
	const { t } = useTranslation('common');
	const { total } = useTopClinics();
	const mounted = useMounted();
	const [now, setNow] = useState<Date>(new Date());

	/** LIFECYCLES **/
	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 30000);
		return () => clearInterval(timer);
	}, []);

	return (
		<span className={'badge live mv-enter'}>
			<i />
			{total !== null ? `${total} ${t('clinics')}` : t('For international patients in Korea')}
			{mounted && ` · ${seoulClock(now)} ${t('Seoul time')}`}
		</span>
	);
};

/** Under the search: the latest reviewers' initials and the review count. */
export const HeroTrust = () => {
	const { t } = useTranslation('common');
	const { list, rating, reviews } = useHomeReviews();
	if (!reviews) return null;

	return (
		<div className={'hero-trust mv-enter'}>
			<span className={'faces'} aria-hidden={'true'}>
				{list.slice(0, 4).map((review) => (
					<i key={review._id}>{initials(review.patientName)}</i>
				))}
			</span>
			<span>
				<b>
					{reviews} {t('verified reviews')}
				</b>
				{rating !== null && <> · ★ {rating.toFixed(1)}/5</>}
			</span>
		</div>
	);
};
