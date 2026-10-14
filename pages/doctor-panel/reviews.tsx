import React from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import DoctorFrame from '../../libs/components/doctor-panel/DoctorFrame';
import ReplyReviews from '../../libs/components/dashboard/ReplyReviews';
import { GET_MY_DOCTOR_PROFILE } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** Reviews of the visits where this doctor treated the patient; the doctor replies under their name. */
const DoctorReviews: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { data } = useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'cache-first',
		skip: user.memberType !== MemberType.DOCTOR,
	});

	return (
		<DoctorFrame
			title={t('Review Replies')}
			text={t('Reviews of visits where you were the doctor')}
			className={'doctor-reviews'}
		>
			<ReplyReviews doctorId={data?.getMyDoctorProfile?._id} as={'doctor'} />
		</DoctorFrame>
	);
};

export default withLayoutBasic(DoctorReviews);
