import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Button, CircularProgress, MenuItem, Switch, TextField } from '@mui/material';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { Treatment } from '../../types/treatment/treatment';
import { Doctor } from '../../types/doctor/doctor';
import { Language } from '../../enums/common.enum';
import { LANGUAGES, localeToLanguage } from '../../config';
import { formatKrw, seoulClock, seoulDays } from '../../utils';
import useAvailableSlots from '../../hooks/useAvailableSlots';

/** The date strip: two weeks ahead (the clinics open slots at most 60 days ahead). */
const DAYS_AHEAD = 14;

export interface BookingRequest {
	doctorId: string;
	slotStart: string;
	interpreter?: Language;
}

interface BookingCardProps {
	clinicName: string;
	treatments: Treatment[];
	doctors: Doctor[];
	interpreterLangs: Language[];
	treatmentId: string;
	/** '' = any available doctor. */
	doctorId: string;
	/** The doctor whose page the patient came from (`?doctor=`), if any. */
	fromDoctorId?: string;
	requesting: boolean;
	onTreatmentChange: (treatmentId: string) => void;
	onDoctorChange: (doctorId: string) => void;
	onRequest: (request: BookingRequest) => void;
}

/**
 * "Book an appointment": the sticky card on desktop, the bottom sheet on mobile.
 * Treatment → doctor → Seoul day → free time → Request booking (the page holds the slot).
 */
