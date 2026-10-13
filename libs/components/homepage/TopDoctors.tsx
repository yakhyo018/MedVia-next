import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Skeleton } from '@mui/material';
import { GET_DOCTORS } from '../../../apollo/user/query';
import { Doctor } from '../../types/doctor/doctor';
import { DoctorsInquiry } from '../../types/doctor/doctor.input';
import { Direction } from '../../enums/common.enum';
import DoctorCard from '../doctor/DoctorCard';
import HomeSection from './HomeSection';
import HomeCarousel from './HomeCarousel';

/**
 * nestar-next's TopAgents pattern: the public list, sorted, eight of it in a carousel — no new API.
 * doctorScore (the batch's RANK), not doctorRating: one 5-star review must not top the list.
 */
const INPUT: DoctorsInquiry = { page: 1, limit: 8, sort: 'doctorScore', direction: Direction.DESC, search: {} };

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
			{list.length === 0 ? (
				<Box className={'home-grid'}>
					{Array.from({ length: 4 }).map((_, index) => (
						<Skeleton key={index} variant={'rounded'} height={330} />
					))}
				</Box>
			) : (
				<HomeCarousel
					label={t('Recommended doctors')}
					perView={4}
					slideWidth={270}
					items={list.map((doctor) => ({ key: doctor._id, node: <DoctorCard doctor={doctor} /> }))}
				/>
			)}
		</HomeSection>
	);
};

export default TopDoctors;
