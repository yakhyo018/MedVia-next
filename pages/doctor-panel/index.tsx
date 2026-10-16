import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, IconButton, Skeleton, TextField } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import DoctorFrame from '../../libs/components/doctor-panel/DoctorFrame';
import ChangePasswordDialog from '../../libs/components/mypage/ChangePasswordDialog';
import useUpload, { UPLOAD_TYPES } from '../../libs/hooks/useUpload';
import { GET_MY_DOCTOR_PROFILE } from '../../apollo/user/query';
import { UPDATE_MY_DOCTOR_PROFILE } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { Doctor } from '../../libs/types/doctor/doctor';
import { CareerItemInput, DoctorProfileUpdate } from '../../libs/types/doctor/doctor.input';
import { MemberType } from '../../libs/enums/member.enum';
import { ClientMessages, FULL_NAME_MAX, FULL_NAME_MIN, LANGUAGES, REACT_APP_API_URL } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { imageUrl, initials } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CAREER_MAX = 10;
const BIO_MAX = 2000;
const EMPTY_ITEM: CareerItemInput = { title: '', place: '', from: '', to: '' };

/** The API takes each career field 1–100 / 1–20 characters when present: empty ones are left out. */
const cleanCareer = (items: CareerItemInput[]): CareerItemInput[] =>
	items
		.filter((item) => item.title.trim())
		.map((item) => ({
			title: item.title.trim(),
			...(item.place?.trim() ? { place: item.place.trim() } : {}),
			...(item.from?.trim() ? { from: item.from.trim() } : {}),
			...(item.to?.trim() ? { to: item.to.trim() } : {}),
		}));

