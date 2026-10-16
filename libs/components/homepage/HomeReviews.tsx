import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Skeleton } from '@mui/material';
import { GET_REVIEWS } from '../../../apollo/user/query';
import { Review, ReviewsInquiry } from '../../types/review/review';
import ReviewCard from '../review/ReviewCard';
import HomeSection from './HomeSection';
import HomeCarousel from './HomeCarousel';

/** The newest published reviews of any clinic: three in view, nine in the carousel. */
const INPUT: ReviewsInquiry = { page: 1, limit: 9 };

const HomeReviews = () => {
	const { t } = useTranslation('common');
	const { data, loading, error } = useQuery(GET_REVIEWS, {
		variables: { input: INPUT },
		fetchPolicy: 'cache-and-network',
	});
	const list: Review[] = data?.getReviews?.list ?? [];

	if (error || (!loading && list.length === 0)) return null;

	return (
		<HomeSection
			id={'home-reviews'}
			title={t('Verified reviews')}
			text={t('Written only after a completed visit')}
			tone={'tint'}
		>
			{list.length === 0 ? (
				<Box className={'home-grid'}>
					{Array.from({ length: 3 }).map((_, index) => (
						<Skeleton key={index} variant={'rounded'} height={230} />
					))}
				</Box>
			) : (
				<Box className={'home-reviews'}>
					<HomeCarousel
						label={t('Verified reviews')}
						perView={3}
						slideWidth={290}
						items={list.map((review) => ({ key: review._id, node: <ReviewCard review={review} /> }))}
					/>
				</Box>
			)}
		</HomeSection>
	);
};

export default HomeReviews;
