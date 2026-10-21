import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { GET_TRENDING_TREATMENTS } from '../../../apollo/user/query';
import { TrendingTreatment } from '../../types/treatment/treatment';
import { formatKrw } from '../../utils';
import { TREATMENT_PHOTO } from './TrendingTreatments';

/** "What patients fly in for": the month's most booked treatments as tall photo cards. */
const FlyInTreatments = () => {
	const { t } = useTranslation('common');
	const { data, error } = useQuery(GET_TRENDING_TREATMENTS, {
		variables: { limit: 4 },
		fetchPolicy: 'cache-and-network',
	});
	const list: TrendingTreatment[] = data?.getTrendingTreatments ?? [];

	if (error || list.length === 0) return null;

	return (
		<section className={'fly-in'} aria-labelledby={'fly-title'}>
			<div className={'container'}>
				<div className={'landing-head'}>
					<span className={'eyebrow'}>{t('Trending treatments')}</span>
					<h2 id={'fly-title'}>{t('What patients fly in for')}</h2>
				</div>
				<div className={'fly-grid'}>
					{list.map((item, index) => (
						<Link
							key={item.treatmentName}
							href={{ pathname: '/clinics', query: { treatment: item.treatmentName } }}
							className={'fly-card'}
						>
							<span
								className={'bg'}
								style={{
									backgroundImage: `url(${TREATMENT_PHOTO[item.specialty]})`,
									animationDelay: `-${index * 1.5}s`,
								}}
							/>
							<em>
								{item.clinics} {t('clinics')}
							</em>
							<span className={'go'}>
								<ArrowOutwardRoundedIcon />
							</span>
							<span className={'tx'}>
								<strong>{item.treatmentName}</strong>
								<span>
									{t('From')} {formatKrw(item.minPrice)}
								</span>
							</span>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
};

export default FlyInTreatments;
