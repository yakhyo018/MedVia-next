import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useMutation } from '@apollo/client';
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	MenuItem,
	TextField,
} from '@mui/material';
import { CREATE_SLOTS } from '../../../apollo/user/mutation';
import { Doctor } from '../../types/doctor/doctor';
import { SlotsCreateInput } from '../../types/slot/slot';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { addDaysKey, dayLabels, seoulDateKey } from '../../utils';

/** 07:00 … 22:00 every 30 minutes: the API takes HH:00 or HH:30. */
const TIMES = Array.from({ length: 31 }, (_, index) => {
	const minutes = 7 * 60 + index * 30;
	return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 ? '30' : '00'}`;
});
/** Mon … Sun as the API counts them (0 = Sunday). */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
/** The API makes slots up to 60 days ahead, at most 31 days per call. */
const RANGE_DAYS = 31;

interface AddSlotsDialogProps {
	open: boolean;
	doctors: Doctor[];
	/** Preselected doctor (the schedule's filter). */
	doctorId?: string;
	onClose: () => void;
	onCreated: () => void;
}

const AddSlotsDialog = (props: AddSlotsDialogProps) => {
	const { open, doctors, doctorId = '', onClose, onCreated } = props;
	const { t } = useTranslation('common');
	const router = useRouter();
	const today = seoulDateKey(new Date());
	const [input, setInput] = useState<SlotsCreateInput>({
		doctorId,
		dateFrom: today,
		dateTo: addDaysKey(today, 13),
		timeFrom: '10:00',
		timeTo: '18:00',
		days: [],
	});
	const [error, setError] = useState<string>('');
	const [createSlots, { loading }] = useMutation(CREATE_SLOTS);

	useEffect(() => {
		if (open) {
			setError('');
			setInput((current) => ({ ...current, doctorId: doctorId || current.doctorId || doctors[0]?._id || '' }));
		}
	}, [open, doctorId, doctors]);

	const dayHandler = (day: number) => {
		const days = input.days ?? [];
		setInput({ ...input, days: days.includes(day) ? days.filter((item) => item !== day) : [...days, day] });
	};

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!input.doctorId) return setError(t('Choose a doctor'));
		if (input.dateTo < input.dateFrom || addDaysKey(input.dateFrom, RANGE_DAYS - 1) < input.dateTo) {
			return setError(t('Choose up to 31 days, the last one not before the first'));
		}
		if (input.timeTo <= input.timeFrom) return setError(t('The end time must be after the start time'));
		try {
			const result = await createSlots({ variables: { input } });
			const { created, planned } = result.data.createSlots;
			await sweetTopSmallSuccessAlert(t('{{created}} new slots of {{planned}}', { created, planned }));
			onCreated();
			onClose();
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth={'sm'} fullWidth className={'prompt-dialog add-slots'}>
			<form noValidate onSubmit={submitHandler}>
				<DialogTitle>{t('Add slots')}</DialogTitle>
				<DialogContent className={'fields'}>
					<p className={'hint'}>
						{t('30-minute slots for one doctor. Existing slots stay as they are; closed days are skipped.')}
					</p>
					<TextField
						select
						label={t('Doctor')}
						value={input.doctorId}
						onChange={(event) => setInput({ ...input, doctorId: event.target.value })}
					>
						{doctors.map((doctor) => (
							<MenuItem key={doctor._id} value={doctor._id}>
								{t('Dr.')} {doctor.doctorName}
							</MenuItem>
						))}
					</TextField>
					<div className={'pair'}>
						<TextField
							type={'date'}
							label={t('From')}
							value={input.dateFrom}
							inputProps={{ min: today, max: addDaysKey(today, 59) }}
							InputLabelProps={{ shrink: true }}
							onChange={(event) => setInput({ ...input, dateFrom: event.target.value })}
						/>
						<TextField
							type={'date'}
							label={t('To')}
							value={input.dateTo}
							inputProps={{ min: input.dateFrom, max: addDaysKey(today, 59) }}
							InputLabelProps={{ shrink: true }}
							onChange={(event) => setInput({ ...input, dateTo: event.target.value })}
						/>
					</div>
					<div className={'pair'}>
						{(['timeFrom', 'timeTo'] as const).map((name) => (
							<TextField
								key={name}
								select
								label={name === 'timeFrom' ? t('First slot') : t('Until')}
								value={input[name]}
								onChange={(event) => setInput({ ...input, [name]: event.target.value })}
							>
								{TIMES.map((time) => (
									<MenuItem key={time} value={time}>
										{time}
									</MenuItem>
								))}
							</TextField>
						))}
					</div>
					<div className={'weekdays'} role={'group'} aria-label={t('Days')}>
						{WEEK.map((day) => (
							<FormControlLabel
								key={day}
								control={<Checkbox checked={(input.days ?? []).includes(day)} onChange={() => dayHandler(day)} />}
								// 2026-10-11 was a Sunday: +day gives that weekday's name in the reader's language.
								label={dayLabels(addDaysKey('2026-10-11', day), router.locale).weekday}
							/>
						))}
					</div>
					<p className={'hint'}>{t('No day ticked: every day the clinic is open.')}</p>
					{error && <p className={'field-error'}>{error}</p>}
				</DialogContent>
				<DialogActions>
					<Button variant={'outlined'} onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button type={'submit'} variant={'contained'} disabled={loading}>
						{t('Add slots')}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default AddSlotsDialog;
