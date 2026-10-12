import { District } from '../../enums/clinic.enum';

/** The clinic fields the client reads so far (the doctor card). Grows with the clinics page. */
export interface Clinic {
	_id: string;
	clinicName: string;
	clinicNameKo?: string;
	clinicDistrict: District;
}
