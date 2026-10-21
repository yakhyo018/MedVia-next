import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CLINICS, GET_REVIEWS } from '../../../apollo/user/query';
import { Clinic } from '../../types/clinic/clinic';
import { ClinicsInquiry } from '../../types/clinic/clinic.input';
import { Review, ReviewsInquiry } from '../../types/review/review';
import { Direction } from '../../enums/common.enum';
import { TOP_CLINICS_INPUT } from './TopClinics';

/**
 * The landing page's data, shared by its parts. The same query + variables in several components
 * is one request: Apollo answers the rest from its cache.
 */
export const HOME_REVIEWS_INPUT: ReviewsInquiry = { page: 1, limit: 6 };
/** Every listed clinic (for the district map); the API caps the page size if it must. */
export const ALL_CLINICS_INPUT: ClinicsInquiry = { page: 1, limit: 50, sort: 'clinicScore', direction: Direction.DESC };

export const useTopClinics = () => {
	const { data } = useQuery(GET_CLINICS, { variables: { input: TOP_CLINICS_INPUT }, fetchPolicy: 'cache-first' });
	return {
		list: (data?.getClinics?.list ?? []) as Clinic[],
		total: (data?.getClinics?.metaCounter?.[0]?.total ?? null) as number | null,
	};
};

export const useAllClinics = (): Clinic[] => {
	const { data } = useQuery(GET_CLINICS, { variables: { input: ALL_CLINICS_INPUT }, fetchPolicy: 'cache-first' });
	return data?.getClinics?.list ?? [];
};

export const useHomeReviews = () => {
	const { data } = useQuery(GET_REVIEWS, { variables: { input: HOME_REVIEWS_INPUT }, fetchPolicy: 'cache-first' });
	return {
		list: (data?.getReviews?.list ?? []) as Review[],
		rating: (data?.getReviews?.summary?.rating ?? null) as number | null,
		reviews: (data?.getReviews?.summary?.reviews ?? null) as number | null,
	};
};

/** Anything that depends on "now" renders after mount: the page is static, built at another time. */
export const useMounted = (): boolean => {
	const [mounted, setMounted] = useState<boolean>(false);
	useEffect(() => setMounted(true), []);
	return mounted;
};

/** 0 → target once, eased; at once with reduced motion. */
export const useCountUp = (target: number | null, duration = 1400): number => {
	const [value, setValue] = useState<number>(0);
	useEffect(() => {
		if (target === null) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setValue(target);
		let frame = 0;
		const start = performance.now();
		const tick = (now: number) => {
			const progress = Math.min(1, (now - start) / duration);
			setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
			if (progress < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [target, duration]);
	return value;
};
