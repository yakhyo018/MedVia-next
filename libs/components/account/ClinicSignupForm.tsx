import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, MenuItem, TextField } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { signUpClinic } from '../../auth';
import { ClinicSignupInput } from '../../types/clinic/clinic';
import { District, Specialty } from '../../enums/clinic.enum';
import {
	ClientMessages,
	EMAIL_PATTERN,
	FULL_NAME_MAX,
	FULL_NAME_MIN,
	PASSWORD_MAX,
	PASSWORD_MIN,
	PHONE_PATTERN,
} from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

const DEFAULT_INPUT: ClinicSignupInput = {
	memberEmail: '',
	memberPassword: '',
	memberFullName: '',
	clinicName: '',
	clinicNameKo: '',
	clinicSpecialty: Specialty.DERMATOLOGY,
	clinicDistrict: District.GANGNAM,
	clinicAddress: '',
	clinicPhone: '',
	termsAccepted: false,
	authorizedConfirmed: false,
};

type Errors = Partial<Record<keyof ClinicSignupInput, string>>;

/** The backend's ClinicSignupInput rules, checked before the request. */
const validate = (input: ClinicSignupInput): Errors => {
	const errors: Errors = {};
	const name = input.clinicName.trim();
	if (name.length < 2 || name.length > 100) errors.clinicName = 'Write 2 to 100 characters';
	if (input.clinicAddress.trim().length < 5) errors.clinicAddress = 'Write the street address';
	const manager = input.memberFullName.trim();
	if (manager.length < FULL_NAME_MIN || manager.length > FULL_NAME_MAX) {
		errors.memberFullName = ClientMessages.FULL_NAME_INVALID;
	}
	if (input.clinicPhone?.trim() && !PHONE_PATTERN.test(input.clinicPhone.trim())) {
		errors.clinicPhone = ClientMessages.PHONE_INVALID;
	}
	if (!EMAIL_PATTERN.test(input.memberEmail.trim())) errors.memberEmail = ClientMessages.EMAIL_INVALID;
	if (input.memberPassword.length < PASSWORD_MIN) errors.memberPassword = ClientMessages.PASSWORD_TOO_SHORT;
	if (!input.termsAccepted) errors.termsAccepted = ClientMessages.TERMS_REQUIRED;
	if (!input.authorizedConfirmed) errors.authorizedConfirmed = 'Please confirm you may register this clinic';
	return errors;
};

interface ClinicSignupFormProps {
	/** Tells the join page a sign-up is running, so it does not send the new session elsewhere. */
	onBusy: (busy: boolean) => void;
}

