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

/**
 * nestar-next's TopProperties pattern: the public list, sorted, four of it — no new API.
 * Sorted by clinicScore (the batch's RANK: rating weighed by how many reviews it stands on),
 * not by clinicRating, where one 5-star review would beat forty 4.8 ones.
 */
const INPUT: ClinicsInquiry = { page: 1, limit: 4, sort: 'clinicScore', direction: Direction.DESC };

const TopClinics = () => {
	const { t } = useTranslation('common');
	const likeHandler = useLikeTarget();
	const { data, loading, error } = useQuery(GET_CLINICS, {
		variables: { input: INPUT },
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
			<Box className={'home-grid'}>
				{list.length === 0
					? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant={'rounded'} height={340} />)
					: list.map((clinic, index) => (
							<Box key={clinic._id} className={'mv-enter'} style={{ ['--mv-delay' as string]: `${index * 60}ms` }}>
								<ClinicCard clinic={clinic} onLike={(id) => likeHandler(LikeGroup.CLINIC, id)} />
							</Box>
						))}
			</Box>
		</HomeSection>
	);
};

export default TopClinics;
