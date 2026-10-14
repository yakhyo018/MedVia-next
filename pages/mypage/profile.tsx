import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, MenuItem, Skeleton, Switch, TextField } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../libs/components/mypage/MyPageFrame';
import ChangePasswordDialog from '../../libs/components/mypage/ChangePasswordDialog';
import useUpload, { UPLOAD_TYPES } from '../../libs/hooks/useUpload';
import { GET_MY_PROFILE } from '../../apollo/user/query';
import { UPDATE_MEMBER } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { logOut, updateUserInfo } from '../../libs/auth';
import { Member, NotifySettings } from '../../libs/types/member/member';
import { MemberUpdate } from '../../libs/types/member/member.update';
import { Language } from '../../libs/enums/common.enum';
import { MemberAuthType, MemberType } from '../../libs/enums/member.enum';
import {
	ClientMessages,
	FULL_NAME_MAX,
	FULL_NAME_MIN,
	LANGUAGES,
	PHONE_PATTERN,
	REACT_APP_API_URL,
} from '../../libs/config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { imageUrl, initials } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** Where MedVia's patients come from first, then Korea and a few others. ISO 3166-1 alpha-2. */
const COUNTRIES = ['UZ', 'KZ', 'KG', 'TJ', 'TM', 'RU', 'AZ', 'MN', 'KR', 'US', 'GB', 'DE', 'TR', 'AE', 'CN'];

const NOTIFY_ROWS: { key: keyof NotifySettings; title: string; text: string }[] = [
	{ key: 'bookingUpdates', title: 'Booking updates', text: 'Confirmations, declines and changes' },
	{ key: 'visitReminders', title: 'Visit reminders', text: 'The day before and on the day of your visit' },
	{ key: 'chatMessages', title: 'Chat messages', text: 'New messages from clinics' },
];

interface ProfileForm {
	memberFullName: string;
	memberPhone: string;
	memberCountry: string;
	memberLang: Language;
	memberNotify: NotifySettings;
}

const DEFAULT_INPUT: ProfileForm = {
	memberFullName: '',
	memberPhone: '',
	memberCountry: '',
	memberLang: Language.EN,
	memberNotify: { bookingUpdates: true, visitReminders: true, chatMessages: true },
};