/** "I am a clinic": the clinic and its manager's account; MedVia reviews it before patients see it. */
const ClinicSignupForm = (props: ClinicSignupFormProps) => {
	const { onBusy } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const [input, setInput] = useState<ClinicSignupInput>(DEFAULT_INPUT);
	const [submitted, setSubmitted] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const errors = submitted ? validate(input) : {};

	const inputHandler = <K extends keyof ClinicSignupInput>(name: K, value: ClinicSignupInput[K]) =>
		setInput((prev) => ({ ...prev, [name]: value }));

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		setSubmitted(true);
		if (Object.keys(validate(input)).length > 0) return;
		try {
			setLoading(true);
			onBusy(true);
			await signUpClinic({
				...input,
				memberEmail: input.memberEmail.trim(),
				memberFullName: input.memberFullName.trim(),
				clinicName: input.clinicName.trim(),
				clinicNameKo: input.clinicNameKo?.trim() || undefined,
				clinicAddress: input.clinicAddress.trim(),
				clinicPhone: input.clinicPhone?.trim() || undefined,
			});
			await router.push('/dashboard');
			await sweetTopSmallSuccessAlert(t('Sent for review'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setLoading(false);
			onBusy(false);
		}
	};

	const label = (text: string) => <span className={'field-label'}>{text}</span>;
	const errorText = (name: keyof ClinicSignupInput) => (errors[name] ? t(errors[name] as string) : undefined);
	const text = (name: keyof ClinicSignupInput, title: string, extra: Record<string, unknown> = {}) => (
		<Box className={'field'}>
			{label(title)}
			<TextField
				value={input[name] as string}
				onChange={(event) => inputHandler(name, event.target.value as never)}
				error={Boolean(errors[name])}
				helperText={errorText(name)}
				{...extra}
			/>
		</Box>
	);

	return (
		<Box component={'form'} className={'form-body clinic-signup mv-swap'} noValidate onSubmit={submitHandler}>
			<Box className={'field-row'}>
				{text('clinicName', t('Clinic name (English)'), {
					placeholder: 'Seoul Glow Dermatology',
					inputProps: { maxLength: 100 },
				})}
				{text('clinicNameKo', t('Name on the signboard'), {
					placeholder: '서울글로우피부과의원',
					inputProps: { maxLength: 100 },
				})}
			</Box>
			<Box className={'field-row'}>
				<Box className={'field'}>
					{label(t('Specialty'))}
					<TextField
						select
						value={input.clinicSpecialty}
						onChange={(event) => inputHandler('clinicSpecialty', event.target.value as Specialty)}
					>
						{Object.values(Specialty).map((specialty) => (
							<MenuItem key={specialty} value={specialty}>
								{t(`specialty.${specialty}`)}
							</MenuItem>
						))}
					</TextField>
				</Box>
				<Box className={'field'}>
					{label(t('District'))}
					<TextField
						select
						value={input.clinicDistrict}
						onChange={(event) => inputHandler('clinicDistrict', event.target.value as District)}
					>
						{Object.values(District).map((district) => (
							<MenuItem key={district} value={district}>
								{t(`district.${district}`)}
							</MenuItem>
						))}
					</TextField>
				</Box>
			</Box>
			{text('clinicAddress', t('Address'), {
				placeholder: t('Street address, district, Seoul'),
				inputProps: { maxLength: 200 },
			})}
			<Box className={'field-row'}>
				{text('memberFullName', t('Manager name'), {
					placeholder: 'Kim Ji-won',
					inputProps: { maxLength: FULL_NAME_MAX },
				})}
				{text('clinicPhone', t('Clinic phone'), { placeholder: '+82 2 1234 5678', type: 'tel' })}
			</Box>
			<Box className={'field-row'}>
				{text('memberEmail', t('Work email'), { type: 'email', autoComplete: 'email' })}
				{text('memberPassword', t('Password'), {
					type: 'password',
					autoComplete: 'new-password',
					placeholder: t('At least 8 characters'),
					inputProps: { maxLength: PASSWORD_MAX },
				})}
			</Box>
			<Box className={'terms'}>
				<FormControlLabel
					control={
						<Checkbox
							size={'small'}
							checked={input.termsAccepted}
							onChange={(event) => inputHandler('termsAccepted', event.target.checked)}
						/>
					}
					label={t('I agree to the Terms of Use and the Medical Ad Policy')}
				/>
				{errors.termsAccepted && <p className={'field-error'}>{t(errors.termsAccepted)}</p>}
				<FormControlLabel
					control={
						<Checkbox
							size={'small'}
							checked={input.authorizedConfirmed}
							onChange={(event) => inputHandler('authorizedConfirmed', event.target.checked)}
						/>
					}
					label={t('I am authorised to register this clinic')}
				/>
				{errors.authorizedConfirmed && <p className={'field-error'}>{t(errors.authorizedConfirmed)}</p>}
			</Box>
			<Button
				type={'submit'}
				variant={'contained'}
				size={'large'}
				fullWidth
				disabled={loading}
				endIcon={loading ? <CircularProgress size={18} color={'inherit'} /> : <ArrowForwardRoundedIcon />}
			>
				{t('Submit for review')}
			</Button>
			<p className={'ask-info'}>
				{t('The MedVia team reviews new clinics within one business day. After that you add doctors and treatments.')}
			</p>
		</Box>
	);
};

export default ClinicSignupForm;
