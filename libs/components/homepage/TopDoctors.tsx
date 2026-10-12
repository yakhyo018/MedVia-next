import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Skeleton } from '@mui/material';
import { GET_DOCTORS } from '../../../apollo/user/query';
import { Doctor } from '../../types/doctor/doctor';
import { DoctorsInquiry } from '../../types/doctor/doctor.input';
import { Direction } from '../../enums/common.enum';
import DoctorCard from '../doctor/DoctorCard';
import HomeSection from './HomeSection';

/**
 * nestar-next's TopAgents pattern: the public list, sorted, four of it — no new API.
 * doctorScore (the batch's RANK), not doctorRating: one 5-star review must not top the list.
 */
const INPUT: DoctorsInquiry = { page: 1, limit: 4, sort: 'doctorScore', direction: Direction.DESC, search: {} };

const TopDoctors = () => {
	const { t } = useTranslation('common');
	const { data, loading, error } = useQuery(GET_DOCTORS, {
		variables: { input: INPUT },
		fetchPolicy: 'cache-and-network',
	});
	const list: Doctor[] = data?.getDoctors?.list ?? [];

	if (error || (!loading && list.length === 0)) return null;

	return (
		<HomeSection
			id={'top-doctors'}
			title={t('Recommended doctors')}
			text={t('Verified reviews, recent visits and followers together · they speak your language')}
			link={{ href: '/doctors', label: t('See all doctors') }}
		>
			<Box className={'home-grid'}>
				{list.length === 0
					? Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} variant={'rounded'} height={330} />)
					: list.map((doctor, index) => (
							<Box key={doctor._id} className={'mv-enter'} style={{ ['--mv-delay' as string]: `${index * 60}ms` }}>
								<DoctorCard doctor={doctor} />
							</Box>
						))}
			</Box>
		</HomeSection>
	);
};

export default TopDoctors;
