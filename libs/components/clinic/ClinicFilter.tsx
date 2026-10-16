import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Box, Button, Checkbox, FormControlLabel, InputAdornment, Switch, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import { District, Specialty } from '../../enums/clinic.enum';
import { Language } from '../../enums/common.enum';
import { LANGUAGES } from '../../config';

export interface ClinicFilterValues {
	text: string;
	/** Exact treatment name from a trending card; shown as a chip, not in the sidebar. */
	treatment: string;
	specialty: Specialty | '';
	districts: District[];
	langs: Language[];
	/** Kept as typed text; numbers in the URL. */
	priceMin: string;
	priceMax: string;
	interpreter: boolean;
}

export const EMPTY_CLINIC_FILTER: ClinicFilterValues = {
	text: '',
	treatment: '',
	specialty: '',
	districts: [],
	langs: [],
	priceMin: '',
	priceMax: '',
	interpreter: false,
};

interface ClinicFilterProps {
	/** What the URL holds now. */
	values: ClinicFilterValues;
	/** Every change, live: the page writes it to the URL and the list follows. */
	onChange: (values: ClinicFilterValues) => void;
	/** The phone's bottom sheet: "Show results" closes it. */
	onDone?: () => void;
}

/** Typing (search text, prices) waits this long after the last key before the list follows. */
const TYPING_DELAY = 400;

/** The search text without outer spaces — what the URL and the API get. */
const normalize = (values: ClinicFilterValues): ClinicFilterValues => ({ ...values, text: values.text.trim() });

const toggle = <V,>(list: V[], value: V): V[] =>
	list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

/**
 * The sidebar, live: a box, pill or switch changes the list at once; typed text and prices follow
 * after a short pause, so a word is one request, not one per letter.
 */
const ClinicFilter = (props: ClinicFilterProps) => {
	const { values, onChange, onDone } = props;
	const { t } = useTranslation('common');
	const [input, setInput] = useState<ClinicFilterValues>(values);
	const typing = useRef<ReturnType<typeof setTimeout>>();

	/** LIFECYCLES **/
	useEffect(() => {
		// Back / forward, a chip removed or a shared link: show what is applied — but keep what is
		// being typed when the URL only lacks its outer spaces ("laser " stays "laser ").
		setInput((prev) => ({ ...values, text: values.text === prev.text.trim() ? prev.text : values.text }));
	}, [values]);

	useEffect(() => () => clearTimeout(typing.current), []);

	/** HANDLERS **/
	const send = (next: ClinicFilterValues) => {
		clearTimeout(typing.current);
		const clean = normalize(next);
		if (JSON.stringify(clean) !== JSON.stringify(values)) onChange(clean);
	};

	/** A click: the list follows now. */
	const inputHandler = <K extends keyof ClinicFilterValues>(name: K, value: ClinicFilterValues[K]) => {
		const next = { ...input, [name]: value };
		setInput(next);
		send(next);
	};

	/** Typing: the list follows after a pause. */
	const typeHandler = <K extends 'text' | 'priceMin' | 'priceMax'>(name: K, value: string) => {
		const next = { ...input, [name]: value };
		setInput(next);
		clearTimeout(typing.current);
		typing.current = setTimeout(() => send(next), TYPING_DELAY);
	};

	const priceHandler = (name: 'priceMin' | 'priceMax') => (e: React.ChangeEvent<HTMLInputElement>) => {
		typeHandler(name, e.target.value.replace(/\D/g, '').slice(0, 9));
	};

	/** Enter in a field: no need to wait for the pause. */
	const submitHandler = (e: React.FormEvent) => {
		e.preventDefault();
		send(input);
		onDone?.();
	};

	const resetHandler = () => {
		setInput(EMPTY_CLINIC_FILTER);
		send(EMPTY_CLINIC_FILTER);
	};

	return (
		<Box component={'form'} className={'clinic-filter'} onSubmit={submitHandler}>
			<strong className={'title'}>
				<TuneRoundedIcon />
				{t('Filters')}
			</strong>

			<TextField
				value={input.text}
				onChange={(e) => typeHandler('text', e.target.value)}
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

			<div className={`actions ${onDone ? '' : 'single'}`}>
				<Button variant={'outlined'} onClick={resetHandler}>
					{t('Reset')}
				</Button>
				{onDone && (
					<Button type={'submit'} variant={'contained'}>
						{t('Show results')}
					</Button>
				)}
			</div>
		</Box>
	);
};

export default ClinicFilter;
