import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, Skeleton, Stack } from '@mui/material';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../libs/components/mypage/MyPageFrame';
import MyRow from '../../libs/components/mypage/MyRow';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_MY_FOLLOWINGS } from '../../apollo/user/query';
import { UNFOLLOW_MEMBER } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { Follow, FollowTypeCount, FollowingsInquiry } from '../../libs/types/follow/follow';
import { MemberType } from '../../libs/enums/member.enum';
import { LIST_MAX } from '../../libs/config';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const PAGE_SIZE = 20;

/** The tabs, in the URL as `?tab=clinics`; "All" groups the list by the same three types. */
const TABS: { key: string; label: string; type?: MemberType }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'clinics', label: 'Clinics', type: MemberType.AGENT },
	{ key: 'doctors', label: 'Doctors', type: MemberType.DOCTOR },
	{ key: 'members', label: 'Members', type: MemberType.USER },
];

/** "My Followings": clinics, doctors and community authors whose news and answers the patient follows. */
const MyFollowings: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [limit, setLimit] = useState<number>(PAGE_SIZE);
	const [unfollowingId, setUnfollowingId] = useState<string>('');
	const active = TABS.find((item) => item.key === router.query.tab) ?? TABS[0];
	const isPatient = user.memberType === MemberType.USER;
	const input: FollowingsInquiry = { page: 1, limit, ...(active.type ? { followingType: active.type } : {}) };

	/** APOLLO REQUESTS **/
	const { data, previousData, loading, refetch } = useQuery(GET_MY_FOLLOWINGS, {
		variables: { input },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const [unfollowMember] = useMutation(UNFOLLOW_MEMBER);
	const result = (data ?? previousData)?.getMyFollowings;
	const list: Follow[] = result?.list ?? [];
	const total: number = result?.metaCounter?.[0]?.total ?? 0;
	const counts: FollowTypeCount[] = result?.typeCounts ?? [];
	const countOf = (type?: MemberType) =>
		type
			? (counts.find((item) => item.followingType === type)?.total ?? 0)
			: counts.reduce((sum, item) => sum + item.total, 0);

	/** HANDLERS **/
	const tabHandler = async (key: string) => {
		setLimit(PAGE_SIZE);
		await router.push({ pathname: router.pathname, query: key === 'all' ? {} : { tab: key } }, undefined, {
			shallow: true,
		});
	};

	const unfollowHandler = async (follow: Follow) => {
		try {
			setUnfollowingId(follow._id);
			await unfollowMember({ variables: { input: { memberId: follow.followingId } } });
			await refetch();
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setUnfollowingId('');
		}
	};

	const row = (follow: Follow) => {
		const end = (
			<Button
				variant={'outlined'}
				size={'small'}
				className={'following-btn'}
				disabled={unfollowingId === follow._id}
				onClick={() => unfollowHandler(follow)}
			>
				<span className={'on'}>{t('Following')}</span>
				<span className={'off'}>{t('Unfollow')}</span>
			</Button>
		);
		const { followingClinic: clinic, followingDoctor: doctor, followingMember: member } = follow;
		if (clinic) {
			return (
				<MyRow
					key={follow._id}
					href={`/clinics/detail?id=${clinic._id}`}
					name={clinic.clinicName}
					image={clinic.clinicImages?.[0]}
					sub={[
						clinic.clinicSpecialty ? t(`specialty.${clinic.clinicSpecialty}`) : '',
						clinic.clinicDistrict ? t(`district.${clinic.clinicDistrict}`) : '',
					]
						.filter(Boolean)
						.join(' · ')}
					end={end}
				/>
			);
		}
		if (doctor) {
			return (
				<MyRow
					key={follow._id}
					href={`/doctors/detail?id=${doctor._id}`}
					name={`${t('Dr.')} ${doctor.doctorName}`}
					plainName={doctor.doctorName}
					image={doctor.doctorImage}
					round
					sub={[t(`specialty.${doctor.doctorSpecialty}`), doctor.clinicData?.clinicName].filter(Boolean).join(' · ')}
					end={end}
				/>
			);
		}
		return (
			<MyRow
				key={follow._id}
				name={member?.memberDisplayName ?? t('Member')}
				image={member?.memberImage}
				round
				sub={t('Community')}
				end={end}
			/>
		);
	};

	const groups = TABS.filter((tab) => tab.type && (active.key === 'all' || tab.key === active.key))
		.map((tab) => ({ ...tab, follows: list.filter((follow) => follow.followingType === tab.type) }))
		.filter((group) => group.follows.length > 0);

	let body: React.ReactNode;
	if (loading && list.length === 0) {
		body = <Skeleton variant={'rounded'} height={260} />;
	} else if (list.length === 0) {
		body = (
			<EmptyState
				title={t('You are not following anyone yet')}
				text={t('Follow a clinic or a doctor to see their news and answers first.')}
				action={
					<Button variant={'contained'} LinkComponent={Link} href={'/doctors'}>
						{t('Find a doctor')}
					</Button>
				}
			/>
		);
	} else {
		body = (
			<>
				{groups.map((group) => (
					<Stack key={group.key} className={'my-group'}>
						{active.key === 'all' && <h2>{t(group.label)}</h2>}
						<div className={'my-rows'}>{group.follows.map(row)}</div>
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
			</>
		);
	}

	return (
		<MyPageFrame
			title={t('My Followings')}
			text={t('Clinics and doctors whose news and answers you follow')}
			className={'my-followings'}
		>
			<Box className={'booking-tabs'} role={'tablist'} aria-label={t('My Followings')}>
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type={'button'}
						role={'tab'}
						aria-selected={tab.key === active.key}
						onClick={() => tabHandler(tab.key)}
					>
						{t(tab.label)} ({countOf(tab.type)})
					</button>
				))}
			</Box>
			{body}
		</MyPageFrame>
	);
};

export default withLayoutBasic(MyFollowings);