/** "My Profile": personal information, in-site notifications, password. Email and type are fixed. */
const MyProfile: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { upload, uploading } = useUpload();
	const fileRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState<ProfileForm>(DEFAULT_INPUT);
	const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
	const [passwordOpen, setPasswordOpen] = useState<boolean>(false);
	const isPatient = user.memberType === MemberType.USER;

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_MY_PROFILE, { fetchPolicy: 'network-only', skip: !isPatient });
	const [updateMember, { loading: saving }] = useMutation(UPDATE_MEMBER);
	const profile: Member | undefined = data?.getMyProfile;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!profile) return;
		setInput({
			memberFullName: profile.memberFullName,
			memberPhone: profile.memberPhone ?? '',
			memberCountry: profile.memberCountry ?? '',
			memberLang: profile.memberLang,
			memberNotify: {
				bookingUpdates: profile.memberNotify.bookingUpdates,
				visitReminders: profile.memberNotify.visitReminders,
				chatMessages: profile.memberNotify.chatMessages,
			},
		});
	}, [profile]);

	/** HANDLERS **/
	const inputHandler = <K extends keyof ProfileForm>(name: K, value: ProfileForm[K]) => {
		setInput({ ...input, [name]: value });
		if (errors[name]) setErrors({ ...errors, [name]: undefined });
	};

	const photoHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = '';
		if (!file) return;
		try {
			const memberImage = await upload(file, 'member');
			await updateMember({ variables: { input: { memberImage } } });
			await updateUserInfo();
			await sweetTopSmallSuccessAlert(t('Photo updated'));
		} catch (err) {
			await sweetMixinErrorAlert(t((err as Error).message));
		}
	};

	const saveHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const found: Partial<Record<keyof ProfileForm, string>> = {};
		const name = input.memberFullName.trim();
		const phone = input.memberPhone.trim();
		if (name.length < FULL_NAME_MIN || name.length > FULL_NAME_MAX)
			found.memberFullName = ClientMessages.FULL_NAME_INVALID;
		if (phone && !PHONE_PATTERN.test(phone)) found.memberPhone = ClientMessages.PHONE_INVALID;
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		try {
			// The API cannot store an empty phone (it checks the pattern): an emptied field is left as it was.
			const update: MemberUpdate = {
				memberFullName: name,
				memberLang: input.memberLang,
				memberNotify: input.memberNotify,
				...(phone ? { memberPhone: phone } : {}),
				...(input.memberCountry ? { memberCountry: input.memberCountry } : {}),
			};
			await updateMember({ variables: { input: update } });
			await updateUserInfo();
			await sweetTopSmallSuccessAlert(t('Profile saved'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const countryName = (code: string) => {
		try {
			return new Intl.DisplayNames([router.locale ?? 'en'], { type: 'region' }).of(code) ?? code;
		} catch {
			return code;
		}
	};

	const errorText = (name: keyof ProfileForm) => (errors[name] ? t(errors[name] as string) : undefined);

	return (
		<MyPageFrame title={t('My Profile')} className={'my-profile'}>
			{loading && !profile ? (
				<Skeleton variant={'rounded'} height={520} />
			) : (
				<Box component={'form'} noValidate onSubmit={saveHandler} className={'profile-form'}>
					<Box className={'card'}>
						<h2>{t('Personal information')}</h2>
						<div className={'photo-row'}>
							<span className={'avatar'}>
								{user.memberImage ? (
									<img src={imageUrl(user.memberImage, REACT_APP_API_URL)} alt={''} />
								) : (
									initials(user.memberFullName)
								)}
							</span>
							<div className={'photo-text'}>
								<span>{t('Shown to clinics in chat and in the community')}</span>
								<Button
									variant={'outlined'}
									size={'small'}
									disabled={uploading}
									onClick={() => fileRef.current?.click()}
								>
									{uploading ? t('Uploading…') : t('Change photo')}
								</Button>
								<input ref={fileRef} type={'file'} accept={UPLOAD_TYPES.join(',')} hidden onChange={photoHandler} />
							</div>
						</div>
						<div className={'fields'}>
							<TextField
								label={t('Full name')}
								value={input.memberFullName}
								onChange={(event) => inputHandler('memberFullName', event.target.value)}
								error={Boolean(errors.memberFullName)}
								helperText={errorText('memberFullName')}
								inputProps={{ maxLength: FULL_NAME_MAX }}
								autoComplete={'name'}
							/>
							<TextField
								label={t('Phone (optional)')}
								value={input.memberPhone}
								onChange={(event) => inputHandler('memberPhone', event.target.value)}
								error={Boolean(errors.memberPhone)}
								helperText={errorText('memberPhone')}
								placeholder={'+998 90 123 45 67'}
								autoComplete={'tel'}
							/>
							<TextField
								label={t('Email')}
								value={profile?.memberEmail ?? user.memberEmail}
								InputProps={{ readOnly: true }}
								helperText={t('The email cannot be changed')}
								className={'read-only'}
							/>
							<TextField
								select
								label={t('Country')}
								value={input.memberCountry}
								onChange={(event) => inputHandler('memberCountry', event.target.value)}
							>
								{COUNTRIES.map((code) => (
									<MenuItem key={code} value={code}>
										{countryName(code)}
									</MenuItem>
								))}
							</TextField>
							<TextField
								select
								label={t('Preferred language')}
								value={input.memberLang}
								onChange={(event) => inputHandler('memberLang', event.target.value as Language)}
								helperText={t('Clinic messages are translated into this language')}
							>
								{LANGUAGES.map((lang) => (
									<MenuItem key={lang.code} value={lang.code}>
										{lang.label}
									</MenuItem>
								))}
							</TextField>
						</div>
					</Box>

					<Box className={'card'}>
						<h2>{t('Notifications')}</h2>
						<div className={'switches'}>
							{NOTIFY_ROWS.map((row) => (
								<label key={row.key} className={'switch-row'}>
									<span className={'text'}>
										<strong>{t(row.title)}</strong>
										<span>{t(row.text)}</span>
									</span>
									<Switch
										checked={input.memberNotify[row.key]}
										onChange={(event) =>
											inputHandler('memberNotify', { ...input.memberNotify, [row.key]: event.target.checked })
										}
									/>
								</label>
							))}
						</div>
						<p className={'hint'}>
							{t('Notifications appear on the site, under the bell icon. MedVia doesn’t send email or SMS.')}
						</p>
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
						<Button variant={'outlined'} color={'error'} className={'logout'} onClick={() => logOut()}>
							{t('Log out')}
						</Button>
					</Box>

					<Box className={'form-actions'}>
						<Button type={'submit'} variant={'contained'} disabled={saving}>
							{t('Save changes')}
						</Button>
					</Box>
				</Box>
			)}
			<ChangePasswordDialog
				open={passwordOpen}
				hasPassword={(profile?.memberAuthType ?? user.memberAuthType) !== MemberAuthType.GOOGLE}
				onClose={() => setPasswordOpen(false)}
			/>
		</MyPageFrame>
	);
};

export default withLayoutBasic(MyProfile);
