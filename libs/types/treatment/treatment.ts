/** The treatment fields the client reads so far (the doctor page). Grows with the clinic page. */
export interface Treatment {
	_id: string;
	treatmentName: string;
	treatmentCategory?: string;
	/** minutes */
	treatmentDuration: number;
	treatmentPrice: number;
	treatmentPriceNote?: string;
	treatmentDesc?: string;
	doctorIds?: string[];
	clinicId?: string;
}

export interface ClinicTreatmentsInquiry {
	clinicId: string;
	/** Only the treatments this doctor performs. */
	doctorId?: string;
}
