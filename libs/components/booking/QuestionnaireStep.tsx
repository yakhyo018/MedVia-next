import { useTranslation } from 'next-i18next';
import { Box, TextField } from '@mui/material';
import { ANSWER_MAX, Question } from '../../questionnaire';

interface QuestionnaireStepProps {
	questions: Question[];
	answers: Record<string, string>;
	/** Show "required" errors only after the patient pressed Continue once. */
	showErrors: boolean;
	onChange: (id: string, value: string) => void;
}

/** Step 2: chips for choice questions, free text for the rest. The answers stay in memory only. */
const QuestionnaireStep = (props: QuestionnaireStepProps) => {
	const { questions, answers, showErrors, onChange } = props;
	const { t } = useTranslation('common');

	return (
		<Box className={'booking-step questionnaire'}>
			<div className={'step-head'}>
				<h1>{t('Tell the doctor about your concern')}</h1>
				<p>{t('Answer in any language — the clinic receives your original answers.')}</p>
			</div>
			{questions.map((question) => {
				const value = answers[question.id] ?? '';
				const missing = showErrors && question.required && !value.trim();
				return (
					<div key={question.id} className={`question ${missing ? 'missing' : ''}`}>
						<span className={'label'} id={`q-${question.id}`}>
							{t(question.text)}
							{!question.required && <em> ({t('optional')})</em>}
						</span>
						{question.type === 'choice' ? (
							<div className={'chips'} role={'radiogroup'} aria-labelledby={`q-${question.id}`}>
								{question.options?.map((option) => (
									<button
										key={option}
										type={'button'}
										role={'radio'}
										aria-checked={value === option}
										className={value === option ? 'on' : ''}
										onClick={() => onChange(question.id, option)}
									>
										{t(option)}
									</button>
								))}
							</div>
						) : (
							<TextField
								fullWidth
								multiline
								minRows={question.id === 'since' ? 1 : 3}
								value={value}
								placeholder={t('Type your answer')}
								inputProps={{ maxLength: ANSWER_MAX, 'aria-labelledby': `q-${question.id}` }}
								onChange={(event) => onChange(question.id, event.target.value)}
							/>
						)}
						{missing && <span className={'error'}>{t('Please answer this question')}</span>}
					</div>
				);
			})}
		</Box>
	);
};

export default QuestionnaireStep;
