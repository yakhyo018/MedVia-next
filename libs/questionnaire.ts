import { Specialty } from './enums/clinic.enum';

/**
 * The booking questionnaire, per specialty. The API stores whatever question/answer pairs the
 * client sends (1–15, question ≤ 200, answer ≤ 2000 chars); the question goes in English (the
 * clinic reads it), the answer in the patient's language. Texts are i18n keys.
 */
export interface Question {
	id: string;
	text: string;
	/** choice: one of `options` (chips); text: free text. */
	type: 'choice' | 'text';
	options?: string[];
	required: boolean;
}

const ALLERGIES: Question = { id: 'allergies', text: 'Allergies or current medication', type: 'text', required: true };
const ANYTHING_ELSE: Question = {
	id: 'else',
	text: 'Anything else the doctor should know?',
	type: 'text',
	required: false,
};
const BEFORE: Question = {
	id: 'before',
	text: 'Have you had this treatment before?',
	type: 'choice',
	options: ['Yes', 'No'],
	required: true,
};

export const QUESTIONS: Record<Specialty, Question[]> = {
	[Specialty.DERMATOLOGY]: [
		{
			id: 'concern',
			text: 'What would you like to treat?',
			type: 'choice',
			options: ['Pigmentation', 'Acne scars', 'Redness', 'Fine lines', 'Other'],
			required: true,
		},
		{ id: 'since', text: 'How long have you had it?', type: 'text', required: true },
		BEFORE,
		ALLERGIES,
		ANYTHING_ELSE,
	],
	[Specialty.PLASTIC_SURGERY]: [
		{
			id: 'concern',
			text: 'What would you like to change?',
			type: 'choice',
			options: ['Eyes', 'Nose', 'Face contour', 'Skin', 'Other'],
			required: true,
		},
		{
			id: 'before',
			text: 'Have you had surgery or fillers before?',
			type: 'choice',
			options: ['Yes', 'No'],
			required: true,
		},
		ALLERGIES,
		ANYTHING_ELSE,
	],
	[Specialty.DENTAL]: [
		{
			id: 'concern',
			text: 'What brings you in?',
			type: 'choice',
			options: ['Pain', 'Cleaning', 'Implant', 'Whitening', 'Other'],
			required: true,
		},
		{ id: 'pain', text: 'Any pain or bleeding now?', type: 'choice', options: ['Yes', 'No'], required: true },
		ALLERGIES,
		ANYTHING_ELSE,
	],
	[Specialty.CHECK_UP]: [
		{
			id: 'concern',
			text: 'What would you like checked?',
			type: 'choice',
			options: ['General', 'Heart', 'Stomach', "Women's health", 'Other'],
			required: true,
		},
		{ id: 'symptoms', text: 'Any ongoing illness or symptoms?', type: 'text', required: true },
		ALLERGIES,
		ANYTHING_ELSE,
	],
};

export const ANSWER_MAX = 2000;
