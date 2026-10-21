import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { District } from '../../enums/clinic.enum';
import { seoulDays } from '../../utils';
import { useAllClinics, useCountUp, useHomeReviews, useMounted, useTopClinics } from './homeData';

/** Where each district sits on the stylised map, in % of the card (the title keeps the top third). */
const PIN: Record<District, { x: number; y: number }> = {
	[District.JONGNO]: { x: 40, y: 46 },
	[District.JUNG]: { x: 47, y: 56 },
	[District.MAPO]: { x: 22, y: 60 },
	[District.YONGSAN]: { x: 40, y: 70 },
	[District.SEOCHO]: { x: 56, y: 86 },
	[District.GANGNAM]: { x: 68, y: 78 },
	[District.SONGPA]: { x: 84, y: 72 },
};

/** "Doctor, hello" as patients write it, and what the clinic reads — a showcase like HeroChat. */
const GREETINGS = ['Assalomu alaykum, doktor!', 'Здравствуйте, доктор!'];
const KOREAN = '안녕하세요, 선생님!';

/** The "Why MedVia" bento: translated chat, clinics by district, the verified count, Seoul-time booking, a review. */
const WhyMedvia = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const mounted = useMounted();
	const { total } = useTopClinics();
	const clinics = useAllClinics();
	const { list: reviews } = useHomeReviews();
	const counted = useCountUp(total);
	const review = reviews.find((item) => item.reviewContent);

	const byDistrict = clinics.reduce<Partial<Record<District, number>>>((acc, clinic) => {
		const district = clinic.clinicDistrict as District | undefined;
		if (district && PIN[district]) acc[district] = (acc[district] ?? 0) + 1;
		return acc;
	}, {});
	const days = mounted ? seoulDays(7, router.locale) : [];

	return (
		<section className={'why-medvia'} aria-labelledby={'why-title'}>
			<div className={'container'}>
				<div className={'landing-head'}>
					<span className={'eyebrow'}>{t('Why MedVia')}</span>
					<h2 id={'why-title'}>{t('Everything between you and your Seoul doctor')}</h2>
					<p>{t('No agencies, no language barrier, no guessing on price.')}</p>
				</div>
				<div className={'bento'}>
					<article className={'bx wide'}>
						<h3>{t('Chat with your clinic in your language')}</h3>
						<p>
							{t(
								'Your messages go to the clinic in Korean and their answers come back in your language. AI translates them.',
							)}
						</p>
						<div className={'langs'} aria-hidden={'true'}>
							<div className={'lb'}>
								<small>{t('You write')}</small>
								<div className={'swap'}>
									<div>
										{[...GREETINGS, GREETINGS[0]].map((greeting, index) => (
											<span key={index}>{greeting}</span>
										))}
									</div>
								</div>
							</div>
							<span className={'arrow'}>
								<SwapHorizRoundedIcon />
							</span>
							<div className={'lb'}>
								<small>{t('The doctor reads')}</small>
								<span>{KOREAN}</span>
							</div>
						</div>
					</article>

					<article className={'bx map'}>
						<div className={'map-art'} aria-hidden={'true'}>
							<svg viewBox={'0 0 320 260'} preserveAspectRatio={'none'}>
								<path
									d={
										'M20 140c40-60 90-80 150-60s90 10 130-30M10 200c60-30 120-20 180 0s90 10 120-10M60 40c30 50 30 120 0 200M200 20c-20 60-10 150 30 230'
									}
								/>
							</svg>
							{(Object.keys(PIN) as District[]).map((district) => {
								const count = byDistrict[district];
								return (
									<span
										key={district}
										className={`pin ${count ? 'on' : ''}`}
										style={{ left: `${PIN[district].x}%`, top: `${PIN[district].y}%` }}
									>
										{count ? (
											<em>
												{t(`district.${district}`)} · {count}
											</em>
										) : null}
									</span>
								);
							})}
						</div>
						<div className={'text'}>
							<h3>{t('Seoul, mapped')}</h3>
							<p>{t('Every clinic pinned by district.')}</p>
						</div>
					</article>

					<article className={'bx counter'}>
						<h3>{t('Verified clinics only')}</h3>
						<p>{t('Reviewed by MedVia before listing')}</p>
						<strong className={'count'}>{total !== null ? counted : '—'}</strong>
						<span className={'bar'}>
							<i />
						</span>
					</article>

					<article className={'bx calendar'}>
						<h3>{t('Book in Seoul time')}</h3>
						<p>{t('Pick a time — the clinic confirms your request.')}</p>
						<Link href={'/clinics'} className={'days'} aria-label={t('Find clinics')}>
							{days.map((day, index) => (
								<span key={day.key} className={index === 0 ? 'today' : ''}>
									<small>{day.weekday}</small>
									{day.day}
								</span>
							))}
						</Link>
					</article>

					<article className={'bx review'}>
						{review ? (
							<>
								<blockquote>“{review.reviewContent}”</blockquote>
								<div className={'who'}>
									<span className={'face'} aria-hidden={'true'} />
									<div>
										<b>{review.patientName}</b>
										<span>
											{review.clinicName}
											{review.treatmentName && ` · ${review.treatmentName}`}
										</span>
									</div>
									<span className={'stars'} aria-label={`${review.reviewRating}/5`}>
										{Array.from({ length: review.reviewRating }).map((_, index) => (
											<StarRoundedIcon key={index} />
										))}
									</span>
								</div>
							</>
						) : (
							<blockquote className={'empty'}>{t('Verified visit')}</blockquote>
						)}
					</article>
				</div>
			</div>
		</section>
	);
};

export default WhyMedvia;
