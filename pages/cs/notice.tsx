import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Box, Button, Skeleton, Stack } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_NOTICE } from '../../apollo/user/query';
import { Notice } from '../../libs/types/cs/cs';
import { localeToLanguage } from '../../libs/config';
import { isObjectId, seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** One notice, in the reader's language when MedVia translated it. */
const NoticeDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const noticeId = isObjectId(router.query.id) ? router.query.id : '';

	const { data, loading } = useQuery(GET_NOTICE, {
		variables: { noticeId, lang: localeToLanguage(router.locale) },
		fetchPolicy: 'cache-and-network',
		skip: !noticeId,
	});
	const notice: Notice | undefined = data?.getNotice;

	let body: React.ReactNode;
	if (!router.isReady || (loading && !notice)) {
		body = <Skeleton variant={'rounded'} height={320} />;
	} else if (!notice) {
		body = (
			<EmptyState
				title={t('Notice not found')}
				action={
					<Button variant={'contained'} LinkComponent={Link} href={'/cs?tab=notice'}>
						{t('All notices')}
					</Button>
				}
			/>
		);
	} else {
		body = (
			<Box component={'article'} className={'article-body card'}>
				{notice.noticePinned && <span className={'important'}>{t('Important')}</span>}
				<h1>{notice.displayTitle ?? notice.noticeTitle}</h1>
				<span className={'meta'}>
					{seoulTime(notice.publishedAt ?? notice.createdAt, router.locale, false)} ·{' '}
					{t('{{count}} views', { count: notice.noticeViews })}
				</span>
				<p className={'content'}>{notice.displayContent ?? notice.noticeContent}</p>
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
					<Link href={'/cs?tab=notice'}>{t('Notices')}</Link>
				</nav>
				<Link href={'/cs?tab=notice'} className={'back-link'}>
					<ChevronLeftRoundedIcon />
					{t('All notices')}
				</Link>
				{body}
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(NoticeDetail);
