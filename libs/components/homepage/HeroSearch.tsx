import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, IconButton, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { District, Specialty } from '../../enums/clinic.enum';
import { LANGUAGES, localeToLanguage } from '../../config';

interface SearchInput {
	specialty: Specialty | '';
	district: District | '';
	language: string;
}

/** Popular searches under the box: free text the clinic list (F1) searches for. */
const POPULAR = ['Skin booster', 'Laser toning', 'Dental implant', 'Health check-up'];

const HeroSearch = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [input, setInput] = useState<SearchInput>({
		specialty: '',
		district: '',
		language: localeToLanguage(router.locale),
	});

	/** HANDLERS **/
	const inputHandler = (name: keyof SearchInput) => (e: SelectChangeEvent) => {
		setInput((prev) => ({ ...prev, [name]: e.target.value }));
	};

	const searchHandler = async () => {
		// The /clinics URL keys: specialty, district, lang.
		const query = Object.fromEntries(
			Object.entries({ specialty: input.specialty, district: input.district, lang: input.language }).filter(
				([, value]) => value !== '',
			),
		);
		await router.push({ pathname: '/clinics', query });
	};

	const field = (name: keyof SearchInput, label: string, options: { value: string; label: string }[], any: string) => (
		<Box className={'field'}>
			<span className={'label'}>{label}</span>
			<Select
				variant={'standard'}
				disableUnderline
				displayEmpty
				value={input[name]}
				onChange={inputHandler(name)}
				inputProps={{ 'aria-label': label }}
			>
				<MenuItem value={''}>{any}</MenuItem>
				{options.map((option) => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
		</Box>
	);

	return (
		<Stack className={'hero-search'}>
			<Box className={'search-box mv-enter'}>
				{field(
					'specialty',
					t('Treatment'),
					Object.values(Specialty).map((value) => ({ value, label: t(`specialty.${value}`) })),
					t('All treatments'),
				)}
				{field(
					'district',
					t('District'),
					Object.values(District).map((value) => ({ value, label: t(`district.${value}`) })),
					t('All of Seoul'),
				)}
				{field(
					'language',
					t('Language'),
					LANGUAGES.map((lang) => ({ value: lang.code, label: lang.label })),
					t('Any language'),
				)}
				<IconButton className={'search-btn'} aria-label={t('Search')} onClick={searchHandler}>
					<SearchRoundedIcon />
					<span className={'search-label'}>{t('Search clinics')}</span>
				</IconButton>
			</Box>
			<Box className={'popular mv-enter'}>
				<span>{t('Popular')}:</span>
				{POPULAR.map((text) => (
					<button
						key={text}
						className={'mv-lift'}
						onClick={() => router.push({ pathname: '/clinics', query: { text } })}
					>
						{t(text)}
					</button>
				))}
			</Box>
		</Stack>
	);
};

export default HeroSearch;
