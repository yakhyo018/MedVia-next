import { Specialty } from '../../enums/clinic.enum';
import { ConcernSeverity, FaceScanStatus, FaceZone, PhotoQualityIssue, SkinConcern } from '../../enums/face-scan.enum';
import { TotalCounter } from '../common';

export interface FaceFinding {
	concern: SkinConcern;
	severity: ConcernSeverity;
	zone: FaceZone;
}

/** One reading of one photo. The photo itself is never stored — only this. */
export interface FaceScan {
	_id: string;
	faceScanStatus: FaceScanStatus;
	findings: FaceFinding[];
	qualityIssues: PhotoQualityIssue[];
	faceScanSummary?: string | null;
	faceScanLang: string;
	suggestedSpecialty?: Specialty | null;
	aiProvider: string;
	disclaimer: string;
	createdAt: Date;
}

export interface FaceScans {
	list: FaceScan[];
	metaCounter: TotalCounter[];
}
