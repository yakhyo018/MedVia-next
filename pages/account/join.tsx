import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import {
	Box,
	Button,
	Checkbox,
	CircularProgress,
	FormControlLabel,
	IconButton,
	InputAdornment,
	MenuItem,
	Stack,
	Tab,
	Tabs,
	TextField,
} from '@mui/material';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import Logo from '../../libs/components/common/Logo';
import ClinicSignupForm from '../../libs/components/account/ClinicSignupForm';
import GoogleButton from '../../libs/components/account/GoogleButton';
import { logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { sessionReadyVar, userVar } from '../../apollo/store';
import {
	ClientMessages,
	EMAIL_PATTERN,
	FULL_NAME_MAX,
	FULL_NAME_MIN,
	LANGUAGES,
	PASSWORD_MAX,
	PASSWORD_MIN,
	PHONE_PATTERN,
	IMAGES,
	localeToLanguage,
} from '../../libs/config';
import { Language } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

interface JoinInput {
	memberEmail: string;
	memberPassword: string;
	memberFullName: string;
	memberPhone: string;
	memberLang: Language;
	termsAccepted: boolean;
}

type JoinErrors = Partial<Record<keyof JoinInput, string>>;

const DEFAULT_INPUT: JoinInput = {
	memberEmail: '',
	memberPassword: '',
	memberFullName: '',
	memberPhone: '',
	memberLang: Language.EN,
	termsAccepted: false,
};

/** The same rules as the backend's MemberInput / LoginInput, checked before the request. */
const validate = (input: JoinInput, loginView: boolean): JoinErrors => {
	const errors: JoinErrors = {};
	if (!EMAIL_PATTERN.test(input.memberEmail.trim())) errors.memberEmail = ClientMessages.EMAIL_INVALID;
	if (loginView) {
		if (!input.memberPassword) errors.memberPassword = ClientMessages.FILL_ALL_INPUTS;
		return errors;
	}
	if (input.memberPassword.length < PASSWORD_MIN) errors.memberPassword = ClientMessages.PASSWORD_TOO_SHORT;
	const fullName = input.memberFullName.trim();
	if (fullName.length < FULL_NAME_MIN || fullName.length > FULL_NAME_MAX) {
		errors.memberFullName = ClientMessages.FULL_NAME_INVALID;
	}
	if (input.memberPhone.trim() && !PHONE_PATTERN.test(input.memberPhone.trim())) {
		errors.memberPhone = ClientMessages.PHONE_INVALID;
	}
	if (!input.termsAccepted) errors.termsAccepted = ClientMessages.TERMS_REQUIRED;
	return errors;
};

const Join: NextPage = () => {
	const router = useRouter();
	const device = useDeviceDetect();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [input, setInput] = useState<JoinInput>({ ...DEFAULT_INPUT, memberLang: localeToLanguage(router.locale) });
	const [loginView, setLoginView] = useState<boolean>(true);
	const [submitted, setSubmitted] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [showPassword, setShowPassword] = useState<boolean>(false);

	const errors = submitted ? validate(input, loginView) : {};
	// "I am a: Patient / Clinic" on the sign-up tab (`?as=clinic`).
	const asClinic = !loginView && router.query.as === 'clinic';
	// Only a path on this site: "?referrer=https://evil.example" must not send a fresh login elsewhere.
	const rawReferrer = typeof router.query.referrer === 'string' ? router.query.referrer : '/';
	const referrer = rawReferrer.startsWith('/') && !rawReferrer.startsWith('//') ? rawReferrer : '/';

	/** LIFECYCLES **/
	useEffect(() => {
		if (router.isReady) setLoginView(router.query.mode !== 'signup');
	}, [router.isReady, router.query.mode]);

	useEffect(() => {
		// Already signed in (a reload restored the session): nothing to do here.
		if (sessionReady && user._id && !loading) router.replace(referrer);
	}, [sessionReady, user._id]); // eslint-disable-line react-hooks/exhaustive-deps

	/** HANDLERS **/
	const viewChangeHandler = async (login: boolean) => {
		setSubmitted(false);
		// Keep the referrer: a guest sent here from a clinic page goes back there after signing up too.
		const rest = Object.fromEntries(Object.entries(router.query).filter(([key]) => key !== 'mode'));
		await router.replace({ pathname: router.pathname, query: login ? rest : { ...rest, mode: 'signup' } }, undefined, {
			shallow: true,
		});
	};

	const roleHandler = async (clinic: boolean) => {
		const rest = Object.fromEntries(Object.entries(router.query).filter(([key]) => key !== 'as'));
		await router.replace({ pathname: router.pathname, query: clinic ? { ...rest, as: 'clinic' } : rest }, undefined, {
			shallow: true,
		});
	};

	const inputHandler = (name: keyof JoinInput, value: string | boolean) => {
		setInput((prev) => ({ ...prev, [name]: value }));
	};

	const submitHandler = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
		if (Object.keys(validate(input, loginView)).length > 0) return;

		try {
			setLoading(true);
			if (loginView) {
				await logIn(input.memberEmail.trim(), input.memberPassword);
			} else {
				await signUp({
					memberType: MemberType.USER,
					memberEmail: input.memberEmail.trim(),
					memberPassword: input.memberPassword,
					memberFullName: input.memberFullName.trim(),
					memberPhone: input.memberPhone.trim() || undefined,
					memberLang: input.memberLang,
					termsAccepted: input.termsAccepted,
				});
			}
			await router.push(referrer);
			await sweetTopSmallSuccessAlert(loginView ? 'Welcome back!' : 'Your account is ready!');
		} catch (err) {
			console.log('ERROR, submitHandler:', (err as Error).message);
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setLoading(false);
		}
	};

	const googleHandler = async () => {
		await router.push(referrer);
		await sweetTopSmallSuccessAlert(loginView ? 'Welcome back!' : 'Your account is ready!');
	};

	const label = (text: string) => <span className={'field-label'}>{text}</span>;
	const icon = (node: React.ReactNode) => <InputAdornment position={'start'}>{node}</InputAdornment>;
	const errorText = (name: keyof JoinInput) => (errors[name] ? t(errors[name] as string) : undefined);

	const patientForm = (
		<Box component={'form'} className={'join-form'} noValidate onSubmit={submitHandler}>
			<Tabs value={loginView ? 0 : 1} onChange={(_, value) => viewChangeHandler(value === 0)}>
				<Tab label={t('Log in')} />
				<Tab label={t('Sign up')} />
			</Tabs>

			{!loginView && (
				<Box className={'role-pick'} role={'radiogroup'} aria-label={t('I am a')}>
					<span>{t('I am a')}</span>
					<button type={'button'} role={'radio'} aria-checked={!asClinic} onClick={() => roleHandler(false)}>
						{t('Patient')}
					</button>
					<button type={'button'} role={'radio'} aria-checked={asClinic} onClick={() => roleHandler(true)}>
						{t('Clinic')}
					</button>
				</Box>
			)}

			{/* Keyed by the mode: switching Log in ↔ Sign up remounts the fields and fades them in. */}
			{!asClinic && (
				<Box key={loginView ? 'login' : 'signup'} className={'form-body mv-swap'}>
					{!loginView && (
						<Box className={'field'}>
							{label(t('Full name'))}
							<TextField
								value={input.memberFullName}
								onChange={(e) => inputHandler('memberFullName', e.target.value)}
								autoComplete={'name'}
								error={Boolean(errors.memberFullName)}
								helperText={errorText('memberFullName')}
								inputProps={{ maxLength: FULL_NAME_MAX }}
							/>
						</Box>
					)}

					<Box className={'field'}>
						{label(t('Email'))}
						<TextField
							type={'email'}
							value={input.memberEmail}
							onChange={(e) => inputHandler('memberEmail', e.target.value)}
							placeholder={'name@example.com'}
							autoComplete={'email'}
							error={Boolean(errors.memberEmail)}
							helperText={errorText('memberEmail')}
							InputProps={{ startAdornment: icon(<MailOutlineRoundedIcon />) }}
						/>
					</Box>

					<Box className={'field'}>
						{label(t('Password'))}
						<TextField
							type={showPassword ? 'text' : 'password'}
							value={input.memberPassword}
							onChange={(e) => inputHandler('memberPassword', e.target.value)}
							placeholder={loginView ? '' : t('At least 8 characters')}
							autoComplete={loginView ? 'current-password' : 'new-password'}
							error={Boolean(errors.memberPassword)}
							helperText={errorText('memberPassword')}
							inputProps={{ maxLength: PASSWORD_MAX }}
							InputProps={{
								startAdornment: icon(<LockOutlinedIcon />),
								endAdornment: (
									<InputAdornment position={'end'}>
										<IconButton
											size={'small'}
											aria-label={t(showPassword ? 'Hide password' : 'Show password')}
											onClick={() => setShowPassword((prev) => !prev)}
										>
											{showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
					</Box>

					{!loginView && (
						<>
							<Box className={'field-row'}>
								<Box className={'field'}>
									{label(t('Phone (optional)'))}
									<TextField
										type={'tel'}
										value={input.memberPhone}
										onChange={(e) => inputHandler('memberPhone', e.target.value)}
										placeholder={'+82 10 1234 5678'}
										autoComplete={'tel'}
										error={Boolean(errors.memberPhone)}
										helperText={errorText('memberPhone') ?? t('So the clinic can reach you on the visit day')}
										InputProps={{ startAdornment: icon(<PhoneOutlinedIcon />) }}
									/>
								</Box>
								<Box className={'field'}>
									{label(t('Preferred language'))}
									<TextField
										select
										value={input.memberLang}
										onChange={(e) => inputHandler('memberLang', e.target.value)}
										InputProps={{ startAdornment: icon(<LanguageOutlinedIcon />) }}
									>
										{LANGUAGES.map((lang) => (
											<MenuItem key={lang.code} value={lang.code}>
												{lang.label}
											</MenuItem>
										))}
									</TextField>
								</Box>
							</Box>

							<Box className={'terms'}>
								<FormControlLabel
									control={
										<Checkbox
											size={'small'}
											checked={input.termsAccepted}
											onChange={(e) => inputHandler('termsAccepted', e.target.checked)}
										/>
									}
									label={t('I agree to the Terms of Use and Privacy Policy')}
								/>
								{errors.termsAccepted && <p className={'field-error'}>{t(errors.termsAccepted)}</p>}
							</Box>
						</>
					)}

					<Button
						type={'submit'}
						variant={'contained'}
						size={'large'}
						fullWidth
						disabled={loading}
						endIcon={loading ? <CircularProgress size={18} color={'inherit'} /> : <ArrowForwardRoundedIcon />}
					>
						{loginView ? t('Log in') : t('Create account')}
					</Button>

					<GoogleButton
						mode={loginView ? 'login' : 'signup'}
						termsAccepted={input.termsAccepted}
						memberLang={input.memberLang}
						onSignedIn={googleHandler}
						onNeedsSignup={() => viewChangeHandler(false)}
					/>

					<p className={'ask-info'}>
						{loginView ? t('New to MedVia?') : t('Already have an account?')}{' '}
						<b onClick={() => viewChangeHandler(!loginView)}>{loginView ? t('Create an account') : t('Log in')}</b>
					</p>
				</Box>
			)}
		</Box>
	);

	const form = asClinic ? (
		<Box className={'join-form'}>
			<Tabs value={1} onChange={(_, value) => viewChangeHandler(value === 0)}>
				<Tab label={t('Log in')} />
				<Tab label={t('Sign up')} />
			</Tabs>
			<Box className={'role-pick'} role={'radiogroup'} aria-label={t('I am a')}>
				<span>{t('I am a')}</span>
				<button type={'button'} role={'radio'} aria-checked={false} onClick={() => roleHandler(false)}>
					{t('Patient')}
				</button>
				<button type={'button'} role={'radio'} aria-checked={true} onClick={() => roleHandler(true)}>
					{t('Clinic')}
				</button>
			</Box>
			<ClinicSignupForm onBusy={setLoading} />
		</Box>
	) : (
		patientForm
	);
	const headline = asClinic
		? t('Bring international patients to your clinic.')
		: loginView
			? t('Welcome back.')
			: t('Your clinic visit, in your language.');

	if (device === 'mobile') {
		return (
			<Stack className={'join-page'}>
				<Stack className={'container'}>
					<Box className={'welcome mv-enter'}>
						<h2 key={loginView ? 'login' : 'signup'} className={'mv-swap'}>
							{headline}
						</h2>
						{(asClinic
							? ['Bookings and chat translated both ways', 'A short Korean summary of every patient']
							: loginView
								? ['Your bookings and the visit-day queue', 'Chat with your clinic in your language']
								: ['Verified clinics only · reviewed by MedVia', 'Chat that translates both ways']
						).map((point) => (
							<div key={point}>
								<span>
									<CheckRoundedIcon />
								</span>
								{t(point)}
							</div>
						))}
					</Box>
					{form}
				</Stack>
			</Stack>
		);
	} else {
		const points = asClinic
			? [
					'Bookings and chat translated both ways',
					'A short Korean summary of every patient',
					'Listed after a quick review by MedVia',
				]
			: loginView
				? [
						'Your bookings and the visit-day queue',
						'Chat with your clinic in your language',
						'Reviews from completed visits',
					]
				: [
						'Verified clinics only · reviewed by MedVia',
						'Chat that translates both ways',
						'Reviews from completed visits',
					];

		return (
			<Stack className={'join-page'}>
				<Stack className={'container'}>
					<Stack className={'main mv-enter-zoom'}>
						<Stack className={'left'}>
							<Logo variant={'white'} href={null} />
							<h2 key={loginView ? 'login' : 'signup'} className={'mv-swap'}>
								{headline}
							</h2>
							<Box className={'points'}>
								{points.map((point) => (
									<div key={point} className={'mv-enter'}>
										<span>
											<CheckRoundedIcon />
										</span>
										{t(point)}
									</div>
								))}
							</Box>
							<Box className={'illustration'}>
								<img
									key={loginView ? 'login' : 'signup'}
									className={'mv-swap'}
									src={loginView ? IMAGES.login.src : IMAGES.signup.src}
									alt={t('Illustration')}
								/>
							</Box>
						</Stack>
						<Stack className={'right'}>{form}</Stack>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default withLayoutBasic(Join);
