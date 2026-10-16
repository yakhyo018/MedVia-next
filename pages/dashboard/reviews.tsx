import React from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../libs/components/dashboard/ClinicFrame';
import ReplyReviews from '../../libs/components/dashboard/ReplyReviews';
import { GET_MY_CLINIC } from '../../apollo/user/query';
import { userVar } from '../../apollo/store';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** Published reviews of the clinic's visits; the clinic (or the doctor, from the Doctor Panel) replies. */
const ClinicReviews: NextPage = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const { data } = useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'cache-first',
		skip: user.memberType !== MemberType.AGENT,
	});

	return (
		<ClinicFrame
			title={t('Reviews')}
			text={t('Reviews from completed visits. The doctor or the clinic can reply.')}
			className={'clinic-reviews'}
		>
			<ReplyReviews clinicId={data?.getMyClinic?._id} as={'clinic'} />
		</ClinicFrame>
	);
};

export default withLayoutBasic(ClinicReviews);
