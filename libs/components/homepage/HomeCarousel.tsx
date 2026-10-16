import { ReactNode, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { Box, IconButton } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';
import type { NavigationOptions } from 'swiper/types';
import 'swiper/css';
import 'swiper/css/pagination';

interface HomeCarouselProps {
	/** The band's title, read out for the carousel region. */
	label: string;
	/** Cards in view on a wide screen (2 from 768 px; one and a bit on a phone). */
	perView: number;
	/** A phone shows one card and the edge of the next: its width in px. */
	slideWidth: number;
	items: { key: string; node: ReactNode }[];
}

/**
 * nestar-next's home carousels (TopAgents, TopProperties), on Swiper 11: arrows beside the row
 * on desktop, swipe + dots on a phone. Our own buttons (MUI), so Swiper's arrow CSS is not loaded.
 */
const HomeCarousel = (props: HomeCarouselProps) => {
	const { label, perView, slideWidth, items } = props;
	const { t } = useTranslation('common');
	const prevRef = useRef<HTMLButtonElement>(null);
	const nextRef = useRef<HTMLButtonElement>(null);

	return (
		<Box className={'home-carousel'} style={{ ['--slide-width' as string]: `${slideWidth}px` }}>
			<IconButton ref={prevRef} className={'carousel-nav prev'} aria-label={t('Previous')}>
				<ChevronLeftRoundedIcon />
			</IconButton>
			<Swiper
				modules={[Navigation, Pagination, Keyboard, A11y]}
				slidesPerView={'auto'}
				spaceBetween={12}
				slidesOffsetBefore={16}
				slidesOffsetAfter={16}
				breakpoints={{
					768: { slidesPerView: 2, spaceBetween: 20, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
					1100: { slidesPerView: perView, spaceBetween: 20, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
				}}
				pagination={{ clickable: true }}
				keyboard={{ enabled: true, onlyInViewport: true }}
				a11y={{ containerMessage: label, prevSlideMessage: t('Previous'), nextSlideMessage: t('Next') }}
				onBeforeInit={(swiper) => {
					// The buttons live outside <Swiper>; hand them over before Navigation starts.
					const navigation = swiper.params.navigation as NavigationOptions;
					navigation.prevEl = prevRef.current;
					navigation.nextEl = nextRef.current;
				}}
				navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
			>
				{items.map((item) => (
					<SwiperSlide key={item.key}>{item.node}</SwiperSlide>
				))}
			</Swiper>
			<IconButton ref={nextRef} className={'carousel-nav next'} aria-label={t('Next')}>
				<ChevronRightRoundedIcon />
			</IconButton>
		</Box>
	);
};

export default HomeCarousel;
