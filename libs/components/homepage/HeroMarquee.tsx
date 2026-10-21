import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { GET_CLINICS } from '../../../apollo/user/query';
import { Clinic } from '../../types/clinic/clinic';
import { TOP_CLINICS_INPUT } from './TopClinics';

/**
 * The top clinics' names gliding under the hero. Same query and variables as TopClinics, so
 * Apollo answers both from one request. The list is drawn twice for a seamless loop.
 */
const HeroMarquee = () => {
	const { t } = useTranslation('common');
	const { data } = useQuery(GET_CLINICS, { variables: { input: TOP_CLINICS_INPUT }, fetchPolicy: 'cache-first' });
	const list: Clinic[] = data?.getClinics?.list ?? [];

	if (list.length === 0) return null;

	const row = (copy: number) => (
		<div className={'set'} aria-hidden={copy > 0 ? 'true' : undefined}>
			{list.map((clinic) => (
				<Link
					key={`${copy}-${clinic._id}`}
					href={`/clinics/detail?id=${clinic._id}`}
					tabIndex={copy > 0 ? -1 : undefined}
				>
					{clinic.clinicName}
				</Link>
			))}
		</div>
	);

	return (
		<nav className={'hero-marquee'} aria-label={t('Recommended clinics')}>
			<div className={'track'} style={{ animationDuration: `${list.length * 4}s` }}>
				{row(0)}
				{row(1)}
			</div>
		</nav>
	);
};

export default HeroMarquee;
