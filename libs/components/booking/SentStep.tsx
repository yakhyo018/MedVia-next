import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Button } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { Booking } from '../../types/booking/booking';
import { seoulClock, seoulTime } from '../../utils';

interface SentStepProps {
	booking: Pick<Booking, 'bookingCode' | 'respondDeadline' | 'createdAt' | 'bookingDate'>;
	clinicName: string;
	clinicId: string;
}

/** Step 4: the request is PENDING; the clinic must answer by respondDeadline or it expires. */
const SentStep = (props: SentStepProps) => {
	const { booking, clinicName, clinicId } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const when = (value: Date) => `${seoulTime(value, router.locale, false)} · ${seoulClock(value)}`;
	const steps = [
		{ title: t('Request sent'), text: when(booking.createdAt), state: 'done' },
		{
			title: t('Clinic reviewing your request'),
			text: t('Answers by {{time}}', { time: when(booking.respondDeadline) }),
			state: 'now',
		},
		{ title: t('Confirmation'), text: t('You get a notification'), state: 'next' },
		{ title: t('Your visit'), text: when(booking.bookingDate), state: 'next' },
	];

	return (
		<Box className={'booking-step sent'}>
			<div className={'sent-head'}>
				<span className={'mark'}>
					<CheckRoundedIcon />
				</span>
				<h1>{t('Request sent')}</h1>
				<p>
					{t('{{clinic}} answers by {{time}}. Your time stays reserved while they review it.', {
						clinic: clinicName,
						time: when(booking.respondDeadline),
					})}
				</p>
				<span className={'code'}>
					{t('Waiting for clinic')} · #{booking.bookingCode}
				</span>
			</div>
			<section className={'timeline'}>
				<h2>{t('What happens next')}</h2>
				<ol>
					{steps.map((step) => (
						<li key={step.title} className={step.state}>
							<strong>{step.title}</strong>
							<span>{step.text}</span>
						</li>
					))}
				</ol>
				<p className={'muted'}>
					{t(
						'If the clinic declines, the time is released and you can pick another. Nothing is charged until your visit.',
					)}
				</p>
			</section>
			<div className={'sent-actions'}>
				<Button variant={'contained'} LinkComponent={Link} href={'/mypage/bookings'}>
					{t('View My Bookings')}
				</Button>
				<Button variant={'outlined'} LinkComponent={Link} href={`/clinics/detail?id=${clinicId}`}>
					{t('Back to the clinic')}
				</Button>
			</div>
		</Box>
	);
};

export default SentStep;
