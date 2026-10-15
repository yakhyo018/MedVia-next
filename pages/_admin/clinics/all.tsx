import React from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import withLayoutAdmin from '../../../libs/components/layout/LayoutAdmin';
import AdminClinicList from '../../../libs/components/admin/AdminClinicList';
import { T } from '../../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

/** Clinics › All clinics: live and suspended clinics, suspend / restore. */
const AdminAllClinics: NextPage = () => {
	return (
		<div id={'admin-clinics'}>
			<AdminClinicList mode={'all'} />
		</div>
	);
};

export default withLayoutAdmin(AdminAllClinics);
