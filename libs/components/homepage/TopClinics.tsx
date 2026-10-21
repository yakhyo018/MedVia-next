import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Skeleton } from '@mui/material';
import { GET_CLINICS } from '../../../apollo/user/query';
import { Clinic } from '../../types/clinic/clinic';
import { ClinicsInquiry } from '../../types/clinic/clinic.input';
import { Direction } from '../../enums/common.enum';
import { LikeGroup } from '../../enums/like.enum';
import useLikeTarget from '../../hooks/useLikeTarget';
import ClinicCard from '../clinic/ClinicCard';
import HomeSection from './HomeSection';
import HomeCarousel from './HomeCarousel';

/**
 * nestar-next's TopProperties pattern: the public list, sorted, eight of it in a carousel — no new API.
 * Sorted by clinicScore (the batch's RANK: rating weighed by how many reviews it stands on),
 * not by clinicRating, where one 5-star review would beat forty 4.8 ones.
 */
export const TOP_CLINICS_INPUT: ClinicsInquiry = { page: 1, limit: 8, sort: 'clinicScore', direction: Direction.DESC };

const TopClinics = () => {
	const { t } = useTranslation('common');
	const likeHandler = useLikeTarget();
	const { data, loading, error } = useQuery(GET_CLINICS, {
		variables: { input: TOP_CLINICS_INPUT },
		fetchPolicy: 'cache-and-network',
	});
	const list: Clinic[] = data?.getClinics?.list ?? [];

	if (error || (!loading && list.length === 0)) return null;

	return (
		<HomeSection
			id={'top-clinics'}
			title={t('Recommended clinics')}
			text={t('Verified reviews, recent visits and followers together · every clinic reviewed by MedVia')}
			link={{ href: '/clinics', label: t('See all clinics') }}
		>
			{list.length === 0 ? (
				<Box className={'home-grid'}>
					{Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index} variant={'rounded'} height={340} />
					))}
				</Box>
			) : (
				<HomeCarousel
					label={t('Recommended clinics')}
					perView={4}
					slideWidth={270}
					items={list.map((clinic) => ({
						key: clinic._id,
						node: <ClinicCard clinic={clinic} onLike={(id) => likeHandler(LikeGroup.CLINIC, id)} />,
					}))}
				/>
			)}
		</HomeSection>
	);
};

export default TopClinics;
