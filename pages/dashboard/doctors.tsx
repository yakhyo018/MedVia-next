import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, MenuItem, Skeleton, TextField } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../libs/components/dashboard/ClinicFrame';
import StatusChip from '../../libs/components/common/StatusChip';
import PromptDialog from '../../libs/components/common/PromptDialog';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_MY_CLINIC, GET_MY_CLINIC_DOCTORS } from '../../apollo/user/query';
import {
	CREATE_DOCTOR,
	HIDE_DOCTOR,
	REMOVE_DOCTOR,
	RESET_DOCTOR_PASSWORD,
	SHOW_DOCTOR,
	UPDATE_DOCTOR_BY_CLINIC,
} from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { Doctor } from '../../libs/types/doctor/doctor';
import { DoctorCreateInput } from '../../libs/types/doctor/doctor.input';
import { Clinic } from '../../libs/types/clinic/clinic';
import { DoctorStatus } from '../../libs/enums/doctor.enum';
import { Specialty } from '../../libs/enums/clinic.enum';
import { Language } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import {
	ClientMessages,
	EMAIL_PATTERN,
	FULL_NAME_MAX,
	FULL_NAME_MIN,
	LANGUAGES,
	PASSWORD_MAX,
	PASSWORD_MIN,
	REACT_APP_API_URL,
} from '../../libs/config';
import { sweetDangerConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { imageUrl, initials } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const TABS: { key: string; label: string; status?: DoctorStatus }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active', status: DoctorStatus.ACTIVE },
	{ key: 'hidden', label: 'Hidden', status: DoctorStatus.HIDDEN },
];

const DEFAULT_INPUT: DoctorCreateInput = {
	memberEmail: '',
	memberPassword: '',
	doctorName: '',
	doctorNameKo: '',
	doctorSpecialty: Specialty.DERMATOLOGY,
	doctorLangs: [Language.KO, Language.EN],
	doctorExperience: undefined,
};

type FormErrors = Partial<Record<keyof DoctorCreateInput, string>>;

/**
 * The clinic's doctors. The clinic makes each doctor's account (doctors do not sign up), hides a
 * doctor from patients, changes the specialty and resets a forgotten password; the doctor keeps
 * the rest of the profile in the Doctor Panel.
 */
