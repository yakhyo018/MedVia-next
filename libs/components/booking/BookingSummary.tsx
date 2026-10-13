import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box } from '@mui/material';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { Clinic } from '../../types/clinic/clinic';
import { Treatment } from '../../types/treatment/treatment';
import { Language } from '../../enums/common.enum';
import { LANGUAGES, REACT_APP_API_URL } from '../../config';
import { formatKrw, imageUrl, initials, seoulClock, seoulTime } from '../../utils';

interface BookingSummaryProps {
	clinic: Clinic;
	treatment: Treatment;
	doctorName: string;
	slotStart: string;
	interpreter?: Language;
	/** The hold's end; the timer runs only while the request is not sent. */
	holdUntil?: string;
	onExpire?: () => void;
	/** After sending: a status line instead of the timer. */
	status?: string;
}

/** mm:ss left until `until`; calls onExpire once when it reaches zero. */
const useCountdown = (until: string | undefined, onExpire?: () => void): string => {
	const [left, setLeft] = useState<number>(() => (until ? new Date(until).getTime() - Date.now() : 0));

	useEffect(() => {
		if (!until) return;
		const end = new Date(until).getTime();
		const tick = () => {
			const ms = end - Date.now();
			setLeft(ms);
			if (ms <= 0) {
				window.clearInterval(timer);
				onExpire?.();
			}
		};
		const timer = window.setInterval(tick, 1000);
		tick();
		return () => window.clearInterval(timer);
		// onExpire is a fresh function each render; the timer depends on `until` only.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [until]);

	const seconds = Math.max(0, Math.floor(left / 1000));
	return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

/** The right column of /booking (a card on top on mobile): what is being booked, and the hold timer. */
const BookingSummary = (props: BookingSummaryProps) => {
	const { clinic, treatment, doctorName, slotStart, interpreter, holdUntil, onExpire, status } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const left = useCountdown(holdUntil, onExpire);
	const photo = clinic.clinicImages?.[0];
	const interpreterLabel = LANGUAGES.find((lang) => lang.code === interpreter)?.label;

	return (
		<Box className={'booking-summary'}>
			<div className={'clinic'}>
				<span className={'photo'}>
					{photo ? <img src={imageUrl(photo, REACT_APP_API_URL)} alt={''} /> : initials(clinic.clinicName)}
				</span>
				<span>
					<strong>{clinic.clinicName}</strong>
					<em>
						{t(`district.${clinic.clinicDistrict}`)}, {t('Seoul')}
					</em>
				</span>
			</div>
			<dl>
				<div>
					<dt>{t('Doctor')}</dt>
					<dd>
						{t('Dr.')} {doctorName}
					</dd>
				</div>
				<div>
					<dt>{t('Treatment')}</dt>
					<dd>
						{treatment.treatmentName} · {treatment.treatmentDuration} {t('min')}
					</dd>
				</div>
				<div>
					<dt>{t('Date & time')}</dt>
					<dd>
						{seoulTime(slotStart, router.locale, false)} · {seoulClock(slotStart)}
					</dd>
				</div>
				<div>
					<dt>{t('Interpreter')}</dt>
					<dd>{interpreterLabel ?? t('Not needed')}</dd>
				</div>
			</dl>
			<div className={'total'}>
				<span>{t('Total')}</span>
				<strong>{formatKrw(treatment.treatmentPrice)}</strong>
			</div>
			{status ? (
				<p className={'status'}>{status}</p>
			) : (
				holdUntil && (
					<p className={'timer'} role={'timer'} aria-live={'off'}>
						<TimerOutlinedIcon />
						<span>
							<strong>{t('Time held for you · {{left}} left', { left })}</strong>
							{t('Finish the steps before the timer ends')}
						</span>
					</p>
				)
			)}
		</Box>
	);
};

export default BookingSummary;