/** The doctor's public profile, as the doctor keeps it. The clinic sets the specialty. */
const DoctorProfile: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { upload, uploading } = useUpload();
	const fileRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState<DoctorProfileUpdate>({});
	const [career, setCareer] = useState<CareerItemInput[]>([]);
	const [nameError, setNameError] = useState<string>('');
	const [passwordOpen, setPasswordOpen] = useState<boolean>(false);
	const isDoctor = user.memberType === MemberType.DOCTOR;

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_MY_DOCTOR_PROFILE, { fetchPolicy: 'cache-and-network', skip: !isDoctor });
	const [updateMyDoctorProfile, { loading: saving }] = useMutation(UPDATE_MY_DOCTOR_PROFILE);
	const doctor: Doctor | undefined = data?.getMyDoctorProfile;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!doctor) return;
		setInput({
			doctorName: doctor.doctorName,
			doctorNameKo: doctor.doctorNameKo ?? '',
			doctorImage: doctor.doctorImage ?? '',
			doctorExperience: doctor.doctorExperience,
			doctorLangs: doctor.doctorLangs ?? [],
			doctorBio: doctor.doctorBio ?? '',
		});
		setCareer(
			(doctor.doctorCareer ?? []).map((item) => ({
				title: item.title,
				place: item.place ?? '',
				from: item.from ?? '',
				to: item.to ?? '',
			})),
		);
		// Only when a new profile arrives, not on every cache write.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [doctor?._id]);

	/** HANDLERS **/
	const inputHandler = <K extends keyof DoctorProfileUpdate>(name: K, value: DoctorProfileUpdate[K]) =>
		setInput({ ...input, [name]: value });

	const careerHandler = (index: number, patch: Partial<CareerItemInput>) =>
		setCareer(career.map((item, at) => (at === index ? { ...item, ...patch } : item)));

	const photoHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		try {
			inputHandler('doctorImage', await upload(file, 'doctor'));
		} catch (err) {
			await sweetMixinErrorAlert(t((err as Error).message));
		}
	};

	const saveHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const name = input.doctorName?.trim() ?? '';
		if (name.length < FULL_NAME_MIN || name.length > FULL_NAME_MAX)
			return setNameError(ClientMessages.FULL_NAME_INVALID);
		try {
			const update: DoctorProfileUpdate = {
				...input,
				doctorName: name,
				doctorCareer: cleanCareer(career),
			};
			if (!update.doctorNameKo?.trim()) delete update.doctorNameKo;
			if (!update.doctorImage) delete update.doctorImage;
			if (update.doctorExperience === undefined || Number.isNaN(update.doctorExperience))
				delete update.doctorExperience;
			await updateMyDoctorProfile({ variables: { input: update } });
			await sweetTopSmallSuccessAlert(t('Profile saved'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	if (loading && !doctor) {
		return (
			<DoctorFrame title={t('My Profile')}>
				<Skeleton variant={'rounded'} height={560} />
			</DoctorFrame>
		);
	}

	return (
		<DoctorFrame
			title={t('My Profile')}
			className={'doctor-profile'}
			action={
				doctor && (
					<Button variant={'outlined'} LinkComponent={Link} href={`/doctors/detail?id=${doctor._id}`}>
						{t('Public profile')}
					</Button>
				)
			}
		>
			<Box component={'form'} noValidate onSubmit={saveHandler} className={'profile-form'}>
				<Box className={'card'}>
					<h2>{t('Public profile')}</h2>
					<div className={'photo-row'}>
						<span className={'avatar'}>
							{input.doctorImage ? (
								<img src={imageUrl(input.doctorImage, REACT_APP_API_URL)} alt={''} />
							) : (
								initials(input.doctorName)
							)}
						</span>
						<div className={'photo-text'}>
							<span>{t('A clear, recent photo builds trust')}</span>
							<Button variant={'outlined'} size={'small'} disabled={uploading} onClick={() => fileRef.current?.click()}>
								{uploading ? t('Uploading…') : t('Change photo')}
							</Button>
							<input ref={fileRef} type={'file'} accept={UPLOAD_TYPES.join(',')} hidden onChange={photoHandler} />
						</div>
					</div>
					<div className={'fields'}>
						<TextField
							label={t('Full name')}
							value={input.doctorName ?? ''}
							error={Boolean(nameError)}
							helperText={nameError ? t(nameError) : undefined}
							onChange={(event) => {
								setNameError('');
								inputHandler('doctorName', event.target.value);
							}}
							inputProps={{ maxLength: FULL_NAME_MAX }}
						/>
						<TextField
							label={t('Name in Korean')}
							value={input.doctorNameKo ?? ''}
							onChange={(event) => inputHandler('doctorNameKo', event.target.value)}
							inputProps={{ maxLength: FULL_NAME_MAX }}
						/>
						<TextField
							label={t('Specialty')}
							value={doctor?.doctorSpecialty ? t(`specialty.${doctor.doctorSpecialty}`) : ''}
							disabled
						/>
						<TextField label={t('Clinic')} value={doctor?.clinicData?.clinicName ?? ''} disabled />
						<TextField
							label={t('Years of experience')}
							type={'number'}
							value={input.doctorExperience ?? ''}
							onChange={(event) =>
								inputHandler(
									'doctorExperience',
									event.target.value === '' ? undefined : Math.min(60, Math.max(0, Number(event.target.value))),
								)
							}
							inputProps={{ min: 0, max: 60 }}
						/>
					</div>
					<span className={'hint'}>
						{t('Specialty and clinic are set by {{clinic}}.', { clinic: doctor?.clinicData?.clinicName ?? '' })}
					</span>
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
					<TextField
						label={t('Bio')}
						multiline
						minRows={4}
						value={input.doctorBio ?? ''}
						onChange={(event) => inputHandler('doctorBio', event.target.value)}
						inputProps={{ maxLength: BIO_MAX }}
					/>
				</Box>

				<Box className={'card'}>
					<h2>{t('Education and career')}</h2>
					<span className={'hint'}>{t('Shown on your public page')}</span>
					{career.map((item, index) => (
						<div key={index} className={'career-row'}>
							<TextField
								size={'small'}
								label={t('Title')}
								value={item.title}
								placeholder={t('Dermatologist')}
								onChange={(event) => careerHandler(index, { title: event.target.value })}
								inputProps={{ maxLength: 100 }}
							/>
							<TextField
								size={'small'}
								label={t('Place')}
								value={item.place}
								onChange={(event) => careerHandler(index, { place: event.target.value })}
								inputProps={{ maxLength: 100 }}
							/>
							<TextField
								size={'small'}
								label={t('From')}
								value={item.from}
								placeholder={'2014'}
								onChange={(event) => careerHandler(index, { from: event.target.value })}
								inputProps={{ maxLength: 20 }}
							/>
							<TextField
								size={'small'}
								label={t('To')}
								value={item.to}
								placeholder={t('present')}
								onChange={(event) => careerHandler(index, { to: event.target.value })}
								inputProps={{ maxLength: 20 }}
							/>
							<IconButton
								aria-label={t('Remove entry')}
								onClick={() => setCareer(career.filter((_, at) => at !== index))}
							>
								<DeleteOutlineRoundedIcon />
							</IconButton>
						</div>
					))}
					{career.length < CAREER_MAX && (
						<Button
							variant={'text'}
							startIcon={<AddRoundedIcon />}
							className={'add-entry'}
							onClick={() => setCareer([...career, { ...EMPTY_ITEM }])}
						>
							{t('Add entry')}
						</Button>
					)}
				</Box>

				<Box className={'card'}>
					<h2>{t('Security')}</h2>
					<div className={'security-row'}>
						<span className={'text'}>
							<strong>{t('Password')}</strong>
							<span>{t('Changing it signs out your other devices')}</span>
						</span>
						<Button variant={'outlined'} size={'small'} onClick={() => setPasswordOpen(true)}>
							{t('Change password')}
						</Button>
					</div>
				</Box>

				<Box className={'form-actions'}>
					<Button type={'submit'} variant={'contained'} disabled={saving || uploading}>
						{t('Save changes')}
					</Button>
				</Box>
			</Box>
			<ChangePasswordDialog open={passwordOpen} hasPassword onClose={() => setPasswordOpen(false)} />
		</DoctorFrame>
	);
};

export default withLayoutBasic(DoctorProfile);
