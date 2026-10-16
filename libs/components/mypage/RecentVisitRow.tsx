import { ReactNode } from 'react';
import { useTranslation } from 'next-i18next';
import MyRow from './MyRow';
import { RecentVisit } from '../../types/view/view';
import { ViewGroup } from '../../enums/view.enum';

interface RecentVisitRowProps {
	visit: RecentVisit;
	end: ReactNode;
}

/** One recently visited clinic or doctor (the API keeps articles out of this list). */
const RecentVisitRow = (props: RecentVisitRowProps) => {
	const { visit, end } = props;
	const { t } = useTranslation('common');

	if (visit.viewGroup === ViewGroup.CLINIC && visit.clinic) {
		const { clinic } = visit;
		return (
			<MyRow
				href={`/clinics/detail?id=${clinic._id}`}
				name={clinic.clinicName}
				image={clinic.clinicImages?.[0]}
				chip={<span className={'kind clinic'}>{t('Clinic')}</span>}
				sub={clinic.clinicDistrict ? t(`district.${clinic.clinicDistrict}`) : ''}
				end={end}
			/>
		);
	}
	if (visit.viewGroup === ViewGroup.DOCTOR && visit.doctor) {
		const { doctor } = visit;
		return (
			<MyRow
				href={`/doctors/detail?id=${doctor._id}`}
				name={`${t('Dr.')} ${doctor.doctorName}`}
				plainName={doctor.doctorName}
				image={doctor.doctorImage}
				round
				chip={<span className={'kind'}>{t('Doctor')}</span>}
				sub={doctor.clinicData?.clinicName ?? t(`specialty.${doctor.doctorSpecialty}`)}
				end={end}
			/>
		);
	}
	return null;
};

export default RecentVisitRow;
