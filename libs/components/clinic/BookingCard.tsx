import { useTranslation } from 'next-i18next';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { Treatment } from '../../types/treatment/treatment';
import { Doctor } from '../../types/doctor/doctor';
import { Language } from '../../enums/common.enum';
import { LANGUAGES } from '../../config';
import { formatKrw } from '../../utils';

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
	onTreatmentChange: (treatmentId: string) => void;
	onDoctorChange: (doctorId: string) => void;
}

/**
 * "Book an appointment": the sticky card on desktop, the bottom sheet on mobile.
 * F1 picks the treatment and the doctor; dates, the hold and the request come with F2.
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
		onTreatmentChange,
		onDoctorChange,
	} = props;
	const { t } = useTranslation('common');
	const treatment = treatments.find((item) => item._id === treatmentId);
	// Only the doctors who perform the chosen treatment; a treatment without doctor chips takes anyone.
	const performerIds = treatment?.doctors?.map((doctor) => doctor._id) ?? [];
	const doctorOptions = performerIds.length ? doctors.filter((doctor) => performerIds.includes(doctor._id)) : doctors;
	const fromDoctor = doctors.find((doctor) => doctor._id === fromDoctorId);
	const interpreterLabels = interpreterLangs.map((code) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code);

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
						onChange={(event) => onTreatmentChange(event.target.value)}
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
							onChange={(event) => onDoctorChange(event.target.value)}
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
				</>
			) : (
				<p className={'muted'}>{t('This clinic has no treatments listed yet.')}</p>
			)}

			<div className={'soon'}>
				<EventAvailableOutlinedIcon />
				<span>{t('Dates and times open with online booking — coming soon.')}</span>
			</div>

			{interpreterLabels.length > 0 && (
				<div className={'interpreter'}>
					<TranslateRoundedIcon />
					<span>
						<strong>{t('Interpreter')}</strong>
						{interpreterLabels.join(', ')}
					</span>
				</div>
			)}

			<div className={'total'}>
				<span>{t('Total')}</span>
				<strong>{treatment ? formatKrw(treatment.treatmentPrice) : '—'}</strong>
			</div>

			<Button variant={'contained'} size={'large'} fullWidth disabled endIcon={<ArrowForwardRoundedIcon />}>
				{t('Request booking')}
			</Button>
			<p className={'note'}>{t('The clinic confirms your request. Online booking opens soon.')}</p>
			<Button variant={'outlined'} fullWidth disabled endIcon={<ChatBubbleOutlineRoundedIcon />}>
				{t('Chat with clinic')}
			</Button>
			<p className={'note'}>{t('Messages are translated automatically')}</p>
		</Box>
	);
};

export default BookingCard;
