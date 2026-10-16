import { useTranslation } from 'next-i18next';
import { Box, Button, Checkbox, FormControlLabel } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Question } from '../../questionnaire';
import { BookingConsentType } from '../../enums/booking.enum';

interface ReviewStepProps {
	questions: Question[];
	answers: Record<string, string>;
	consents: Record<BookingConsentType, boolean>;
	clinicName: string;
	doctorName: string;
	showErrors: boolean;
	onConsent: (type: BookingConsentType, agreed: boolean) => void;
	onEdit: () => void;
}

/** Step 3: the answers as the clinic will read them, and the consents (two required, AI optional). */
const ReviewStep = (props: ReviewStepProps) => {
	const { questions, answers, consents, clinicName, doctorName, showErrors, onConsent, onEdit } = props;
	const { t } = useTranslation('common');
	const answered = questions.filter((question) => (answers[question.id] ?? '').trim());
	const items: { type: BookingConsentType; text: string; required: boolean }[] = [
		{
			type: BookingConsentType.SHARE_DATA,
			text: t('Share my answers with {{clinic}} and {{doctor}} for this booking', {
				clinic: clinicName,
				doctor: `${t('Dr.')} ${doctorName}`,
			}),
			required: true,
		},
		{
			type: BookingConsentType.BOOKING_TERMS,
			text: t('I agree to the booking and cancellation terms'),
			required: true,
		},
		{
			type: BookingConsentType.AI_SUMMARY,
			text: t('Let AI write a Korean summary of my answers for the doctor'),
			required: false,
		},
	];

	return (
		<Box className={'booking-step review'}>
			<div className={'step-head'}>
				<h1>{t('Review and give consent')}</h1>
				<p>{t('Check your answers before the request goes to the clinic.')}</p>
			</div>
			<section className={'answers'}>
				<div className={'section-title'}>
					<h2>{t('Your answers')}</h2>
					<Button size={'small'} onClick={onEdit}>
						{t('Edit')}
					</Button>
				</div>
				<dl>
					{answered.map((question) => (
						<div key={question.id}>
							<dt>{t(question.text)}</dt>
							<dd>{question.type === 'choice' ? t(answers[question.id]) : answers[question.id]}</dd>
						</div>
					))}
				</dl>
			</section>
			<section className={'consents'}>
				<h2>{t('Consent')}</h2>
				{items.map((item) => {
					const missing = showErrors && item.required && !consents[item.type];
					return (
						<FormControlLabel
							key={item.type}
							className={missing ? 'missing' : ''}
							control={
								<Checkbox
									checked={consents[item.type]}
									onChange={(event) => onConsent(item.type, event.target.checked)}
								/>
							}
							label={
								<span>
									{item.text}{' '}
									<em className={item.required ? 'required' : ''}>({t(item.required ? 'required' : 'optional')})</em>
								</span>
							}
						/>
					);
				})}
				<p className={'privacy'}>
					<LockOutlinedIcon />
					{t(
						'Encrypted. Every access is recorded in your consent history. The summary only organises your answers — it is not a diagnosis.',
					)}
				</p>
			</section>
		</Box>
	);
};

export default ReviewStep;
