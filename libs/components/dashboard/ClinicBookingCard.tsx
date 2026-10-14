import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Box, Button, CircularProgress } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import StatusChip from '../common/StatusChip';
import PromptDialog from '../common/PromptDialog';
import { GET_CLINIC_BOOKING } from '../../../apollo/user/query';
import { UPDATE_BOOKING_STATUS } from '../../../apollo/user/mutation';
import { Booking } from '../../types/booking/booking';
import { BookingStatus } from '../../enums/booking.enum';
import { LANGUAGES } from '../../config';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { formatKrw, initials, seoulClock, seoulTime } from '../../utils';

const langLabel = (code?: string | null) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code ?? '';

/** "1 h 38 min" until the clinic's answer is due. */
const timeLeft = (deadline: Date | string): { text: string; late: boolean } => {
	const minutes = Math.round((new Date(deadline).getTime() - Date.now()) / 60000);
	if (minutes <= 0) return { text: '', late: true };
	const h = Math.floor(minutes / 60);
	return { text: h ? `${h} h ${minutes % 60} min` : `${minutes} min`, late: false };
};

interface ClinicBookingCardProps {
	booking: Booking;
	/** Open the patient's answers and the AI summary at once (the dashboard's requests). */
	expanded?: boolean;
	onChanged: () => void;
}

type Ask = 'decline' | 'cancel' | null;

/**
 * One booking on the clinic's side, with the moves the API allows from its state: a request is
 * approved or declined (with a reason); a confirmed visit is cancelled before it starts, marked
 * completed or no-show after. The answers and the Korean AI summary load when opened.
 */
