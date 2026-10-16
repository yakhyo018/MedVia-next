import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Box, IconButton, Stack } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Clinic } from '../../types/clinic/clinic';
import { Language } from '../../enums/common.enum';
import { REACT_APP_API_URL } from '../../config';
import { formatKrw, imageUrl } from '../../utils';

interface ClinicCardProps {
	clinic: Clinic;
	onLike: (clinicId: string) => void;
}

const ClinicCard = (props: ClinicCardProps) => {
	const { clinic, onLike } = props;
	const { t } = useTranslation('common');
	const href = { pathname: '/clinics/detail', query: { id: clinic._id } };
	const photo = clinic.clinicImages?.[0];
	// Every clinic speaks Korean; the card shows what a foreign patient looks for.
	const langs = (clinic.clinicLangs ?? []).filter((lang) => lang !== Language.KO);

	return (
		<Stack className={'clinic-card mv-lift'}>
			<Box className={'photo'}>
				<Link href={href} aria-label={clinic.clinicName}>
					{photo ? <img src={imageUrl(photo, REACT_APP_API_URL)} alt={clinic.clinicName} loading={'lazy'} /> : <span />}
				</Link>
				<span className={'verified'}>
					<VerifiedUserOutlinedIcon />
					{t('Verified')}
				</span>
				<IconButton
					className={`like ${clinic.meLiked ? 'liked' : ''}`}
					aria-label={t('Like')}
					aria-pressed={Boolean(clinic.meLiked)}
					onClick={() => onLike(clinic._id)}
				>
					{clinic.meLiked ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				</IconButton>
			</Box>
			<Box className={'body'}>
				<Box className={'row'}>
					{clinic.clinicSpecialty && <span className={'specialty'}>{t(`specialty.${clinic.clinicSpecialty}`)}</span>}
					<span className={'rating'}>
						<StarRoundedIcon />
						{clinic.clinicReviews ? (
							<>
								<b>{clinic.clinicRating?.toFixed(1)}</b> ({clinic.clinicReviews})
							</>
						) : (
							t('New')
						)}
					</span>
				</Box>
				<Link href={href} className={'name'}>
					{clinic.clinicName}
				</Link>
				<span className={'place'}>
					<PlaceOutlinedIcon />
					{t(`district.${clinic.clinicDistrict}`)}, {t('Seoul')}
				</span>
				<Box className={'langs'}>
					{langs.map((lang) => (
						<span key={lang} className={clinic.clinicInterpreterLangs?.includes(lang) ? 'interpreter' : ''}>
							{lang}
						</span>
					))}
				</Box>
			</Box>
			<Link href={href} className={'foot'}>
				<span>
					{clinic.clinicMinPrice ? (
						<>
							{t('From')} <b>{formatKrw(clinic.clinicMinPrice)}</b>
						</>
					) : (
						t('Prices on request')
					)}
				</span>
				<ArrowForwardRoundedIcon />
			</Link>
		</Stack>
	);
};

export default ClinicCard;
