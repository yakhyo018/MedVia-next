import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton, Stack, TextField } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import StatusChip from '../../libs/components/common/StatusChip';
import { CATEGORY_LABEL, INQUIRY_STATUS } from '../../libs/components/cs/csLabels';
import { GET_INQUIRY } from '../../apollo/user/query';
import { ADD_INQUIRY_MESSAGE } from '../../apollo/user/mutation';
import { sessionReadyVar, userVar } from '../../apollo/store';
import { Inquiry } from '../../libs/types/cs/cs';
import { InquirySender, InquiryStatus } from '../../libs/enums/cs.enum';
import { Language } from '../../libs/enums/common.enum';
import { ClientMessages, LANGUAGES } from '../../libs/config';
import { sweetLoginConfirmAlert, sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { isObjectId, seoulClock, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const MESSAGE_MAX = 3000;
const langLabel = (code: Language) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code;

/** One 1:1 inquiry: the question, the team's replies, and a box to add a message until it is resolved. */
const InquiryThread: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [text, setText] = useState<string>('');
	const inquiryId = isObjectId(router.query.id) ? router.query.id : '';

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_INQUIRY, {
		variables: { inquiryId },
		fetchPolicy: 'cache-and-network',
		skip: !inquiryId || !user._id,
	});
	const [addInquiryMessage, { loading: sending }] = useMutation(ADD_INQUIRY_MESSAGE);
	const inquiry: Inquiry | undefined = data?.getInquiry;

	/** LIFECYCLES **/
	useEffect(() => {
		if (!sessionReady || user._id) return;
		sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED).then((login) =>
			router.replace(login ? { pathname: '/account/join', query: { referrer: router.asPath } } : '/cs'),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionReady, user._id]);

	/** HANDLERS **/
	const sendHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const body = text.trim();
		if (!body || !inquiry) return;
		try {
			await addInquiryMessage({
				variables: { input: { inquiryId: inquiry._id, text: body, lang: inquiry.inquiryLang } },
			});
			setText('');
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const when = (value: Date) => `${seoulTime(value, router.locale, false)} · ${seoulClock(value)}`;

	let body: React.ReactNode;
	if (!router.isReady || !user._id || (loading && !inquiry)) {
		body = <Skeleton variant={'rounded'} height={360} />;
	} else if (!inquiry) {
		body = (
			<EmptyState
				title={t('Inquiry not found')}
				action={
					<Button variant={'contained'} LinkComponent={Link} href={'/cs?tab=inquiry'}>
						{t('My inquiries')}
					</Button>
				}
			/>
		);
	} else {
		const status = INQUIRY_STATUS[inquiry.inquiryStatus];
		body = (
			<Box className={'inquiry-thread card'}>
				<div className={'head'}>
					<div>
						<span className={'category'}>{t(CATEGORY_LABEL[inquiry.inquiryCategory])}</span>
						<h1>{inquiry.inquiryTitle}</h1>
						<span className={'meta'}>
							{inquiry.bookingCode && `#${inquiry.bookingCode} · `}
							{t('Reply in {{lang}}', { lang: langLabel(inquiry.inquiryReplyLang) })}
						</span>
					</div>
					<StatusChip status={status.tone} label={t(status.label)} />
				</div>
				<div className={'messages'}>
					<div className={'message mine'}>
						<p>{inquiry.inquiryContent}</p>
						<time>{when(inquiry.createdAt)}</time>
					</div>
					{inquiry.inquiryMessages.map((message, index) => {
						const mine = message.senderType === InquirySender.PATIENT;
						return (
							<div key={index} className={`message ${mine ? 'mine' : 'team'}`}>
								{!mine && <strong>{t('MedVia support')}</strong>}
								<p>{message.text}</p>
								<time>{when(message.createdAt)}</time>
							</div>
						);
					})}
					{inquiry.inquiryMessages.length === 0 && (
						<p className={'hint'}>
							{t('We reply within one business day. You will see the answer here and under the bell.')}
						</p>
					)}
				</div>
				{inquiry.inquiryStatus === InquiryStatus.RESOLVED ? (
					<p className={'hint'}>
						{t('This inquiry is resolved.')} <Link href={'/cs?tab=inquiry'}>{t('Send a new one')}</Link>
					</p>
				) : (
					<form className={'reply'} onSubmit={sendHandler}>
						<TextField
							multiline
							minRows={2}
							fullWidth
							value={text}
							placeholder={t('Add a message…')}
							onChange={(event) => setText(event.target.value)}
							inputProps={{ maxLength: MESSAGE_MAX, 'aria-label': t('Message') }}
						/>
						<Button type={'submit'} variant={'contained'} disabled={sending || !text.trim()}>
							{t('Send')}
						</Button>
					</form>
				)}
			</Box>
		);
	}

	return (
		<Stack className={'article-page'}>
			<Stack className={'container'}>
				<nav className={'crumbs'} aria-label={t('Breadcrumb')}>
					<Link href={'/'}>{t('Home')}</Link>
					<span>/</span>
					<Link href={'/cs'}>{t('Help center')}</Link>
					<span>/</span>
					<Link href={'/cs?tab=inquiry'}>{t('1:1 Inquiry')}</Link>
				</nav>
				<Link href={'/cs?tab=inquiry'} className={'back-link'}>
					<ChevronLeftRoundedIcon />
					{t('My inquiries')}
				</Link>
				{body}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(InquiryThread);
