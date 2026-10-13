import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Button } from '@mui/material';
import StatusChip from '../common/StatusChip';
import useOpenChat from '../../hooks/useOpenChat';
import { Booking } from '../../types/booking/booking';
import { BookingStatus } from '../../enums/booking.enum';
import { LANGUAGES, REACT_APP_API_URL } from '../../config';
import { formatKrw, imageUrl, initials, seoulClock, seoulTime } from '../../utils';

/** The API allows a patient to cancel a confirmed booking up to 24 hours before the visit. */
const CANCEL_BEFORE_MS = 24 * 60 * 60 * 1000;

interface BookingItemProps {
	booking: Booking;
	cancelling: boolean;
	onCancel: (booking: Booking) => void;
}

const BookingItem = (props: BookingItemProps) => {
	const { booking, cancelling, onCancel } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const { openChat, opening } = useOpenChat();
	const clinic = booking.clinicData;
	const photo = clinic?.clinicImages?.[0];
	const pending = booking.bookingStatus === BookingStatus.PENDING;
	const confirmed = booking.bookingStatus === BookingStatus.CONFIRMED;
	const lateToCancel = confirmed && new Date(booking.bookingDate).getTime() - Date.now() < CANCEL_BEFORE_MS;
	const interpreter = LANGUAGES.find((lang) => lang.code === booking.bookingInterpreter)?.label;
	const clinicHref = `/clinics/detail?id=${booking.clinicId}`;

	return (
		<Box component={'article'} className={'booking-item mv-enter'}>
			<span className={'photo'}>
				{photo ? <img src={imageUrl(photo, REACT_APP_API_URL)} alt={''} /> : initials(clinic?.clinicName)}
			</span>
			<div className={'body'}>
				<div className={'top'}>
					<StatusChip status={booking.bookingStatus} size={'small'} />
					<span className={'code'}>#{booking.bookingCode}</span>
				</div>
				<strong className={'title'}>
					{booking.treatmentData?.treatmentName} · {clinic?.clinicName}
				</strong>
				<span className={'when'}>
					{seoulTime(booking.bookingDate, router.locale, false)} · {seoulClock(booking.bookingDate)} ({t('Seoul')})
				</span>
				<span className={'meta'}>
					{t('Dr.')} {booking.doctorData?.doctorName} ·{' '}
					{interpreter ? t('{{lang}} interpreter', { lang: interpreter }) : t('No interpreter')} ·{' '}
					{formatKrw(booking.bookingPrice)}
				</span>
				{pending && (
					<span className={'hint'}>
						{t('The clinic answers by {{time}}', {
							time: `${seoulTime(booking.respondDeadline, router.locale, false)} · ${seoulClock(booking.respondDeadline)}`,
						})}
					</span>
				)}
				{booking.bookingStatus === BookingStatus.DECLINED && booking.bookingDeclineReason && (
					<span className={'hint danger'}>{booking.bookingDeclineReason}</span>
				)}
				{lateToCancel && <span className={'hint'}>{t('Less than 24 hours left — contact the clinic to cancel.')}</span>}
			</div>
			<div className={'actions'}>
				<Button variant={'outlined'} size={'small'} LinkComponent={Link} href={clinicHref}>
					{pending || confirmed ? t('Clinic page') : t('Book again')}
				</Button>
				{(pending || confirmed) && (
					<Button variant={'outlined'} size={'small'} disabled={opening} onClick={() => openChat(booking.clinicId)}>
						{t('Chat with clinic')}
					</Button>
				)}
				{(pending || (confirmed && !lateToCancel)) && (
					<Button
						variant={'outlined'}
						color={'error'}
						size={'small'}
						disabled={cancelling}
						onClick={() => onCancel(booking)}
					>
						{pending ? t('Cancel request') : t('Cancel booking')}
					</Button>
				)}
			</div>
		</Box>
	);
};

export default BookingItem;
