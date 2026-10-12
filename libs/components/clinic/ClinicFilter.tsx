import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Box, Button, Checkbox, FormControlLabel, InputAdornment, Switch, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { District, Specialty } from '../../enums/clinic.enum';
import { Language } from '../../enums/common.enum';
import { LANGUAGES } from '../../config';

export interface ClinicFilterValues {
	text: string;
	specialty: Specialty | '';
	districts: District[];
	langs: Language[];
	/** Kept as typed text until Apply; numbers in the URL. */
	priceMin: string;
	priceMax: string;
	interpreter: boolean;
}

export const EMPTY_CLINIC_FILTER: ClinicFilterValues = {
	text: '',
	specialty: '',
	districts: [],
	langs: [],
	priceMin: '',
	priceMax: '',
	interpreter: false,
};

interface ClinicFilterProps {
	values: ClinicFilterValues;
	onApply: (values: ClinicFilterValues) => void;
}

const toggle = <V,>(list: V[], value: V): V[] =>
	list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

/** The sidebar: nothing is sent until Apply, so ticking five boxes is one request, not five. */
const ClinicFilter = (props: ClinicFilterProps) => {
	const { values, onApply } = props;
	const { t } = useTranslation('common');
	const [input, setInput] = useState<ClinicFilterValues>(values);

	/** LIFECYCLES **/
	useEffect(() => {
		// Back / forward, a chip removed or a shared link: show what is applied.
		setInput(values);
	}, [values]);

	/** HANDLERS **/
	const inputHandler = <K extends keyof ClinicFilterValues>(name: K, value: ClinicFilterValues[K]) => {
		setInput((prev) => ({ ...prev, [name]: value }));
	};

	const priceHandler = (name: 'priceMin' | 'priceMax') => (e: React.ChangeEvent<HTMLInputElement>) => {
		inputHandler(name, e.target.value.replace(/\D/g, '').slice(0, 9));
	};

	const applyHandler = (e: React.FormEvent) => {
		e.preventDefault();
		onApply({ ...input, text: input.text.trim() });
	};

	const resetHandler = () => {
		setInput(EMPTY_CLINIC_FILTER);
		onApply(EMPTY_CLINIC_FILTER);
	};

	return (
		<Box component={'form'} className={'clinic-filter'} onSubmit={applyHandler}>
			<strong className={'title'}>
				<TuneRoundedIcon />
				{t('Filters')}
			</strong>

			<TextField
				value={input.text}
				onChange={(e) => inputHandler('text', e.target.value)}
				placeholder={t('Clinic or treatment')}
				inputProps={{ maxLength: 100, 'aria-label': t('Clinic or treatment') }}
				InputProps={{
					startAdornment: (
						<InputAdornment position={'start'}>
							<SearchRoundedIcon />
						</InputAdornment>
					),
				}}
			/>

			<fieldset className={'group'}>
				<legend>{t('Location')}</legend>
				{Object.values(District).map((district) => (
					<FormControlLabel
						key={district}
						control={
							<Checkbox
								size={'small'}
								checked={input.districts.includes(district)}
								onChange={() => inputHandler('districts', toggle(input.districts, district))}
							/>
						}
						label={t(`district.${district}`)}
					/>
				))}
			</fieldset>

			<fieldset className={'group'}>
				<legend>{t('Specialty')}</legend>
				<div className={'pills'}>
					{Object.values(Specialty).map((specialty) => (
						<button
							key={specialty}
							type={'button'}
							className={input.specialty === specialty ? 'active' : ''}
							aria-pressed={input.specialty === specialty}
							onClick={() => inputHandler('specialty', input.specialty === specialty ? '' : specialty)}
						>
							{t(`specialty.${specialty}`)}
						</button>
					))}
				</div>
			</fieldset>

			<fieldset className={'group'}>
				<legend>{t('Price range')}</legend>
				<div className={'price'}>
					<TextField
						value={input.priceMin}
						onChange={priceHandler('priceMin')}
						placeholder={'50,000'}
						inputProps={{ inputMode: 'numeric', 'aria-label': t('Minimum price') }}
						InputProps={{ startAdornment: <InputAdornment position={'start'}>₩</InputAdornment> }}
					/>
					<span>~</span>
					<TextField
						value={input.priceMax}
						onChange={priceHandler('priceMax')}
						placeholder={'300,000'}
						inputProps={{ inputMode: 'numeric', 'aria-label': t('Maximum price') }}
						InputProps={{ startAdornment: <InputAdornment position={'start'}>₩</InputAdornment> }}
					/>
				</div>
			</fieldset>

			<fieldset className={'group'}>
				<legend>{t('Supported language')}</legend>
				<div className={'pills'}>
					{LANGUAGES.filter((lang) => lang.code !== Language.KO).map((lang) => (
						<button
							key={lang.code}
							type={'button'}
							className={input.langs.includes(lang.code) ? 'active' : ''}
							aria-pressed={input.langs.includes(lang.code)}
							onClick={() => inputHandler('langs', toggle(input.langs, lang.code))}
						>
							{lang.label}
						</button>
					))}
				</div>
			</fieldset>

			<FormControlLabel
				className={'interpreter'}
				labelPlacement={'start'}
				control={<Switch checked={input.interpreter} onChange={(e) => inputHandler('interpreter', e.target.checked)} />}
				label={t('Interpreter available')}
			/>

			<div className={'actions'}>
				<Button variant={'outlined'} onClick={resetHandler}>
					{t('Reset')}
				</Button>
				<Button type={'submit'} variant={'contained'}>
					{t('Apply')}
				</Button>
			</div>
		</Box>
	);
};

export default ClinicFilter;
