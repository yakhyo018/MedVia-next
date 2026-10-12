import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Skeleton, Stack } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { GET_TRENDING_TREATMENTS } from '../../../apollo/user/query';
import { TrendingTreatment } from '../../types/treatment/treatment';
import { Specialty } from '../../enums/clinic.enum';
import { formatKrw } from '../../utils';

const PHOTO: Record<Specialty, string> = {
	[Specialty.DERMATOLOGY]: '/img/treatments/dermatology.jpg',
	[Specialty.PLASTIC_SURGERY]: '/img/treatments/plastic-surgery.jpg',
	[Specialty.DENTAL]: '/img/treatments/dental.jpg',
	[Specialty.CHECK_UP]: '/img/treatments/check-up.jpg',
};

/** "What international patients book most this month" — a card opens the clinics that offer it. */
const TrendingTreatments = () => {
	const { t } = useTranslation('common');
	const { data, loading, error } = useQuery(GET_TRENDING_TREATMENTS, {
		variables: { limit: 4 },
		fetchPolicy: 'cache-and-network',
	});
	const list: TrendingTreatment[] = data?.getTrendingTreatments ?? [];

	// Nothing to show (an empty demo or the API down): the landing page simply goes on.
	if (error || (!loading && list.length === 0)) return null;

	return (
		<Stack className={'trending-treatments'} component={'section'} aria-labelledby={'trending-title'}>
			<Stack className={'container'}>
				<Box className={'section-head'}>
					<div>
						<h2 id={'trending-title'}>{t('Trending treatments')}</h2>
						<p>{t('What international patients book most this month')}</p>
					</div>
					<Link href={'/clinics'} className={'see-all'}>
						{t('See all clinics')}
						<ArrowForwardRoundedIcon />
					</Link>
				</Box>
				<Box className={'trending-grid'}>
					{list.length === 0
						? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant={'rounded'} height={280} />)
						: list.map((item, index) => (
								<Link
									key={item.treatmentName}
									href={{ pathname: '/clinics', query: { treatment: item.treatmentName } }}
									className={'trending-card mv-lift mv-enter'}
									style={{ ['--mv-delay' as string]: `${index * 60}ms` }}
								>
									<div className={'photo'}>
										<img src={PHOTO[item.specialty]} alt={''} loading={'lazy'} />
										{item.bookings > 0 && (
											<span className={'badge'}>
												<TrendingUpRoundedIcon />
												{item.bookings} {t('booked this month')}
											</span>
										)}
									</div>
									<div className={'body'}>
										<span className={'specialty'}>{t(`specialty.${item.specialty}`)}</span>
										<strong>{item.treatmentName}</strong>
										<span className={'price'}>
											{t('From')} <b>{formatKrw(item.minPrice)}</b>
										</span>
										<span className={'clinics'}>
											{item.clinics} {t('clinics')}
										</span>
									</div>
								</Link>
							))}
				</Box>
			</Stack>
		</Stack>
	);
};

export default TrendingTreatments;
