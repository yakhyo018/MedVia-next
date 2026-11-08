import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Pagination, Skeleton, Stack } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ListBanner from '../../libs/components/common/ListBanner';
import EmptyState from '../../libs/components/common/EmptyState';
import StatusChip from '../../libs/components/common/StatusChip';
import InquiryForm from '../../libs/components/cs/InquiryForm';
import NaviAsk from '../../libs/components/cs/NaviAsk';
import { CATEGORY_LABEL, INQUIRY_STATUS } from '../../libs/components/cs/csLabels';
import { GET_MY_INQUIRIES, GET_NOTICES } from '../../apollo/user/query';
import { sessionReadyVar, userVar } from '../../apollo/store';
import { Inquiry, Notice } from '../../libs/types/cs/cs';
import { InquiryCategory, NoticeCategory } from '../../libs/enums/cs.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { LIST_MAX, localeToLanguage } from '../../libs/config';
import { seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const NOTICE_PAGE = 10;
const TABS = [
	{ key: 'faq', label: 'FAQ' },
	{ key: 'notice', label: 'Notice' },
	{ key: 'inquiry', label: '1:1 Inquiry' },
] as const;

/**
 * The Help center (`?tab=faq|notice|inquiry`): answers in the reader's language, MedVia's notices,
 * and one-to-one inquiries for patients.
 */
const HelpCenter: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [faqCategory, setFaqCategory] = useState<InquiryCategory | ''>('');
	const [noticePage, setNoticePage] = useState<number>(1);
	const tab = TABS.find((item) => item.key === router.query.tab)?.key ?? 'faq';
	const lang = localeToLanguage(router.locale);
	const isPatient = user.memberType === MemberType.USER;

	/** APOLLO REQUESTS **/
	const faqQuery = useQuery(GET_NOTICES, {
		variables: {
			input: {
				page: 1,
				limit: LIST_MAX,
				noticeCategory: NoticeCategory.FAQ,
				lang,
				...(faqCategory ? { noticeFaqCategory: faqCategory } : {}),
			},
		},
		fetchPolicy: 'cache-and-network',
		skip: tab !== 'faq',
	});
	const noticesQuery = useQuery(GET_NOTICES, {
		variables: {
			input: {
				page: tab === 'notice' ? noticePage : 1,
				limit: tab === 'notice' ? NOTICE_PAGE : 3,
				noticeCategory: NoticeCategory.NOTICE,
				lang,
			},
		},
		fetchPolicy: 'cache-and-network',
		skip: tab === 'inquiry',
	});
	const inquiriesQuery = useQuery(GET_MY_INQUIRIES, {
		variables: { input: { page: 1, limit: 20 } },
		fetchPolicy: 'cache-and-network',
		skip: tab !== 'inquiry' || !isPatient,
	});
	const faqs: Notice[] = (faqQuery.data ?? faqQuery.previousData)?.getNotices?.list ?? [];
	const notices: Notice[] = (noticesQuery.data ?? noticesQuery.previousData)?.getNotices?.list ?? [];
	const noticeTotal: number = noticesQuery.data?.getNotices?.metaCounter?.[0]?.total ?? 0;
	const inquiries: Inquiry[] = inquiriesQuery.data?.getMyInquiries?.list ?? [];

	/** HANDLERS **/
	const tabHandler = async (key: string) => {
		await router.push({ pathname: router.pathname, query: key === 'faq' ? {} : { tab: key } }, undefined, {
			shallow: true,
		});
	};

	const noticeRows = (list: Notice[]) => (
		<div className={'notice-list'}>
			{list.map((notice) => (
				<Link key={notice._id} href={`/cs/notice?id=${notice._id}`} className={'notice-row'}>
					<span className={'title'}>
						{notice.noticePinned && <span className={'important'}>{t('Important')}</span>}
						{notice.displayTitle ?? notice.noticeTitle}
					</span>
					<span className={'meta'}>
						{seoulTime(notice.publishedAt ?? notice.createdAt, router.locale, false)}
						{tab === 'notice' && ` · ${t('{{count}} views', { count: notice.noticeViews })}`}
					</span>
				</Link>
			))}
		</div>
	);

	const helpCard = (
		<Box className={'help-card card'}>
			<strong>{t('Still need help?')}</strong>
			<span>{t('Send a 1:1 inquiry in your language. Our team replies within one business day.')}</span>
			<Button variant={'contained'} onClick={() => tabHandler('inquiry')}>
				{t('Send 1:1 inquiry')}
			</Button>
		</Box>
	);

	let body: React.ReactNode;
	if (tab === 'faq') {
		body = (
			<Box className={'cs-columns'}>
				<Stack className={'cs-main'}>
					<NaviAsk />
					<div className={'faq-filter'} role={'tablist'} aria-label={t('FAQ')}>
						{[
							{ key: '', label: 'All' },
							...Object.values(InquiryCategory).map((key) => ({ key, label: CATEGORY_LABEL[key] })),
						].map((item) => (
							<button
								key={item.key || 'all'}
								type={'button'}
								role={'tab'}
								aria-selected={faqCategory === item.key}
								onClick={() => setFaqCategory(item.key as InquiryCategory | '')}
							>
								{t(item.label)}
							</button>
						))}
					</div>
					{faqQuery.loading && faqs.length === 0 ? (
						<Skeleton variant={'rounded'} height={300} />
					) : faqs.length === 0 ? (
						<EmptyState title={t('No questions here yet')} />
					) : (
						<div className={'faq-list'}>
							{faqs.map((faq) => (
								<Accordion key={faq._id} disableGutters elevation={0}>
									<AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
										{faq.displayTitle ?? faq.noticeTitle}
									</AccordionSummary>
									<AccordionDetails>{faq.displayContent}</AccordionDetails>
								</Accordion>
							))}
						</div>
					)}
				</Stack>
				<aside className={'cs-side'}>
					<Box className={'card'}>
						<div className={'side-head'}>
							<h2>{t('Notices')}</h2>
							<button type={'button'} onClick={() => tabHandler('notice')}>
								{t('All notices')}
								<ChevronRightRoundedIcon />
							</button>
						</div>
						{noticesQuery.loading && notices.length === 0 ? (
							<Skeleton variant={'rounded'} height={120} />
						) : (
							noticeRows(notices)
						)}
					</Box>
					{helpCard}
				</aside>
			</Box>
		);
	} else if (tab === 'notice') {
		body = (
			<Stack className={'cs-main'}>
				{noticesQuery.loading && notices.length === 0 ? (
					<Skeleton variant={'rounded'} height={360} />
				) : notices.length === 0 ? (
					<EmptyState title={t('No notices yet')} />
				) : (
					<Box className={'card notices'}>{noticeRows(notices)}</Box>
				)}
				{noticeTotal > NOTICE_PAGE && (
					<Pagination
						className={'community-pagination'}
						count={Math.ceil(noticeTotal / NOTICE_PAGE)}
						page={noticePage}
						onChange={(_, value) => setNoticePage(value)}
						shape={'rounded'}
						siblingCount={device === 'mobile' ? 0 : 1}
					/>
				)}
			</Stack>
		);
	} else if (!user._id) {
		body = (
			<EmptyState
				title={t('Log in to send an inquiry')}
				text={t('Your inquiries and our answers stay in your account.')}
				action={
					<Button
						variant={'contained'}
						disabled={!sessionReady}
						onClick={() => router.push({ pathname: '/account/join', query: { referrer: router.asPath } })}
					>
						{t('Log in')}
					</Button>
				}
			/>
		);
	} else if (!isPatient) {
		body = <EmptyState title={t('1:1 inquiries are for patient accounts.')} />;
	} else {
		body = (
			<Box className={'cs-columns'}>
				<Stack className={'cs-main'}>
					<InquiryForm />
				</Stack>
				<aside className={'cs-side'}>
					<Box className={'card'}>
						<h2>{t('My inquiries')}</h2>
						{inquiriesQuery.loading && inquiries.length === 0 ? (
							<Skeleton variant={'rounded'} height={120} />
						) : inquiries.length === 0 ? (
							<p className={'hint'}>{t('No inquiries yet.')}</p>
						) : (
							<div className={'notice-list'}>
								{inquiries.map((inquiry) => {
									const status = INQUIRY_STATUS[inquiry.inquiryStatus];
									return (
										<Link key={inquiry._id} href={`/cs/inquiry?id=${inquiry._id}`} className={'notice-row'}>
											<span className={'title'}>{inquiry.inquiryTitle}</span>
											<span className={'meta'}>
												<StatusChip status={status.tone} label={t(status.label)} size={'small'} />
												{seoulTime(inquiry.updatedAt, router.locale, false)}
											</span>
										</Link>
									);
								})}
							</div>
						)}
					</Box>
				</aside>
			</Box>
		);
	}

	return (
		<Stack className={'cs-page'}>
			<ListBanner crumb={t('CS')} title={t('Help center')} text={t('Notices, answers and one-to-one support')} />
			<Stack className={'container'}>
				<div className={'booking-tabs cs-tabs'} role={'tablist'} aria-label={t('Help center')}>
					{TABS.map((item) => (
						<button
							key={item.key}
							type={'button'}
							role={'tab'}
							aria-selected={item.key === tab}
							onClick={() => tabHandler(item.key)}
						>
							{t(item.label)}
						</button>
					))}
				</div>
				{body}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(HelpCenter);
