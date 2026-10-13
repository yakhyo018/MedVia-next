import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Box } from '@mui/material';
import { REACT_APP_API_URL } from '../../config';
import { imageUrl } from '../../utils';

interface ClinicGalleryProps {
	images: string[];
	name: string;
	/** Mobile: one swipeable row with a "1 / 5" counter instead of the photo grid. */
	mobile?: boolean;
}

/** The desktop mockup shows five photos; a clinic may have fewer, so the grid follows the count. */
const MAX_PHOTOS = 5;

const ClinicGallery = (props: ClinicGalleryProps) => {
	const { images, name, mobile = false } = props;
	const { t } = useTranslation('common');
	const [current, setCurrent] = useState<number>(0);
	const photos = images.slice(0, MAX_PHOTOS);

	/** HANDLERS **/
	const scrollHandler = (event: React.UIEvent<HTMLDivElement>) => {
		const strip = event.currentTarget;
		const slide = strip.firstElementChild as HTMLElement | null;
		if (!slide) return;
		setCurrent(Math.round(strip.scrollLeft / (slide.offsetWidth + 8)));
	};

	if (!photos.length) return null;

	if (mobile) {
		return (
			<Box className={'clinic-gallery mobile'} component={'section'} aria-label={t('Clinic photos')}>
				<div className={'strip'} onScroll={scrollHandler}>
					{photos.map((photo, index) => (
						<img
							key={photo}
							src={imageUrl(photo, REACT_APP_API_URL)}
							alt={`${name} — ${t('photo')} ${index + 1}`}
							loading={index ? 'lazy' : 'eager'}
						/>
					))}
				</div>
				{photos.length > 1 && (
					<span className={'counter'}>
						{Math.min(current + 1, photos.length)} / {photos.length}
					</span>
				)}
			</Box>
		);
	}

	return (
		<Box className={`clinic-gallery count-${photos.length}`} component={'section'} aria-label={t('Clinic photos')}>
			{photos.map((photo, index) => (
				<img
					key={photo}
					src={imageUrl(photo, REACT_APP_API_URL)}
					alt={`${name} — ${t('photo')} ${index + 1}`}
					loading={index ? 'lazy' : 'eager'}
				/>
			))}
		</Box>
	);
};

export default ClinicGallery;
