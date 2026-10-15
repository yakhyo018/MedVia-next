import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Button, MenuItem, Skeleton, TextField } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import withLayoutAdmin from '../../../libs/components/layout/LayoutAdmin';
import AdminPills from '../../../libs/components/admin/AdminPills';
import AdminPager from '../../../libs/components/admin/AdminPager';
import StatusChip from '../../../libs/components/common/StatusChip';
import EmptyState from '../../../libs/components/common/EmptyState';
import { CATEGORY_LABEL, INQUIRY_STATUS } from '../../../libs/components/cs/csLabels';
import { ADMIN_I18N, ADMIN_NS, languageName } from '../../../libs/components/admin/adminText';
import useDeviceDetect from '../../../libs/hooks/useDeviceDetect';
import useUrlQuery from '../../../libs/hooks/useUrlQuery';
import { GET_ADMIN_INQUIRY, GET_INQUIRIES_BY_ADMIN } from '../../../apollo/admin/query';
import { RESOLVE_INQUIRY } from '../../../apollo/admin/mutation';
import { ADD_INQUIRY_MESSAGE } from '../../../apollo/user/mutation';
import { Inquiry } from '../../../libs/types/cs/cs';
import { InquirySender, InquiryStatus } from '../../../libs/enums/cs.enum';
import { Language } from '../../../libs/enums/common.enum';
import { LANGUAGES } from '../../../libs/config';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { initials, isObjectId, seoulTime } from '../../../libs/utils';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 10;
const REPLY_MAX = 2000;

/** The admin's word for a new inquiry is "New" (the patient sees "Sent"). */
const statusLabel = (status: InquiryStatus) => (status === InquiryStatus.NEW ? 'New' : INQUIRY_STATUS[status].label);

/**
 * 1:1 inquiries: the open ones on the left, the selected thread on the right (`?id=`). The
 * reply goes in the language the admin picks — by default the one the patient asked for.
 */
