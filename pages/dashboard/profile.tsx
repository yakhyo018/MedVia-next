import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, IconButton, MenuItem, Skeleton, Switch, TextField } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../libs/components/dashboard/ClinicFrame';
import StatusChip from '../../libs/components/common/StatusChip';
import useUpload, { UPLOAD_TYPES } from '../../libs/hooks/useUpload';
import { GET_MY_CLINIC, GET_MY_PROFILE } from '../../apollo/user/query';
import { RESUBMIT_CLINIC, UPDATE_MEMBER, UPDATE_MY_CLINIC } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { Clinic, ClinicHourInput, ClinicUpdate } from '../../libs/types/clinic/clinic';
import { Member } from '../../libs/types/member/member';
import { ClinicStatus, District, Specialty } from '../../libs/enums/clinic.enum';
import { Language } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { LANGUAGES, PHONE_PATTERN, REACT_APP_API_URL } from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { addDaysKey, dayLabels, imageUrl, initials, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PHOTOS_MAX = 10;
const DESC_MAX = 2000;
/** Mon … Sun (0 = Sunday, as the API stores hours). */
const WEEK = [1, 2, 3, 4, 5, 6, 0];
const TIMES = Array.from({ length: 35 }, (_, index) => {
	const minutes = 6 * 60 + index * 30;
	return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 ? '30' : '00'}`;
});
/** After verification these name the clinic MedVia checked: the API refuses to change them. */
const LOCKED: (keyof ClinicUpdate)[] = ['clinicName', 'clinicNameKo', 'clinicDistrict', 'clinicAddress'];

const hoursOf = (clinic: Clinic): ClinicHourInput[] =>
	WEEK.map((day) => {
		const hour = clinic.clinicHours?.find((item) => item.day === day);
		return hour
			? { day, open: hour.open ?? '10:00', close: hour.close ?? '19:00', closed: hour.closed }
			: { day, open: '10:00', close: '19:00', closed: true };
	});

/** The clinic's public page and account: what patients see, the review state, notifications. */
const ClinicProfile: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { upload, uploading } = useUpload();
	const logoRef = useRef<HTMLInputElement>(null);
	const photoRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState<ClinicUpdate>({});
	const [hours, setHours] = useState<ClinicHourInput[]>([]);
	const [notify, setNotify] = useState<{ bookingUpdates: boolean; chatMessages: boolean }>({
		bookingUpdates: true,
		chatMessages: true,
	});
	const [phoneError, setPhoneError] = useState<boolean>(false);
	const isClinic = user.memberType === MemberType.AGENT;

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_MY_CLINIC, { fetchPolicy: 'network-only', skip: !isClinic });
	const { data: profileData } = useQuery(GET_MY_PROFILE, { fetchPolicy: 'network-only', skip: !isClinic });
	const [updateMyClinic, { loading: saving }] = useMutation(UPDATE_MY_CLINIC);
	const [resubmitClinic, { loading: resubmitting }] = useMutation(RESUBMIT_CLINIC);
	const [updateMember] = useMutation(UPDATE_MEMBER);
	const clinic: Clinic | undefined = data?.getMyClinic;
	const profile: Member | undefined = profileData?.getMyProfile;
	const verified = clinic?.clinicStatus === ClinicStatus.ACTIVE || clinic?.clinicStatus === ClinicStatus.SUSPENDED;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!clinic) return;
		setInput({
			clinicName: clinic.clinicName,
			clinicNameKo: clinic.clinicNameKo ?? '',
			clinicSpecialty: clinic.clinicSpecialty,
			clinicDistrict: clinic.clinicDistrict,
			clinicAddress: clinic.clinicAddress ?? '',
			clinicPhone: clinic.clinicPhone ?? '',
			clinicLangs: clinic.clinicLangs ?? [],
			clinicInterpreterLangs: clinic.clinicInterpreterLangs ?? [],
			clinicLogo: clinic.clinicLogo ?? '',
			clinicImages: clinic.clinicImages ?? [],
			clinicDesc: clinic.clinicDesc ?? '',
		});
		setHours(hoursOf(clinic));
	}, [clinic]);

	useEffect(() => {
		if (profile) {
			setNotify({
				bookingUpdates: profile.memberNotify.bookingUpdates,
				chatMessages: profile.memberNotify.chatMessages,
			});
		}
	}, [profile]);

	/** HANDLERS **/
	const inputHandler = <K extends keyof ClinicUpdate>(name: K, value: ClinicUpdate[K]) =>
		setInput({ ...input, [name]: value });

	const toggleLang = (name: 'clinicLangs' | 'clinicInterpreterLangs', lang: Language) => {
		const list = input[name] ?? [];
		inputHandler(name, list.includes(lang) ? list.filter((item) => item !== lang) : [...list, lang]);
	};

	const hourHandler = (day: number, patch: Partial<ClinicHourInput>) =>
		setHours(hours.map((hour) => (hour.day === day ? { ...hour, ...patch } : hour)));

	const fileHandler = async (event: React.ChangeEvent<HTMLInputElement>, kind: 'logo' | 'photo') => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		try {
			const path = await upload(file, 'clinic');
			if (kind === 'logo') inputHandler('clinicLogo', path);
			else inputHandler('clinicImages', [...(input.clinicImages ?? []), path]);
		} catch (err) {
			await sweetMixinErrorAlert(t((err as Error).message));
		}
	};

	const saveHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const phone = input.clinicPhone?.trim() ?? '';
		if (phone && !PHONE_PATTERN.test(phone)) return setPhoneError(true);
		try {
			const update: ClinicUpdate = { ...input, clinicHours: hours };
			if (verified) LOCKED.forEach((key) => delete update[key]);
			if (!phone) delete update.clinicPhone;
			if (!update.clinicLogo) delete update.clinicLogo;
			if (!update.clinicNameKo) delete update.clinicNameKo;
			await updateMyClinic({ variables: { input: update } });
			await updateMember({ variables: { input: { memberNotify: notify } } });
			await refetch();
			await sweetTopSmallSuccessAlert(t('Profile saved'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const resubmitHandler = async () => {
		try {
			await resubmitClinic();
			await refetch();
			await sweetTopSmallSuccessAlert(t('Sent for review'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	if (loading && !clinic) {
		return (
			<ClinicFrame title={t('Clinic Profile')}>
				<Skeleton variant={'rounded'} height={600} />
			</ClinicFrame>
		);
	}

	const locked = (name: keyof ClinicUpdate) => verified && LOCKED.includes(name);
	const lockedHint = t('Checked by MedVia. To change it, write to support.');

	return (
		<ClinicFrame
			title={t('Clinic Profile')}
			className={'clinic-profile'}
			action={
				clinic && (
					<Button variant={'outlined'} LinkComponent={Link} href={`/clinics/detail?id=${clinic._id}`}>
						{t('Public page')}
					</Button>
				)
			}
		>
			<Box component={'form'} noValidate onSubmit={saveHandler} className={'profile-form clinic-form'}>
				<div className={'form-main'}>
					<Box className={'card'}>
						<h2>{t('Logo and photos')}</h2>
						<div className={'photo-row'}>
							<span className={'avatar square'}>
								{input.clinicLogo ? (
									<img src={imageUrl(input.clinicLogo, REACT_APP_API_URL)} alt={''} />
								) : (
									initials(input.clinicName)
								)}
							</span>
							<div className={'photo-text'}>
								<span>{t('Shown on cards, in chat and on bookings')}</span>
								<Button
									variant={'outlined'}
									size={'small'}
									disabled={uploading}
									onClick={() => logoRef.current?.click()}
								>
									{t('Change logo')}
								</Button>
								<input
									ref={logoRef}
									type={'file'}
									accept={UPLOAD_TYPES.join(',')}
									hidden
									onChange={(event) => fileHandler(event, 'logo')}
								/>
							</div>
						</div>
						<div className={'photo-picks'}>
							{(input.clinicImages ?? []).map((path) => (
								<span key={path} className={'thumb'}>
									<img src={imageUrl(path, REACT_APP_API_URL)} alt={''} />
									<IconButton
										size={'small'}
										aria-label={t('Remove photo')}
										onClick={() =>
											inputHandler(
												'clinicImages',
												(input.clinicImages ?? []).filter((item) => item !== path),
											)
										}
									>
										<CloseRoundedIcon />
									</IconButton>
								</span>
							))}
							{(input.clinicImages ?? []).length < PHOTOS_MAX && (
								<button
									type={'button'}
									className={'thumb add'}
									disabled={uploading}
									onClick={() => photoRef.current?.click()}
								>
									<AddPhotoAlternateOutlinedIcon />
									{uploading ? t('Uploading…') : t('Add photo')}
								</button>
							)}
							<input
								ref={photoRef}
								type={'file'}
								accept={UPLOAD_TYPES.join(',')}
								hidden
								onChange={(event) => fileHandler(event, 'photo')}
							/>
						</div>
						<span className={'hint'}>{t('Reception, rooms and devices · no before/after photos')}</span>
					</Box>

					<Box className={'card'}>
						<h2>{t('Clinic information')}</h2>
						<div className={'fields'}>
							<TextField
								label={t('Clinic name (English)')}
								value={input.clinicName ?? ''}
								disabled={locked('clinicName')}
								helperText={locked('clinicName') ? lockedHint : undefined}
								onChange={(event) => inputHandler('clinicName', event.target.value)}
								inputProps={{ maxLength: 100 }}
							/>
							<TextField
								label={t('Name on the signboard')}
								value={input.clinicNameKo ?? ''}
								disabled={locked('clinicNameKo')}
								onChange={(event) => inputHandler('clinicNameKo', event.target.value)}
								inputProps={{ maxLength: 100 }}
							/>
							<TextField
								select
								label={t('Specialty')}
								value={input.clinicSpecialty ?? ''}
								onChange={(event) => inputHandler('clinicSpecialty', event.target.value as Specialty)}
							>
								{Object.values(Specialty).map((specialty) => (
									<MenuItem key={specialty} value={specialty}>
										{t(`specialty.${specialty}`)}
									</MenuItem>
								))}
							</TextField>
							<TextField
								select
								label={t('District')}
								value={input.clinicDistrict ?? ''}
								disabled={locked('clinicDistrict')}
								onChange={(event) => inputHandler('clinicDistrict', event.target.value as District)}
							>
								{Object.values(District).map((district) => (
									<MenuItem key={district} value={district}>
										{t(`district.${district}`)}
									</MenuItem>
								))}
							</TextField>
							<TextField
								className={'wide'}
								label={t('Address')}
								value={input.clinicAddress ?? ''}
								disabled={locked('clinicAddress')}
								helperText={locked('clinicAddress') ? lockedHint : undefined}
								onChange={(event) => inputHandler('clinicAddress', event.target.value)}
								inputProps={{ maxLength: 200 }}
							/>
							<TextField
								label={t('Clinic phone')}
								value={input.clinicPhone ?? ''}
								placeholder={'+82 2 1234 5678'}
								error={phoneError}
								helperText={phoneError ? t('Please enter a valid phone number!') : undefined}
								onChange={(event) => {
									setPhoneError(false);
									inputHandler('clinicPhone', event.target.value);
								}}
							/>
							<TextField label={t('Account email')} value={user.memberEmail} disabled />
						</div>
						<TextField
							label={t('About the clinic')}
							multiline
							minRows={4}
							value={input.clinicDesc ?? ''}
							onChange={(event) => inputHandler('clinicDesc', event.target.value)}
							inputProps={{ maxLength: DESC_MAX }}
						/>
					</Box>

					<Box className={'card'}>
						<h2>{t('Opening hours')}</h2>
						<div className={'hours'}>
							{hours.map((hour) => (
								<div key={hour.day} className={'hour-row'}>
									<span className={'day'}>{dayLabels(addDaysKey('2026-10-11', hour.day), router.locale).weekday}</span>
									<Switch
										checked={!hour.closed}
										onChange={(event) => hourHandler(hour.day, { closed: !event.target.checked })}
										inputProps={{ 'aria-label': t('Open') }}
									/>
									{hour.closed ? (
										<span className={'closed'}>{t('Closed')}</span>
									) : (
										<>
											{(['open', 'close'] as const).map((name) => (
												<TextField
													key={name}
													select
													size={'small'}
													value={hour[name]}
													inputProps={{ 'aria-label': name === 'open' ? t('Opens') : t('Closes') }}
													onChange={(event) => hourHandler(hour.day, { [name]: event.target.value })}
												>
													{TIMES.map((time) => (
														<MenuItem key={time} value={time}>
															{time}
														</MenuItem>
													))}
												</TextField>
											))}
										</>
									)}
								</div>
							))}
						</div>
						<span className={'hint'}>{t('Seoul time. Slots can only be added on open days.')}</span>
					</Box>

					<Box className={'card'}>
						<h2>{t('Languages')}</h2>
						{(['clinicLangs', 'clinicInterpreterLangs'] as const).map((name) => (
							<div key={name} className={'lang-group'}>
								<span className={'label'}>
									{name === 'clinicLangs' ? t('Languages at reception') : t('Interpreters')}
								</span>
								<div className={'chip-picks'}>
									{LANGUAGES.filter((lang) => name === 'clinicLangs' || lang.code !== Language.KO).map((lang) => (
										<button
											key={lang.code}
											type={'button'}
											aria-pressed={(input[name] ?? []).includes(lang.code)}
											onClick={() => toggleLang(name, lang.code)}
										>
											{lang.label}
										</button>
									))}
								</div>
							</div>
						))}
					</Box>

					<Box className={'form-actions'}>
						<Button type={'submit'} variant={'contained'} disabled={saving || uploading}>
							{t('Save changes')}
						</Button>
					</Box>
				</div>

				<aside className={'side-cards'}>
					<Box className={'card'}>
						<h2>{t('Verification')}</h2>
						{clinic?.clinicStatus && (
							<StatusChip status={clinic.clinicStatus} label={t(`clinicStatus.${clinic.clinicStatus}`)} />
						)}
						<span className={'hint'}>
							{clinic?.verifiedAt
								? t('Approved on {{date}}', { date: seoulTime(clinic.verifiedAt, router.locale, false) })
								: clinic?.submittedAt
									? t('Sent on {{date}}', { date: seoulTime(clinic.submittedAt, router.locale, false) })
									: ''}
						</span>
						{clinic?.clinicReviewNote && clinic.clinicStatus !== ClinicStatus.PENDING && (
							<p className={'note'}>
								{t('Note from MedVia')}: {clinic.clinicReviewNote}
							</p>
						)}
						{clinic?.clinicStatus === ClinicStatus.CHANGES_REQUESTED && (
							<Button variant={'contained'} disabled={resubmitting} onClick={resubmitHandler}>
								{t('Send for review again')}
							</Button>
						)}
						{verified && (
							<span className={'hint'}>
								{t('The name, signboard name, district and address stay as MedVia checked them.')}
							</span>
						)}
					</Box>
					<Box className={'card'}>
						<h2>{t('Notifications')}</h2>
						{(
							[
								['bookingUpdates', t('New booking requests and changes')],
								['chatMessages', t('New patient messages')],
							] as const
						).map(([key, label]) => (
							<label key={key} className={'switch-row'}>
								<span className={'text'}>
									<strong>{label}</strong>
									<span>{t('On the site, under the bell')}</span>
								</span>
								<Switch
									checked={notify[key]}
									onChange={(event) => setNotify({ ...notify, [key]: event.target.checked })}
								/>
							</label>
						))}
					</Box>
				</aside>
			</Box>
		</ClinicFrame>
	);
};

export default withLayoutBasic(ClinicProfile);
