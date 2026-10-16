import { ViewGroup } from '../../enums/view.enum';
import { TotalCounter } from '../common';
import { Clinic } from '../clinic/clinic';
import { Doctor } from '../doctor/doctor';

/** One row of Recently Visited: the latest visit of one clinic or doctor. */
export interface RecentVisit {
	_id: string;
	viewGroup: ViewGroup;
	viewRefId: string;
	visitedAt: Date;
	clinic?: Clinic | null;
	doctor?: Doctor | null;
}

export interface RecentVisits {
	list: RecentVisit[];
	metaCounter: TotalCounter[];
}