const AdminInquiries: NextPage = () => {
	const router = useRouter();
	const device = useDeviceDetect();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const [reply, setReply] = useState<string>('');
	const [replyLang, setReplyLang] = useState<Language>(Language.EN);
	const open = url.get('tab') !== 'all';
	const selectedId = isObjectId(url.get('id')) ? url.get('id') : '';
	const locale = router.locale ?? 'en';
	const mobile = device === 'mobile';

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_INQUIRIES_BY_ADMIN, {
		variables: { input: { page: url.page, limit: LIMIT, ...(open ? { open: true } : {}) } },
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const { data: openData, refetch: refetchOpen } = useQuery(GET_INQUIRIES_BY_ADMIN, {
		variables: { input: { page: 1, limit: 1, open: true } },
		fetchPolicy: 'cache-and-network',
	});
	const { data: detailData, loading: detailLoading } = useQuery(GET_ADMIN_INQUIRY, {
		variables: { inquiryId: selectedId },
		fetchPolicy: 'cache-and-network',
		skip: !selectedId,
	});
	const [addInquiryMessage, { loading: sending }] = useMutation(ADD_INQUIRY_MESSAGE);
	const [resolveInquiry, { loading: resolving }] = useMutation(RESOLVE_INQUIRY);
	const inquiries: Inquiry[] = data?.getInquiriesByAdmin?.list ?? [];
	const total: number = data?.getInquiriesByAdmin?.metaCounter?.[0]?.total ?? 0;
	const openTotal: number | undefined = openData?.getInquiriesByAdmin?.metaCounter?.[0]?.total;
	const inquiry: Inquiry | undefined = detailData?.getInquiry;
	const closed = inquiry?.inquiryStatus === InquiryStatus.RESOLVED;

	/** LIFECYCLES **/
	useEffect(() => {
		setReply('');
		if (inquiry) setReplyLang(inquiry.inquiryReplyLang ?? inquiry.inquiryLang);
	}, [inquiry?._id]); // eslint-disable-line react-hooks/exhaustive-deps

	/** HANDLERS **/
	const sendHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!inquiry || !reply.trim()) return;
		try {
			await addInquiryMessage({
				variables: { input: { inquiryId: inquiry._id, text: reply.trim(), lang: replyLang } },
			});
			setReply('');
			await Promise.all([refetch(), refetchOpen()]);
			await sweetTopSmallSuccessAlert(t('Reply sent'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const resolveHandler = async () => {
		if (!inquiry) return;
		const sure = await sweetConfirmAlert(
			t('Mark this inquiry as resolved? The patient can no longer reply.'),
			t('Resolve'),
		);
		if (!sure) return;
		try {
			await resolveInquiry({ variables: { inquiryId: inquiry._id } });
			await Promise.all([refetch(), refetchOpen()]);
			await sweetTopSmallSuccessAlert(t('Inquiry resolved'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const list = (
		<section className={'admin-card admin-inbox'}>
			<div className={'admin-card-head'}>
				<h2>{t('Inquiries')}</h2>
				<AdminPills
					pills={[
						{ key: 'open', label: t('Open'), count: openTotal },
						{ key: 'all', label: t('All') },
					]}
					active={open ? 'open' : 'all'}
					onChange={(key) => url.set({ tab: key === 'open' ? undefined : key, id: selectedId })}
				/>
			</div>
			{loading && !data ? (
				<Skeleton variant={'rounded'} height={300} />
			) : inquiries.length === 0 ? (
				<EmptyState title={open ? t('No open inquiries.') : t('No inquiries yet.')} />
			) : (
				<ul>
					{inquiries.map((item) => (
						<li key={item._id}>
							<button
								type={'button'}
								className={item._id === selectedId ? 'active' : ''}
								onClick={() => url.set({ id: item._id, page: url.page })}
							>
								<span className={'row'}>
									<span className={'admin-badge neutral'}>{t(CATEGORY_LABEL[item.inquiryCategory])}</span>
									<StatusChip
										status={INQUIRY_STATUS[item.inquiryStatus].tone}
										label={t(statusLabel(item.inquiryStatus))}
										size={'small'}
									/>
								</span>
								<strong>{item.inquiryTitle}</strong>
								<span className={'meta'}>
									{item.patientName ?? '—'} · {item.inquiryLang} · {seoulTime(item.updatedAt, locale)}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
			{total > LIMIT && (
				<AdminPager
					page={url.page}
					limit={LIMIT}
					total={total}
					shown={inquiries.length}
					onChange={(page) => url.set({ page, id: selectedId })}
				/>
			)}
		</section>
	);

	const thread = !selectedId ? (
		<section className={'admin-card'}>
			<EmptyState title={t('Choose an inquiry to read it.')} />
		</section>
	) : !inquiry ? (
		<section className={'admin-card'}>
			{detailLoading ? <Skeleton variant={'rounded'} height={320} /> : <EmptyState title={t('Inquiry not found')} />}
		</section>
	) : (
		<section className={'admin-card admin-thread'}>
			{mobile && (
				<button type={'button'} className={'admin-back'} onClick={() => url.set({ id: undefined, page: url.page })}>
					<ChevronLeftRoundedIcon />
					{t('Inquiries')}
				</button>
			)}
			<div className={'admin-card-head'}>
				<h2>{inquiry.inquiryTitle}</h2>
				<StatusChip
					status={INQUIRY_STATUS[inquiry.inquiryStatus].tone}
					label={t(statusLabel(inquiry.inquiryStatus))}
					size={'small'}
				/>
			</div>
			<div className={'who-row'}>
				<span className={'avatar'}>{initials(inquiry.patientName ?? '')}</span>
				<div>
					{inquiry.memberId ? (
						<a href={`/_admin/users/detail?id=${inquiry.memberId}`}>
							<strong>{inquiry.patientName ?? '—'}</strong>
						</a>
					) : (
						<strong>{inquiry.patientName ?? '—'}</strong>
					)}
					<span>
						{t(CATEGORY_LABEL[inquiry.inquiryCategory])} ·{' '}
						{t('writes in {{lang}}', { lang: languageName(inquiry.inquiryLang) })}
						{inquiry.inquiryReplyLang !== inquiry.inquiryLang &&
							` · ${t('wants replies in {{lang}}', { lang: languageName(inquiry.inquiryReplyLang) })}`}
					</span>
				</div>
				{inquiry.bookingCode && (
					<span className={'admin-badge teal'}>{t('Booking {{code}}', { code: inquiry.bookingCode })}</span>
				)}
			</div>
			<div className={'messages'}>
				<div className={'message patient'}>
					<span className={'meta'}>
						{inquiry.patientName ?? t('Patient')} · {seoulTime(inquiry.createdAt, locale)} ·{' '}
						{languageName(inquiry.inquiryLang)}
					</span>
					<p>{inquiry.inquiryContent}</p>
				</div>
				{inquiry.inquiryMessages.map((message, index) => {
					const team = message.senderType === InquirySender.ADMIN;
					return (
						<div key={index} className={`message ${team ? 'team' : 'patient'}`}>
							<span className={'meta'}>
								{team ? t('MedVia team') : (inquiry.patientName ?? t('Patient'))} ·{' '}
								{seoulTime(message.createdAt, locale)} · {languageName(message.lang)}
							</span>
							<p>{message.text}</p>
						</div>
					);
				})}
			</div>
			{closed ? (
				<p className={'admin-muted'}>
					{t('Resolved on {{date}}.', { date: inquiry.resolvedAt ? seoulTime(inquiry.resolvedAt, locale) : '' })}
				</p>
			) : (
				<form className={'admin-reply'} onSubmit={sendHandler}>
					<TextField
						label={t('Reply')}
						value={reply}
						multiline
						minRows={3}
						fullWidth
						inputProps={{ maxLength: REPLY_MAX }}
						onChange={(event) => setReply(event.target.value)}
					/>
					<div className={'bar'}>
						<TextField
							select
							size={'small'}
							label={t('Written in')}
							value={replyLang}
							onChange={(event) => setReplyLang(event.target.value as Language)}
						>
							{LANGUAGES.map((lang) => (
								<MenuItem key={lang.code} value={lang.code}>
									{lang.label}
								</MenuItem>
							))}
						</TextField>
						<span className={'spacer'} />
						<Button variant={'outlined'} disabled={resolving} onClick={resolveHandler}>
							{t('Mark as resolved')}
						</Button>
						<Button
							type={'submit'}
							variant={'contained'}
							endIcon={<SendRoundedIcon />}
							disabled={sending || !reply.trim()}
						>
							{t('Send reply')}
						</Button>
					</div>
				</form>
			)}
		</section>
	);

	return (
		<div id={'admin-cs'}>
			{mobile ? (
				selectedId ? (
					thread
				) : (
					list
				)
			) : (
				<div className={'admin-grid inbox'}>
					{list}
					{thread}
				</div>
			)}
		</div>
	);
};

export default withLayoutAdmin(AdminInquiries);
