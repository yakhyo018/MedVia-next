import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Button, Skeleton, Stack } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../libs/components/mypage/MyPageFrame';
import RecentVisitRow from '../../libs/components/mypage/RecentVisitRow';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_RECENTLY_VISITED } from '../../apollo/user/query';
import { CLEAR_RECENTLY_VISITED } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { RecentVisit } from '../../libs/types/view/view';
import { MemberType } from '../../libs/enums/member.enum';
import { sweetDangerConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { seoulClock, seoulDateKey, seoulTime } from '../../libs/utils';
import { LIST_MAX } from '../../libs/config';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "Recently Visited": the patient's own timeline, by Seoul day; only they see it. */
const RecentlyVisited: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const isPatient = user.memberType === MemberType.USER;

	/** APOLLO REQUESTS **/
	const { data, previousData, loading, refetch } = useQuery(GET_RECENTLY_VISITED, {
		variables: { input: { page: 1, limit } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const [clearRecentlyVisited, { loading: clearing }] = useMutation(CLEAR_RECENTLY_VISITED);
	const list: RecentVisit[] = ((data ?? previousData)?.getRecentlyVisited?.list ?? []).filter(
		(visit: RecentVisit) => visit.clinic || visit.doctor,
	);
	const total: number = (data ?? previousData)?.getRecentlyVisited?.metaCounter?.[0]?.total ?? 0;

	/** HANDLERS **/
	const clearHandler = async () => {
		try {
			const sure = await sweetDangerConfirmAlert(t('Clear your recently visited list?'), t('Clear history'));
			if (!sure) return;
			await clearRecentlyVisited();
			await refetch();
			await sweetTopSmallSuccessAlert(t('History cleared'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const today = seoulDateKey(new Date());
	const yesterday = seoulDateKey(Date.now() - DAY_MS);
	const groups: { key: string; title: string; visits: RecentVisit[] }[] = [
		{ key: today, title: t('Today'), visits: [] },
		{ key: yesterday, title: t('Yesterday'), visits: [] },
		{ key: 'earlier', title: t('Earlier'), visits: [] },
	];
	list.forEach((visit) => {
		const day = seoulDateKey(visit.visitedAt);
		(groups.find((group) => group.key === day) ?? groups[2]).visits.push(visit);
	});

	let body: React.ReactNode;
	if (loading && list.length === 0) {
		body = <Skeleton variant={'rounded'} height={260} />;
	} else if (list.length === 0) {
		body = (
			<EmptyState
				title={t('Nothing here yet')}
				text={t('Clinics and doctors you open appear here.')}
				action={
					<Button variant={'contained'} LinkComponent={Link} href={'/clinics'}>
						{t('Find a clinic')}
					</Button>
				}
			/>
		);
	} else {
		body = (
			<>
				{groups
					.filter((group) => group.visits.length > 0)
					.map((group) => (
						<Stack key={group.key} className={'my-group'}>
							<h2>{group.title}</h2>
							<div className={'my-rows'}>
								{group.visits.map((visit) => (
									<RecentVisitRow
										key={visit._id}
										visit={visit}
										end={
											<time>
												{group.key === 'earlier'
													? seoulTime(visit.visitedAt, router.locale, false)
													: seoulClock(visit.visitedAt)}
											</time>
										}
									/>
								))}
							</div>
						</Stack>
					))}
				{list.length < total && limit < LIST_MAX && (
					<Button
						variant={'outlined'}
						className={'more'}
						disabled={loading}
						onClick={() => setLimit(Math.min(limit + PAGE_SIZE, LIST_MAX))}
					>
						{t('Show more')}
					</Button>
				)}
				<p className={'my-note'}>{t('Only you see this list. Times are Seoul time.')}</p>
			</>
		);
	}

	return (
		<MyPageFrame
			title={t('Recently Visited')}
			className={'my-recent'}
			action={
				list.length > 0 && (
					<Button color={'error'} size={'small'} disabled={clearing} onClick={clearHandler}>
						{t('Clear history')}
					</Button>
				)
			}
		>
			{body}
		</MyPageFrame>
	);
};

export default withLayoutBasic(RecentlyVisited);
