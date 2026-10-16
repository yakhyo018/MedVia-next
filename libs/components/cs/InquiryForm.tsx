import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import { GET_BOOKINGS, GET_MY_INQUIRIES } from '../../../apollo/user/query';
import { CREATE_INQUIRY } from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import { Booking } from '../../types/booking/booking';
import { InquiryInput } from '../../types/cs/cs';
import { InquiryCategory } from '../../enums/cs.enum';
import { Language } from '../../enums/common.enum';
import { LANGUAGES, localeToLanguage } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { seoulTime } from '../../utils';
import { CATEGORY_LABEL } from './csLabels';

/** The API's limits (InquiryInput). */
const TITLE_MAX = 150;
const CONTENT_MIN = 5;
const CONTENT_MAX = 3000;

/** "Send an inquiry": a topic, an optional booking, the question, and the language to answer in. */
const InquiryForm = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const myLang = (user.memberLang || localeToLanguage(router.locale)) as Language;
	const [input, setInput] = useState<InquiryInput>({
		inquiryCategory: InquiryCategory.BOOKING,
		inquiryTitle: '',
		inquiryContent: '',
		inquiryLang: myLang,
		inquiryReplyLang: myLang,
		bookingId: '',
	});
	const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

	const { data } = useQuery(GET_BOOKINGS, {
		variables: { input: { page: 1, limit: 20 } },
		fetchPolicy: 'cache-and-network',
	});
	const [createInquiry, { loading }] = useMutation(CREATE_INQUIRY, {
		refetchQueries: [GET_MY_INQUIRIES],
	});
	const bookings: Booking[] = data?.getBookings?.list ?? [];

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const title = input.inquiryTitle.trim();
		const content = input.inquiryContent.trim();
		const found: typeof errors = {};
		if (title.length < 2) found.title = t('Write 2 to 150 characters');
		if (content.length < CONTENT_MIN) found.content = t('Write at least a few words');
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		try {
			const result = await createInquiry({
				variables: {
					input: {
						inquiryCategory: input.inquiryCategory,
						inquiryTitle: title,
						inquiryContent: content,
						inquiryLang: input.inquiryLang,
						inquiryReplyLang: input.inquiryReplyLang,
						...(input.bookingId ? { bookingId: input.bookingId } : {}),
					},
				},
			});
			await sweetTopSmallSuccessAlert(t('Inquiry sent. We reply within one business day.'));
			await router.push(`/cs/inquiry?id=${result.data.createInquiry._id}`);
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return (
		<Box component={'form'} noValidate onSubmit={submitHandler} className={'inquiry-form card'}>
			<h2>{t('Send an inquiry')}</h2>
			<div className={'pair'}>
				<TextField
					select
					label={t('Category')}
					value={input.inquiryCategory}
					onChange={(event) => setInput({ ...input, inquiryCategory: event.target.value as InquiryCategory })}
				>
					{Object.values(InquiryCategory).map((category) => (
						<MenuItem key={category} value={category}>
							{t(CATEGORY_LABEL[category])}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					label={t('Related booking (optional)')}
					value={input.bookingId}
					onChange={(event) => setInput({ ...input, bookingId: event.target.value })}
					SelectProps={{ displayEmpty: true }}
					InputLabelProps={{ shrink: true }}
				>
					<MenuItem value={''}>{t('No booking')}</MenuItem>
					{bookings.map((booking) => (
						<MenuItem key={booking._id} value={booking._id}>
							{booking.treatmentData?.treatmentName} · {seoulTime(booking.bookingDate, router.locale, false)} ·{' '}
							{booking.clinicData?.clinicName}
						</MenuItem>
					))}
				</TextField>
			</div>
			<TextField
				label={t('Title')}
				value={input.inquiryTitle}
				onChange={(event) => setInput({ ...input, inquiryTitle: event.target.value })}
				error={Boolean(errors.title)}
				helperText={errors.title}
				inputProps={{ maxLength: TITLE_MAX }}
			/>
			<TextField
				label={t('Message')}
				multiline
				minRows={5}
				value={input.inquiryContent}
				onChange={(event) => setInput({ ...input, inquiryContent: event.target.value })}
				error={Boolean(errors.content)}
				helperText={errors.content}
				inputProps={{ maxLength: CONTENT_MAX }}
			/>
			<div className={'pair'}>
				<TextField
					select
					label={t('Written in')}
					value={input.inquiryLang}
					onChange={(event) => setInput({ ...input, inquiryLang: event.target.value as Language })}
				>
					{LANGUAGES.map((lang) => (
						<MenuItem key={lang.code} value={lang.code}>
							{lang.label}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					label={t('Reply language')}
					value={input.inquiryReplyLang}
					onChange={(event) => setInput({ ...input, inquiryReplyLang: event.target.value as Language })}
				>
					{LANGUAGES.map((lang) => (
						<MenuItem key={lang.code} value={lang.code}>
							{lang.label}
						</MenuItem>
					))}
				</TextField>
			</div>
			<div className={'form-actions'}>
				<span className={'hint'}>{t('We reply within one business day')}</span>
				<Button type={'submit'} variant={'contained'} disabled={loading}>
					{t('Send inquiry')}
				</Button>
			</div>
		</Box>
	);
};

export default InquiryForm;
