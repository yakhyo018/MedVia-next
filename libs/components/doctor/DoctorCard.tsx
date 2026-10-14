import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Box, Stack } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Doctor } from '../../types/doctor/doctor';
import { REACT_APP_API_URL } from '../../config';
import { formatCount, imageUrl, initials } from '../../utils';

interface DoctorCardProps {
	doctor: Doctor;
	/** When given, the likes counter is a button (My Favorites: tap the heart to remove). */
	onLike?: (doctorId: string) => void;
}

const DoctorCard = (props: DoctorCardProps) => {
	const { doctor, onLike } = props;
	const { t } = useTranslation('common');
	const href = { pathname: '/doctors/detail', query: { id: doctor._id } };
	const hasRating = Boolean(doctor.doctorReviews);

	return (
		<Stack className={'doctor-card mv-lift'}>
			<Link href={href} className={'photo'} aria-label={doctor.doctorName}>
				{doctor.doctorImage ? (
					<img src={imageUrl(doctor.doctorImage, REACT_APP_API_URL)} alt={doctor.doctorName} />
				) : (
					<span>{initials(doctor.doctorName)}</span>
				)}
			</Link>
			<Box className={'info'}>
				<Link href={href} className={'name'}>
					{t('Dr.')} {doctor.doctorName}
				</Link>
				{doctor.doctorNameKo && <span className={'name-ko'}>{doctor.doctorNameKo}</span>}
				<span className={'specialty'}>{t(`specialty.${doctor.doctorSpecialty}`)}</span>
				<span className={'clinic'}>{doctor.clinicData?.clinicName}</span>
			</Box>
			<Box className={'langs'}>
				{doctor.doctorLangs.map((lang) => (
					<span key={lang}>{lang}</span>
				))}
			</Box>
			<Box className={'stats'}>
				<span className={'rating'} title={t('Rating')}>
					<StarRoundedIcon />
					{hasRating ? (
						<>
							<b>{doctor.doctorRating?.toFixed(1)}</b> ({doctor.doctorReviews})
						</>
					) : (
						t('New')
					)}
				</span>
				{onLike ? (
					<button
						type={'button'}
						className={'like-stat'}
						title={t('Like')}
						aria-pressed={Boolean(doctor.meLiked)}
						onClick={() => onLike(doctor._id)}
					>
						{doctor.meLiked ? <FavoriteRoundedIcon className={'liked'} /> : <FavoriteBorderRoundedIcon />}
						{formatCount(doctor.doctorLikes)}
					</button>
				) : (
					<span title={t('Likes')}>
						{doctor.meLiked ? <FavoriteRoundedIcon className={'liked'} /> : <FavoriteBorderRoundedIcon />}
						{formatCount(doctor.doctorLikes)}
					</span>
				)}
				<span title={t('Views')}>
					<VisibilityOutlinedIcon />
					{formatCount(doctor.doctorViews)}
				</span>
			</Box>
			<Link href={href} className={'profile-btn'}>
				{t('View profile')}
			</Link>
		</Stack>
	);
};

export default DoctorCard;