const ClinicBookingCard = (props: ClinicBookingCardProps) => {
	const { booking, expanded = false, onChanged } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const [open, setOpen] = useState<boolean>(expanded);
	const [showOriginal, setShowOriginal] = useState<boolean>(false);
	const [ask, setAsk] = useState<Ask>(null);

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_CLINIC_BOOKING, {
		variables: { bookingId: booking._id },
		fetchPolicy: 'cache-first',
		skip: !open,
	});
	const [updateBookingStatus, { loading: saving }] = useMutation(UPDATE_BOOKING_STATUS);
	const detail: Booking | undefined = data?.getBooking;

	const now = Date.now();
	const started = new Date(booking.bookingDate).getTime() <= now;
	const pending = booking.bookingStatus === BookingStatus.PENDING;
	const expired = pending && new Date(booking.respondDeadline).getTime() <= now;
	const confirmed = booking.bookingStatus === BookingStatus.CONFIRMED;
	const left = timeLeft(booking.respondDeadline);

	/** HANDLERS **/
	const moveHandler = async (bookingStatus: BookingStatus, reason?: string) => {
		try {
			if (bookingStatus === BookingStatus.COMPLETED || bookingStatus === BookingStatus.NO_SHOW) {
				const sure = await sweetConfirmAlert(
					bookingStatus === BookingStatus.COMPLETED
						? t('Mark this visit as completed? The patient can then write a review.')
						: t('Mark the patient as a no-show?'),
					bookingStatus === BookingStatus.COMPLETED ? t('Completed') : t('No-show'),
				);
				if (!sure) return;
			}
			await updateBookingStatus({ variables: { input: { bookingId: booking._id, bookingStatus, reason } } });
			setAsk(null);
			const done: Partial<Record<BookingStatus, string>> = {
				[BookingStatus.CONFIRMED]: t('Booking approved'),
				[BookingStatus.DECLINED]: t('Request declined, the time is free again'),
				[BookingStatus.CANCELLED]: t('Booking cancelled, the time is free again'),
				[BookingStatus.COMPLETED]: t('Visit completed'),
				[BookingStatus.NO_SHOW]: t('Marked as no-show'),
			};
			await sweetTopSmallSuccessAlert(done[bookingStatus] ?? '');
			onChanged();
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const statusLabel = expired
		? t('status.EXPIRED')
		: pending
			? t('Waiting for you')
			: confirmed && started
				? t('Visit started')
				: undefined;

	return (
		<Box component={'article'} className={`clinic-booking card ${pending && !expired ? 'request' : ''}`}>
			<div className={'top'}>
				<span className={'patient'}>
					<span className={'avatar'}>{initials(booking.patientName ?? '')}</span>
					<span className={'who'}>
						<strong>{booking.patientName}</strong>
						<span>
							{t('Patient')} · {langLabel(booking.bookingLang)} · #{booking.bookingCode}
						</span>
					</span>
				</span>
				<StatusChip
					status={expired ? BookingStatus.EXPIRED : booking.bookingStatus}
					label={statusLabel}
					size={'small'}
				/>
			</div>
			<div className={'facts'}>
				<strong>
					{booking.treatmentData?.treatmentName} · {t('Dr.')} {booking.doctorData?.doctorName}
				</strong>
				<span>
					{seoulTime(booking.bookingDate, router.locale, false)} · {seoulClock(booking.bookingDate)} ({t('Seoul')}) ·{' '}
					{booking.bookingInterpreter
						? t('{{lang}} interpreter', { lang: langLabel(booking.bookingInterpreter) })
						: t('No interpreter')}{' '}
					· {formatKrw(booking.bookingPrice)}
				</span>
				{booking.bookingDeclineReason && <span className={'reason'}>{booking.bookingDeclineReason}</span>}
			</div>

			{open ? (
				<div className={'summary'}>
					{loading && !detail ? (
						<CircularProgress size={20} />
					) : detail?.bookingAiSummary && !showOriginal ? (
						<>
							<span className={'label'}>
								<AutoAwesomeOutlinedIcon />
								{t('AI summary')} · 한국어
							</span>
							<p>{detail.bookingAiSummary}</p>
						</>
					) : detail?.bookingQuestionnaire?.answers?.length ? (
						<>
							<span className={'label'}>
								{t('Answers in {{lang}}', { lang: langLabel(detail.bookingQuestionnaire.originalLang) })}
							</span>
							<dl>
								{detail.bookingQuestionnaire.answers.map((item, index) => (
									<div key={index}>
										<dt>{item.question}</dt>
										<dd>{item.answer}</dd>
									</div>
								))}
							</dl>
						</>
					) : (
						<span className={'hint'}>{t('The patient did not share answers for this booking.')}</span>
					)}
					{detail?.bookingAiSummary && (
						<span className={'hint'}>
							{t('From the patient’s answers · not a diagnosis')} ·{' '}
							<button type={'button'} onClick={() => setShowOriginal(!showOriginal)}>
								{showOriginal ? t('Show AI summary') : t('Show original')}
							</button>
						</span>
					)}
				</div>
			) : (
				<button type={'button'} className={'open-details'} onClick={() => setOpen(true)}>
					{t('Patient’s answers and AI summary')}
				</button>
			)}

			<div className={'actions'}>
				{pending && !expired && (
					<>
						<Button variant={'contained'} disabled={saving} onClick={() => moveHandler(BookingStatus.CONFIRMED)}>
							{t('Approve')}
						</Button>
						<Button variant={'outlined'} disabled={saving} onClick={() => setAsk('decline')}>
							{t('Decline')}
						</Button>
					</>
				)}
				{confirmed && started && (
					<>
						<Button variant={'contained'} disabled={saving} onClick={() => moveHandler(BookingStatus.COMPLETED)}>
							{t('Completed')}
						</Button>
						<Button variant={'outlined'} disabled={saving} onClick={() => moveHandler(BookingStatus.NO_SHOW)}>
							{t('No-show')}
						</Button>
					</>
				)}
				{(pending || confirmed) && !expired && (
					<Button variant={'text'} LinkComponent={Link} href={`/dashboard/chat?member=${booking.memberId}`}>
						{t('Chat with patient')}
					</Button>
				)}
				{confirmed && !started && (
					<Button variant={'outlined'} color={'error'} disabled={saving} onClick={() => setAsk('cancel')}>
						{t('Cancel booking')}
					</Button>
				)}
			</div>
			{pending && !expired && left.text && (
				<span className={'due'}>{t('Respond within {{time}}', { time: left.text })}</span>
			)}

			<PromptDialog
				open={ask !== null}
				title={ask === 'decline' ? t('Decline this request?') : t('Cancel this booking?')}
				text={t('The patient sees your reason. The time is released for other patients.')}
				label={t('Reason for the patient')}
				confirmText={ask === 'decline' ? t('Decline') : t('Cancel booking')}
				danger
				minLength={2}
				errorText={t('Please write a reason')}
				busy={saving}
				onConfirm={(reason) =>
					moveHandler(ask === 'decline' ? BookingStatus.DECLINED : BookingStatus.CANCELLED, reason)
				}
				onClose={() => setAsk(null)}
			/>
		</Box>
	);
};

export default ClinicBookingCard;
