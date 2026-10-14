import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, IconButton, InputAdornment, MenuItem, Skeleton, TextField } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import withLayoutBasic from '../../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../../libs/components/dashboard/ClinicFrame';
import EmptyState from '../../../libs/components/common/EmptyState';
import useUpload, { UPLOAD_TYPES } from '../../../libs/hooks/useUpload';
import { GET_MY_CLINIC_DOCTORS, GET_MY_CLINIC_TREATMENTS } from '../../../apollo/user/query';
import { CREATE_TREATMENT, UPDATE_TREATMENT } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { Treatment, TreatmentCreateInput } from '../../../libs/types/treatment/treatment';
import { Doctor } from '../../../libs/types/doctor/doctor';
import { TreatmentCategory, TreatmentStatus } from '../../../libs/enums/treatment.enum';
import { DoctorStatus } from '../../../libs/enums/doctor.enum';
import { Language } from '../../../libs/enums/common.enum';
import { MemberType } from '../../../libs/enums/member.enum';
import { LANGUAGES, REACT_APP_API_URL } from '../../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { formatKrw, imageUrl, initials, isObjectId } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** The API's limits (TreatmentCreateInput). */
const NAME_MIN = 2;
const NAME_MAX = 80;
const TEXT_MAX = 2000;
const PHOTOS_MAX = 6;
const DURATIONS = [10, 20, 30, 40, 45, 50, 60, 90, 120, 180, 240];

const DEFAULT_INPUT: TreatmentCreateInput = {
	treatmentName: '',
	treatmentCategory: TreatmentCategory.CONSULTATION,
	treatmentDuration: 30,
	treatmentPrice: 0,
	treatmentPriceNote: '',
	treatmentDesc: '',
	treatmentAftercare: '',
	treatmentLangs: [Language.KO, Language.EN],
	treatmentImages: [],
	doctorIds: [],
};

type FormErrors = Partial<Record<keyof TreatmentCreateInput, string>>;

/**
 * "Add Treatment" and its edit (`?id=`). A new treatment waits for MedVia; on a live one the
 * name, category, price, description and photos wait as a draft while the rest applies at once.
 */
