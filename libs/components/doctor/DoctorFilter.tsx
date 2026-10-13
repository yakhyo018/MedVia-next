import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Box, Button, InputAdornment, MenuItem, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import { Specialty } from '../../enums/clinic.enum';
import { LANGUAGES } from '../../config';

export interface DoctorFilterValues {
	text: string;
	specialty: Specialty | '';
	lang: string;
}

interface DoctorFilterProps {
	values: DoctorFilterValues;
	onSearch: (values: DoctorFilterValues) => void;
}

/** The fields are local until Search: typing a name does not send a request per key. */
const DoctorFilter = (props: DoctorFilterProps) => {
	const { values, onSearch } = props;
	const { t } = useTranslation('common');
	const [input, setInput] = useState<DoctorFilterValues>(values);

	/** LIFECYCLES **/
	useEffect(() => {
		// Back / forward or a shared link changed the URL: show what is applied.
		setInput(values);
	}, [values]);

	/** HANDLERS **/
	const inputHandler = (name: keyof DoctorFilterValues, value: string) => {
		setInput((prev) => ({ ...prev, [name]: value }));
	};

	const searchHandler = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch({ ...input, text: input.text.trim() });
	};

	return (
		<Box component={'form'} className={'doctor-filter'} onSubmit={searchHandler}>
			<TextField
				className={'text'}
				value={input.text}
				onChange={(e) => inputHandler('text', e.target.value)}
				placeholder={t('Search by doctor name')}
				inputProps={{ maxLength: 100, 'aria-label': t('Search by doctor name') }}
				InputProps={{
					startAdornment: (
						<InputAdornment position={'start'}>
							<SearchRoundedIcon />
						</InputAdornment>
					),
				}}
			/>
			<TextField
				select
				value={input.specialty}
				onChange={(e) => inputHandler('specialty', e.target.value)}
				inputProps={{ 'aria-label': t('Specialty') }}
				SelectProps={{ displayEmpty: true }}
			>
				<MenuItem value={''}>{t('All specialties')}</MenuItem>
				{Object.values(Specialty).map((value) => (
					<MenuItem key={value} value={value}>
						{t(`specialty.${value}`)}
					</MenuItem>
				))}
			</TextField>
			<TextField
				select
				value={input.lang}
				onChange={(e) => inputHandler('lang', e.target.value)}
				inputProps={{ 'aria-label': t('Language') }}
				SelectProps={{ displayEmpty: true }}
				InputProps={{
					startAdornment: (
						<InputAdornment position={'start'}>
							<LanguageOutlinedIcon />
						</InputAdornment>
					),
				}}
			>
				<MenuItem value={''}>{t('Any language')}</MenuItem>
				{LANGUAGES.map((lang) => (
					<MenuItem key={lang.code} value={lang.code}>
						{lang.label}
					</MenuItem>
				))}
			</TextField>
			<Button type={'submit'} variant={'contained'} endIcon={<SearchRoundedIcon />}>
				{t('Search')}
			</Button>
		</Box>
	);
};

export default DoctorFilter;
