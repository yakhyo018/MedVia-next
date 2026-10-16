import { useTranslation } from 'next-i18next';
import { Box, Button } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Treatment } from '../../types/treatment/treatment';
import { formatKrw, initials } from '../../utils';

interface TreatmentTableProps {
	treatments: Treatment[];
	selectedId: string;
	onSelect: (treatmentId: string) => void;
	/** Opened from a doctor's page: treatments this doctor does not perform cannot be picked. */
	doctorId?: string;
}

/** "Treatments and prices": a table on desktop, a list of cards on mobile (same markup, CSS). */
const TreatmentTable = (props: TreatmentTableProps) => {
	const { treatments, selectedId, onSelect, doctorId } = props;
	const { t } = useTranslation('common');

	return (
		<Box className={'clinic-treatments'} role={'table'} aria-label={t('Treatments and prices')}>
			<div className={'row head'} role={'row'}>
				<span role={'columnheader'}>{t('Treatment')}</span>
				<span role={'columnheader'}>{t('Duration')}</span>
				<span role={'columnheader'}>{t('Doctors')}</span>
				<span role={'columnheader'}>{t('Price from')}</span>
				<span role={'columnheader'} className={'sr-only'}>
					{t('Select')}
				</span>
			</div>
			{treatments.map((item) => {
				const selected = item._id === selectedId;
				const performs = !doctorId || Boolean(item.doctors?.some((doctor) => doctor._id === doctorId));
				return (
					<div key={item._id} className={`row ${selected ? 'selected' : ''}`} role={'row'}>
						<span className={'name'} role={'cell'}>
							<strong>{item.treatmentName}</strong>
							{item.treatmentPriceNote && <em>{item.treatmentPriceNote}</em>}
						</span>
						{/* `display: contents` on desktop (two table cells); one line under the name on mobile */}
						<span className={'meta'}>
							<span className={'duration'} role={'cell'}>
								{item.treatmentDuration} {t('min')}
							</span>
							<span className={'doctors'} role={'cell'}>
								{item.doctors?.map((doctor) => (
									<i key={doctor._id} title={`${t('Dr.')} ${doctor.doctorName}`}>
										{initials(doctor.doctorName)}
									</i>
								))}
							</span>
						</span>
						<b className={'price'} role={'cell'}>
							{formatKrw(item.treatmentPrice)}
						</b>
						<span className={'action'} role={'cell'}>
							{!performs ? (
								<span className={'other'}>{t('Other doctors')}</span>
							) : selected ? (
								<Button size={'small'} variant={'contained'} endIcon={<CheckRoundedIcon />} aria-pressed={true}>
									{t('Selected')}
								</Button>
							) : (
								<Button size={'small'} variant={'outlined'} aria-pressed={false} onClick={() => onSelect(item._id)}>
									{t('Select')}
								</Button>
							)}
						</span>
					</div>
				);
			})}
		</Box>
	);
};

export default TreatmentTable;