const TreatmentEdit: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { upload, uploading } = useUpload();
	const fileRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState<TreatmentCreateInput>(DEFAULT_INPUT);
	const [errors, setErrors] = useState<FormErrors>({});
	const [filledId, setFilledId] = useState<string>('');
	const isClinic = user.memberType === MemberType.AGENT;
	const treatmentId = isObjectId(router.query.id) ? router.query.id : '';

	/** APOLLO REQUESTS **/
	const treatmentsQuery = useQuery(GET_MY_CLINIC_TREATMENTS, { fetchPolicy: 'cache-and-network', skip: !isClinic });
	const { data: doctorsData } = useQuery(GET_MY_CLINIC_DOCTORS, { fetchPolicy: 'cache-first', skip: !isClinic });
	const [createTreatment, { loading: creating }] = useMutation(CREATE_TREATMENT);
	const [updateTreatment, { loading: updating }] = useMutation(UPDATE_TREATMENT);
	const treatment: Treatment | undefined = treatmentsQuery.data?.getMyClinicTreatments?.find(
		(item: Treatment) => item._id === treatmentId,
	);
	const doctors: Doctor[] = (doctorsData?.getMyClinicDoctors ?? []).filter(
		(doctor: Doctor) => doctor.doctorStatus !== DoctorStatus.DELETE,
	);
	const live =
		treatment?.treatmentStatus === TreatmentStatus.ACTIVE || treatment?.treatmentStatus === TreatmentStatus.HIDDEN;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!treatment || filledId === treatment._id) return;
		// A pending draft is what the clinic last wrote: edit that, not the live text.
		const draft = treatment.treatmentDraft;
		setInput({
			treatmentName: draft?.treatmentName ?? treatment.treatmentName,
			treatmentCategory: (draft?.treatmentCategory ?? treatment.treatmentCategory) as TreatmentCategory,
			treatmentDuration: treatment.treatmentDuration,
			treatmentPrice: draft?.treatmentPrice ?? treatment.treatmentPrice,
			treatmentPriceNote: draft?.treatmentPriceNote ?? treatment.treatmentPriceNote ?? '',
			treatmentDesc: draft?.treatmentDesc ?? treatment.treatmentDesc ?? '',
			treatmentAftercare: treatment.treatmentAftercare ?? '',
			treatmentLangs: treatment.treatmentLangs ?? [],
			treatmentImages: draft?.treatmentImages ?? treatment.treatmentImages ?? [],
			doctorIds: treatment.doctorIds ?? [],
		});
		setFilledId(treatment._id);
	}, [treatment, filledId]);

	useEffect(() => {
		// "Add Treatment" from the menu while editing: start empty again.
		if (router.isReady && !treatmentId && filledId) {
			setInput(DEFAULT_INPUT);
			setFilledId('');
		}
	}, [router.isReady, treatmentId, filledId]);

	/** HANDLERS **/
	const inputHandler = <K extends keyof TreatmentCreateInput>(name: K, value: TreatmentCreateInput[K]) => {
		setInput({ ...input, [name]: value });
		if (errors[name]) setErrors({ ...errors, [name]: undefined });
	};

	const toggle = <V,>(list: V[] | undefined, value: V): V[] =>
		(list ?? []).includes(value) ? (list ?? []).filter((item) => item !== value) : [...(list ?? []), value];

	const photoHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		try {
			const path = await upload(file, 'clinic');
			inputHandler('treatmentImages', [...(input.treatmentImages ?? []), path]);
		} catch (err) {
			await sweetMixinErrorAlert(t((err as Error).message));
		}
	};

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const found: FormErrors = {};
		const name = input.treatmentName.trim();
		if (name.length < NAME_MIN || name.length > NAME_MAX) found.treatmentName = t('Write 2 to 80 characters');
		if (!input.treatmentPrice || input.treatmentPrice < 0) found.treatmentPrice = t('Enter the price in won');
		if (input.doctorIds.length === 0) found.doctorIds = t('Choose at least one doctor');
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		try {
			const fields = { ...input, treatmentName: name };
			if (treatment) {
				await updateTreatment({ variables: { input: { treatmentId: treatment._id, ...fields } } });
				await sweetTopSmallSuccessAlert(
					live ? t('Saved. Changes to the page text wait for MedVia’s check.') : t('Saved'),
				);
			} else {
				await createTreatment({ variables: { input: fields } });
				await sweetTopSmallSuccessAlert(t('Sent for review. Patients see it once MedVia approves it.'));
			}
			await treatmentsQuery.refetch();
			await router.push('/dashboard/treatments');
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const title = treatmentId ? t('Edit treatment') : t('Add Treatment');
	const back = { href: '/dashboard/treatments', label: t('Treatments') };

	if (treatmentId && treatmentsQuery.loading && !treatment) {
		return (
			<ClinicFrame title={title} back={back}>
				<Skeleton variant={'rounded'} height={520} />
			</ClinicFrame>
		);
	}
	if (treatmentId && !treatment) {
		return (
			<ClinicFrame title={title} back={back}>
				<EmptyState title={t('Treatment not found')} />
			</ClinicFrame>
		);
	}

	const chosenDoctors = doctors.filter((doctor) => input.doctorIds.includes(doctor._id));
	const photo = input.treatmentImages?.[0];

	return (
		<ClinicFrame title={title} back={back} className={'treatment-edit'}>
			{treatment?.treatmentReviewNote && treatment.treatmentStatus === TreatmentStatus.CHANGES_REQUESTED && (
				<div className={'workspace-notice danger'}>
					<strong>{t('MedVia asked for changes')}</strong>
					<span>{treatment.treatmentReviewNote}</span>
				</div>
			)}
			<Box component={'form'} noValidate onSubmit={submitHandler} className={'treatment-form'}>
				<div className={'form-main'}>
					<Box className={'card'}>
						<h2>{t('Treatment details')}</h2>
						<TextField
							label={t('Treatment name')}
							value={input.treatmentName}
							onChange={(event) => inputHandler('treatmentName', event.target.value)}
							error={Boolean(errors.treatmentName)}
							helperText={errors.treatmentName}
							inputProps={{ maxLength: NAME_MAX }}
						/>
						<div className={'pair'}>
							<TextField
								select
								label={t('Category')}
								value={input.treatmentCategory}
								onChange={(event) => inputHandler('treatmentCategory', event.target.value as TreatmentCategory)}
							>
								{Object.values(TreatmentCategory).map((category) => (
									<MenuItem key={category} value={category}>
										{t(`category.${category}`)}
									</MenuItem>
								))}
							</TextField>
							<TextField
								select
								label={t('Duration')}
								value={input.treatmentDuration}
								onChange={(event) => inputHandler('treatmentDuration', Number(event.target.value))}
							>
								{DURATIONS.map((minutes) => (
									<MenuItem key={minutes} value={minutes}>
										{t('{{count}} min', { count: minutes })}
									</MenuItem>
								))}
							</TextField>
						</div>

						<span className={'label'}>{t('Doctors who perform this treatment')}</span>
						<div className={'chip-picks'}>
							{doctors.map((doctor) => (
								<button
									key={doctor._id}
									type={'button'}
									aria-pressed={input.doctorIds.includes(doctor._id)}
									onClick={() => inputHandler('doctorIds', toggle(input.doctorIds, doctor._id))}
								>
									<span className={'mini-avatar'}>{initials(doctor.doctorName)}</span>
									{t('Dr.')} {doctor.doctorName}
								</button>
							))}
						</div>
						<span className={errors.doctorIds ? 'field-error' : 'hint'}>
							{errors.doctorIds ?? t('Patients choose one of these doctors when they book. At least one is required.')}
						</span>
						{doctors.length === 0 && (
							<Link href={'/dashboard/doctors'} className={'inline-link'}>
								{t('Add a doctor first')}
							</Link>
						)}

						<div className={'pair'}>
							<TextField
								label={t('Price from')}
								type={'number'}
								value={input.treatmentPrice || ''}
								onChange={(event) => inputHandler('treatmentPrice', Math.max(0, Number(event.target.value)))}
								error={Boolean(errors.treatmentPrice)}
								helperText={errors.treatmentPrice}
								InputProps={{ startAdornment: <InputAdornment position={'start'}>₩</InputAdornment> }}
								inputProps={{ min: 0, step: 1000 }}
							/>
							<TextField
								label={t('Price note')}
								value={input.treatmentPriceNote}
								placeholder={t('Per session, before tax')}
								onChange={(event) => inputHandler('treatmentPriceNote', event.target.value)}
								inputProps={{ maxLength: 120 }}
							/>
						</div>
						<TextField
							label={t('Description')}
							multiline
							minRows={4}
							value={input.treatmentDesc}
							onChange={(event) => inputHandler('treatmentDesc', event.target.value)}
							inputProps={{ maxLength: TEXT_MAX }}
						/>

						<span className={'label'}>{t('Consultation languages')}</span>
						<div className={'chip-picks'}>
							{LANGUAGES.map((lang) => (
								<button
									key={lang.code}
									type={'button'}
									aria-pressed={(input.treatmentLangs ?? []).includes(lang.code)}
									onClick={() => inputHandler('treatmentLangs', toggle(input.treatmentLangs, lang.code))}
								>
									{lang.label}
								</button>
							))}
						</div>

						<TextField
							label={t('Aftercare notes (sent to the patient after the visit)')}
							multiline
							minRows={2}
							value={input.treatmentAftercare}
							onChange={(event) => inputHandler('treatmentAftercare', event.target.value)}
							inputProps={{ maxLength: TEXT_MAX }}
						/>

						<span className={'label'}>{t('Photos of the room or device')}</span>
						<div className={'photo-picks'}>
							{(input.treatmentImages ?? []).map((path) => (
								<span key={path} className={'thumb'}>
									<img src={imageUrl(path, REACT_APP_API_URL)} alt={''} />
									<IconButton
										size={'small'}
										aria-label={t('Remove photo')}
										onClick={() =>
											inputHandler(
												'treatmentImages',
												(input.treatmentImages ?? []).filter((item) => item !== path),
											)
										}
									>
										<CloseRoundedIcon />
									</IconButton>
								</span>
							))}
							{(input.treatmentImages ?? []).length < PHOTOS_MAX && (
								<button
									type={'button'}
									className={'thumb add'}
									disabled={uploading}
									onClick={() => fileRef.current?.click()}
								>
									<AddPhotoAlternateOutlinedIcon />
									{uploading ? t('Uploading…') : t('Add photo')}
								</button>
							)}
							<input ref={fileRef} type={'file'} accept={UPLOAD_TYPES.join(',')} hidden onChange={photoHandler} />
						</div>
						<span className={'hint'}>{t('No before/after photos — see the medical ad rules.')}</span>
					</Box>
					<Box className={'form-actions'}>
						<Button variant={'outlined'} LinkComponent={Link} href={'/dashboard/treatments'}>
							{t('Cancel')}
						</Button>
						<Button type={'submit'} variant={'contained'} disabled={creating || updating || uploading}>
							{treatment ? t('Save changes') : t('Submit for review')}
						</Button>
					</Box>
				</div>

				<aside className={'preview'}>
					<span className={'label'}>{t('Preview')}</span>
					<div className={'preview-card'}>
						<span className={'photo'}>
							{photo ? <img src={imageUrl(photo, REACT_APP_API_URL)} alt={''} /> : t('Treatment photo')}
						</span>
						<span className={'body'}>
							<small>{t(`category.${input.treatmentCategory}`)}</small>
							<strong>{input.treatmentName || t('Treatment name')}</strong>
							<span>
								{t('{{count}} min', { count: input.treatmentDuration })}
								{chosenDoctors.length > 0 &&
									` · ${chosenDoctors.map((doctor) => `${t('Dr.')} ${doctor.doctorName.split(' ')[0]}`).join(', ')}`}
							</span>
							<span className={'price'}>
								{t('From')} <b>{formatKrw(input.treatmentPrice)}</b>
							</span>
						</span>
					</div>
					<p className={'hint'}>
						{t(
							'Medical ad rules: no before/after photos, no guaranteed results, no discounts tied to reviews. MedVia reviews new treatments before they go live.',
						)}
					</p>
				</aside>
			</Box>
		</ClinicFrame>
	);
};

export default withLayoutBasic(TreatmentEdit);