const ClinicDoctors: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [input, setInput] = useState<DoctorCreateInput>(DEFAULT_INPUT);
	const [errors, setErrors] = useState<FormErrors>({});
	const [busyId, setBusyId] = useState<string>('');
	const [resetFor, setResetFor] = useState<Doctor | null>(null);
	const active = TABS.find((item) => item.key === router.query.tab) ?? TABS[0];
	const isClinic = user.memberType === MemberType.AGENT;

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_MY_CLINIC_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		skip: !isClinic,
	});
	const { data: clinicData } = useQuery(GET_MY_CLINIC, { fetchPolicy: 'cache-first', skip: !isClinic });
	const [createDoctor, { loading: creating }] = useMutation(CREATE_DOCTOR);
	const [updateDoctorByClinic] = useMutation(UPDATE_DOCTOR_BY_CLINIC);
	const [hideDoctor] = useMutation(HIDE_DOCTOR);
	const [showDoctor] = useMutation(SHOW_DOCTOR);
	const [removeDoctor] = useMutation(REMOVE_DOCTOR);
	const [resetDoctorPassword, { loading: resetting }] = useMutation(RESET_DOCTOR_PASSWORD);
	const clinic: Clinic | undefined = clinicData?.getMyClinic;
	const doctors: Doctor[] = (data?.getMyClinicDoctors ?? []).filter(
		(doctor: Doctor) => doctor.doctorStatus !== DoctorStatus.DELETE,
	);
	const shown = doctors.filter((doctor) => !active.status || doctor.doctorStatus === active.status);
	const countOf = (status?: DoctorStatus) =>
		status ? doctors.filter((doctor) => doctor.doctorStatus === status).length : doctors.length;

	/** LIFECYCLES **/
	useEffect(() => {
		// A new doctor usually shares the clinic's specialty.
		const specialty = clinic?.clinicSpecialty;
		if (specialty) setInput((current) => ({ ...current, doctorSpecialty: specialty }));
	}, [clinic?.clinicSpecialty]);

	/** HANDLERS **/
	const tabHandler = async (key: string) => {
		await router.push({ pathname: router.pathname, query: key === 'all' ? {} : { tab: key } }, undefined, {
			shallow: true,
		});
	};

	const run = async (doctor: Doctor, action: () => Promise<unknown>, done: string) => {
		try {
			setBusyId(doctor._id);
			await action();
			await refetch();
			await sweetTopSmallSuccessAlert(done);
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setBusyId('');
		}
	};

	const removeHandler = async (doctor: Doctor) => {
		const sure = await sweetDangerConfirmAlert(
			t('Remove Dr. {{name}}? The account stops working and the doctor leaves your treatments.', {
				name: doctor.doctorName,
			}),
			t('Remove'),
		);
		if (sure) await run(doctor, () => removeDoctor({ variables: { doctorId: doctor._id } }), t('Doctor removed'));
	};

	const resetHandler = async (newPassword: string) => {
		if (!resetFor) return;
		await run(
			resetFor,
			() => resetDoctorPassword({ variables: { input: { doctorId: resetFor._id, newPassword } } }),
			t('Password changed. Give the doctor the new one.'),
		);
		setResetFor(null);
	};

	const inputHandler = <K extends keyof DoctorCreateInput>(name: K, value: DoctorCreateInput[K]) => {
		setInput({ ...input, [name]: value });
		if (errors[name]) setErrors({ ...errors, [name]: undefined });
	};

	const createHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const found: FormErrors = {};
		const name = input.doctorName.trim();
		if (name.length < FULL_NAME_MIN || name.length > FULL_NAME_MAX) found.doctorName = ClientMessages.FULL_NAME_INVALID;
		if (!EMAIL_PATTERN.test(input.memberEmail.trim())) found.memberEmail = ClientMessages.EMAIL_INVALID;
		if (input.memberPassword.length < PASSWORD_MIN) found.memberPassword = ClientMessages.PASSWORD_TOO_SHORT;
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		try {
			await createDoctor({
				variables: {
					input: {
						...input,
						doctorName: name,
						memberEmail: input.memberEmail.trim(),
						doctorNameKo: input.doctorNameKo?.trim() || undefined,
						doctorExperience: input.doctorExperience || undefined,
					},
				},
			});
			setInput({ ...DEFAULT_INPUT, doctorSpecialty: clinic?.clinicSpecialty ?? DEFAULT_INPUT.doctorSpecialty });
			await refetch();
			await sweetTopSmallSuccessAlert(t('Doctor account created'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const errorText = (name: keyof DoctorCreateInput) => (errors[name] ? t(errors[name] as string) : undefined);

	return (
		<ClinicFrame
			title={t('Doctors')}
			text={clinic ? t('Doctors at {{clinic}}', { clinic: clinic.clinicName }) : undefined}
			className={'clinic-doctors'}
		>
			<Box className={'booking-tabs'} role={'tablist'} aria-label={t('Doctors')}>
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type={'button'}
						role={'tab'}
						aria-selected={tab.key === active.key}
						onClick={() => tabHandler(tab.key)}
					>
						{t(tab.label)} ({countOf(tab.status)})
					</button>
				))}
			</Box>

			{loading && doctors.length === 0 ? (
				<Skeleton variant={'rounded'} height={240} />
			) : shown.length === 0 ? (
				<EmptyState title={t('No doctors here yet')} text={t('Create the first doctor account below.')} />
			) : (
				<div className={'data-table doctors'} role={'table'} aria-label={t('Doctors')}>
					<div className={'row head'} role={'row'}>
						<span role={'columnheader'}>{t('Doctor')}</span>
						<span role={'columnheader'}>{t('Languages')}</span>
						<span role={'columnheader'}>{t('Rating')}</span>
						<span role={'columnheader'}>{t('Status')}</span>
						<span role={'columnheader'}>{t('Actions')}</span>
					</div>
					{shown.map((doctor) => (
						<div key={doctor._id} className={'row'} role={'row'}>
							<span role={'cell'} className={'person'}>
								<span className={'avatar'}>
									{doctor.doctorImage ? (
										<img src={imageUrl(doctor.doctorImage, REACT_APP_API_URL)} alt={''} />
									) : (
										initials(doctor.doctorName)
									)}
								</span>
								<span className={'name'}>
									<strong>
										{t('Dr.')} {doctor.doctorName}
									</strong>
									<TextField
										select
										size={'small'}
										variant={'standard'}
										value={doctor.doctorSpecialty}
										disabled={busyId === doctor._id}
										inputProps={{ 'aria-label': t('Specialty') }}
										onChange={(event) =>
											run(
												doctor,
												() =>
													updateDoctorByClinic({
														variables: { input: { doctorId: doctor._id, doctorSpecialty: event.target.value } },
													}),
												t('Saved'),
											)
										}
									>
										{Object.values(Specialty).map((specialty) => (
											<MenuItem key={specialty} value={specialty}>
												{t(`specialty.${specialty}`)}
											</MenuItem>
										))}
									</TextField>
									{doctor.doctorExperience ? (
										<small>{t('{{count}} yrs', { count: doctor.doctorExperience })}</small>
									) : null}
								</span>
							</span>
							<span role={'cell'} className={'langs'}>
								{doctor.doctorLangs.map((lang) => (
									<span key={lang}>{lang}</span>
								))}
							</span>
							<span role={'cell'} className={'rating'}>
								<StarRoundedIcon />
								{doctor.doctorReviews ? (
									<>
										<b>{doctor.doctorRating?.toFixed(1)}</b> ({doctor.doctorReviews})
									</>
								) : (
									t('New')
								)}
							</span>
							<span role={'cell'}>
								<StatusChip
									status={doctor.doctorStatus}
									label={t(doctor.doctorStatus === DoctorStatus.HIDDEN ? 'Hidden' : 'Active')}
									size={'small'}
								/>
							</span>
							<span role={'cell'} className={'row-actions'}>
								{doctor.doctorStatus === DoctorStatus.ACTIVE && (
									<Button
										size={'small'}
										disabled={busyId === doctor._id}
										onClick={() =>
											run(doctor, () => hideDoctor({ variables: { doctorId: doctor._id } }), t('Hidden from patients'))
										}
									>
										{t('Hide')}
									</Button>
								)}
								{doctor.doctorStatus === DoctorStatus.HIDDEN && (
									<Button
										size={'small'}
										disabled={busyId === doctor._id}
										onClick={() =>
											run(doctor, () => showDoctor({ variables: { doctorId: doctor._id } }), t('Shown to patients'))
										}
									>
										{t('Show')}
									</Button>
								)}
								<Button size={'small'} disabled={busyId === doctor._id} onClick={() => setResetFor(doctor)}>
									{t('New password')}
								</Button>
								<Button
									size={'small'}
									color={'error'}
									disabled={busyId === doctor._id}
									onClick={() => removeHandler(doctor)}
								>
									{t('Remove')}
								</Button>
							</span>
						</div>
					))}
				</div>
			)}

			<Box className={'doctor-create'}>
				<Box component={'form'} noValidate onSubmit={createHandler} className={'card'}>
					<h2>{t('Add a doctor')}</h2>
					<p className={'hint'}>{t('The clinic creates doctor accounts — doctors don’t sign up on their own.')}</p>
					<div className={'pair'}>
						<TextField
							label={t('Full name')}
							value={input.doctorName}
							placeholder={'Jang Min-seo'}
							onChange={(event) => inputHandler('doctorName', event.target.value)}
							error={Boolean(errors.doctorName)}
							helperText={errorText('doctorName')}
							inputProps={{ maxLength: FULL_NAME_MAX }}
						/>
						<TextField
							label={t('Name in Korean (optional)')}
							value={input.doctorNameKo}
							placeholder={'장민서'}
							onChange={(event) => inputHandler('doctorNameKo', event.target.value)}
							inputProps={{ maxLength: FULL_NAME_MAX }}
						/>
					</div>
					<div className={'pair'}>
						<TextField
							select
							label={t('Specialty')}
							value={input.doctorSpecialty}
							onChange={(event) => inputHandler('doctorSpecialty', event.target.value as Specialty)}
						>
							{Object.values(Specialty).map((specialty) => (
								<MenuItem key={specialty} value={specialty}>
									{t(`specialty.${specialty}`)}
								</MenuItem>
							))}
						</TextField>
						<TextField
							label={t('Years of experience (optional)')}
							type={'number'}
							value={input.doctorExperience ?? ''}
							onChange={(event) =>
								inputHandler(
									'doctorExperience',
									event.target.value ? Math.max(0, Number(event.target.value)) : undefined,
								)
							}
							inputProps={{ min: 0, max: 60 }}
						/>
					</div>
					<div className={'pair'}>
						<TextField
							label={t('Login email')}
							type={'email'}
							autoComplete={'off'}
							value={input.memberEmail}
							onChange={(event) => inputHandler('memberEmail', event.target.value)}
							error={Boolean(errors.memberEmail)}
							helperText={errorText('memberEmail')}
						/>
						<TextField
							label={t('Temporary password')}
							type={'password'}
							autoComplete={'new-password'}
							value={input.memberPassword}
							onChange={(event) => inputHandler('memberPassword', event.target.value)}
							error={Boolean(errors.memberPassword)}
							helperText={errorText('memberPassword') ?? t('At least 8 characters')}
							inputProps={{ maxLength: PASSWORD_MAX }}
						/>
					</div>
					<span className={'label'}>{t('Consults in')}</span>
					<div className={'chip-picks'}>
						{LANGUAGES.map((lang) => (
							<button
								key={lang.code}
								type={'button'}
								aria-pressed={(input.doctorLangs ?? []).includes(lang.code)}
								onClick={() =>
									inputHandler(
										'doctorLangs',
										(input.doctorLangs ?? []).includes(lang.code)
											? (input.doctorLangs ?? []).filter((item) => item !== lang.code)
											: [...(input.doctorLangs ?? []), lang.code],
									)
								}
							>
								{lang.label}
							</button>
						))}
					</div>
					<p className={'hint'}>
						{t(
							'The account works right away. Give the doctor this email and password — they can change the password after logging in. Assign treatments on the treatment form.',
						)}
					</p>
					<Button type={'submit'} variant={'contained'} disabled={creating}>
						{t('Create doctor account')}
					</Button>
				</Box>
				<Box className={'card roles'}>
					<h2>{t('Doctor account can')}</h2>
					<ul>
						<li>{t('Edit their own profile')}</li>
						<li>{t('Reply to reviews of their visits')}</li>
					</ul>
					<h2>{t('Clinic account keeps')}</h2>
					<ul>
						<li>{t('Booking requests and approvals')}</li>
						<li>{t('Time slots of every doctor')}</li>
						<li>{t('Chat with patients')}</li>
						<li>{t('Treatments and prices')}</li>
					</ul>
				</Box>
			</Box>

			<PromptDialog
				open={Boolean(resetFor)}
				title={t('New password for Dr. {{name}}', { name: resetFor?.doctorName ?? '' })}
				text={t('The doctor is signed out everywhere and logs in with this password.')}
				label={t('New password')}
				type={'password'}
				confirmText={t('Save')}
				minLength={PASSWORD_MIN}
				maxLength={PASSWORD_MAX}
				errorText={t(ClientMessages.PASSWORD_TOO_SHORT)}
				busy={resetting}
				onConfirm={resetHandler}
				onClose={() => setResetFor(null)}
			/>
		</ClinicFrame>
	);
};

export default withLayoutBasic(ClinicDoctors);