const BookingCard = (props: BookingCardProps) => {
	const {
		clinicName,
		treatments,
		doctors,
		interpreterLangs,
		treatmentId,
		doctorId,
		fromDoctorId,
		requesting,
		onTreatmentChange,
		onDoctorChange,
		onRequest,
	} = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const days = useMemo(() => seoulDays(DAYS_AHEAD, router.locale), [router.locale]);
	const [dateKey, setDateKey] = useState<string>(days[0].key);
	const [pickedStart, setPickedStart] = useState<string>('');
	const [withInterpreter, setWithInterpreter] = useState<boolean>(true);

	const treatment = treatments.find((item) => item._id === treatmentId);
	// Only the doctors who perform the chosen treatment; a treatment without doctor chips takes anyone.
	const performerIds = treatment?.doctors?.map((doctor) => doctor._id) ?? [];
	const doctorOptions = performerIds.length ? doctors.filter((doctor) => performerIds.includes(doctor._id)) : doctors;
	const fromDoctor = doctors.find((doctor) => doctor._id === fromDoctorId);
	const askDoctors = doctorId ? [doctorId] : doctorOptions.map((doctor) => doctor._id);
	const { times, loading, error } = useAvailableSlots(treatmentId, askDoctors, dateKey);
	const picked = times.find((time) => time.start === pickedStart);

	// The interpreter the patient can ask for: the site language, if this clinic has one for it.
	const siteLang = localeToLanguage(router.locale);
	const offeredInterpreter = interpreterLangs.includes(siteLang) ? siteLang : undefined;
	const interpreterLabels = interpreterLangs.map((code) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code);
	const month = days.find((day) => day.key === dateKey)?.month ?? '';

	/** HANDLERS **/
	const dayHandler = (key: string) => {
		setDateKey(key);
		setPickedStart('');
	};

	const treatmentHandler = (id: string) => {
		setPickedStart('');
		onTreatmentChange(id);
	};

	const doctorHandler = (id: string) => {
		setPickedStart('');
		onDoctorChange(id);
	};

	const requestHandler = () => {
		if (!picked) return;
		onRequest({
			doctorId: picked.doctorId,
			slotStart: picked.start,
			interpreter: offeredInterpreter && withInterpreter ? offeredInterpreter : undefined,
		});
	};

	const pickedDoctor = picked && !doctorId ? doctors.find((doctor) => doctor._id === picked.doctorId) : undefined;

	return (
		<Box className={'booking-card'}>
			<div className={'title'}>
				<h2>{t('Book an appointment')}</h2>
				<span>{clinicName}</span>
			</div>

			{treatments.length ? (
				<>
					<TextField
						select
						fullWidth
						label={t('Treatment')}
						value={treatment ? treatmentId : ''}
						onChange={(event) => treatmentHandler(event.target.value)}
					>
						{treatments.map((item) => (
							<MenuItem key={item._id} value={item._id}>
								{item.treatmentName} · {formatKrw(item.treatmentPrice)}
							</MenuItem>
						))}
					</TextField>

					<div className={'field'}>
						<TextField
							select
							fullWidth
							label={t('Doctor')}
							value={doctorOptions.some((doctor) => doctor._id === doctorId) ? doctorId : ''}
							onChange={(event) => doctorHandler(event.target.value)}
							SelectProps={{ displayEmpty: true }}
							InputLabelProps={{ shrink: true }}
						>
							<MenuItem value={''}>{t('Any available doctor')}</MenuItem>
							{doctorOptions.map((doctor) => (
								<MenuItem key={doctor._id} value={doctor._id}>
									{t('Dr.')} {doctor.doctorName}
								</MenuItem>
							))}
						</TextField>
						{fromDoctor && doctorId === fromDoctor._id && (
							<span className={'hint'}>
								{t('From the page of {{name}}', { name: `${t('Dr.')} ${fromDoctor.doctorName}` })}
							</span>
						)}
					</div>

					<div className={'field'}>
						<div className={'label-row'}>
							<strong>{t('Date')}</strong>
							<span>{month}</span>
						</div>
						<div className={'day-strip'} role={'listbox'} aria-label={t('Date')}>
							{days.map((day) => (
								<button
									key={day.key}
									type={'button'}
									role={'option'}
									aria-selected={day.key === dateKey}
									className={day.key === dateKey ? 'selected' : ''}
									onClick={() => dayHandler(day.key)}
								>
									<span>{day.weekday}</span>
									<strong>{day.day}</strong>
								</button>
							))}
						</div>
					</div>

					<div className={'field'}>
						<div className={'label-row'}>
							<strong>{t('Time')}</strong>
							<span>{t('Seoul time')}</span>
						</div>
						{loading ? (
							<div className={'times-state'}>
								<CircularProgress size={22} />
							</div>
						) : error ? (
							<p className={'times-state'}>{error}</p>
						) : times.length ? (
							<div className={'time-grid'} role={'listbox'} aria-label={t('Time')}>
								{times.map((time) => (
									<button
										key={time.start}
										type={'button'}
										role={'option'}
										aria-selected={time.start === pickedStart}
										className={time.start === pickedStart ? 'selected' : ''}
										onClick={() => setPickedStart(time.start)}
									>
										{seoulClock(time.start)}
									</button>
								))}
							</div>
						) : (
							<p className={'times-state'}>{t('No free times on this day. Try another day.')}</p>
						)}
						{pickedDoctor && (
							<span className={'hint'}>{t('With {{name}}', { name: `${t('Dr.')} ${pickedDoctor.doctorName}` })}</span>
						)}
					</div>
				</>
			) : (
				<p className={'muted'}>{t('This clinic has no treatments listed yet.')}</p>
			)}

			{offeredInterpreter ? (
				<label className={'interpreter switch'}>
					<TranslateRoundedIcon />
					<span>
						<strong>{t('Interpreter')}</strong>
						{LANGUAGES.find((lang) => lang.code === offeredInterpreter)?.label}
					</span>
					<Switch checked={withInterpreter} onChange={(event) => setWithInterpreter(event.target.checked)} />
				</label>
			) : (
				interpreterLabels.length > 0 && (
					<div className={'interpreter'}>
						<TranslateRoundedIcon />
						<span>
							<strong>{t('Interpreter')}</strong>
							{interpreterLabels.join(', ')}
						</span>
					</div>
				)
			)}

			<div className={'total'}>
				<span>{t('Total')}</span>
				<strong>{treatment ? formatKrw(treatment.treatmentPrice) : '—'}</strong>
			</div>

			<Button
				variant={'contained'}
				size={'large'}
				fullWidth
				disabled={!picked || requesting}
				endIcon={requesting ? <CircularProgress size={18} color={'inherit'} /> : <ArrowForwardRoundedIcon />}
				onClick={requestHandler}
			>
				{t('Request booking')}
			</Button>
			<p className={'note'}>{t('We hold the time for 10 minutes while you answer a few questions.')}</p>
			<Button variant={'outlined'} fullWidth disabled endIcon={<ChatBubbleOutlineRoundedIcon />}>
				{t('Chat with clinic')}
			</Button>
			<p className={'note'}>{t('Messages are translated automatically')}</p>
		</Box>
	);
};

export default BookingCard;
