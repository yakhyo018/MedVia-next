import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box, Button } from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';
import StatusChip from '../common/StatusChip';
import useOpenChat from '../../hooks/useOpenChat';
import { Booking } from '../../types/booking/booking';
import { LANGUAGES, SEOUL_TIME_ZONE } from '../../config';
import { seoulClock, seoulDateKey, seoulTime } from '../../utils';

const DAY_MS = 24 * 60 * 60 * 1000;

interface NextVisitCardProps {
	booking: Booking;
}

/** The overview's first card: the next upcoming visit, with the two things a patient needs then. */
const NextVisitCard = (props: NextVisitCardProps) => {
	const { booking } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const { openChat, opening } = useOpenChat();
	const date = new Date(booking.bookingDate);
	const part = (options: Intl.DateTimeFormatOptions) =>
		new Intl.DateTimeFormat(router.locale, { ...options, timeZone: SEOUL_TIME_ZONE }).format(date);
	const day = seoulDateKey(date);
	let when = seoulTime(date, router.locale, false);
	if (day === seoulDateKey(Date.now())) when = t('Today');
	else if (day === seoulDateKey(Date.now() + DAY_MS)) when = t('Tomorrow');
	const interpreter = LANGUAGES.find((lang) => lang.code === booking.bookingInterpreter)?.label;
	// [lng, lat] in GeoJSON; Google Maps takes "lat,lng" and needs no key for a directions link.
	const point = booking.clinicData?.clinicLocation?.coordinates;
	const directions =
		point?.length === 2 ? `https://www.google.com/maps/dir/?api=1&destination=${point[1]},${point[0]}` : '';

	return (
		<Box component={'article'} className={'next-visit card'}>
			<div className={'main'}>
				<span className={'date'} aria-hidden={'true'}>
					<span>{part({ weekday: 'short' })}</span>
					<strong>{part({ day: 'numeric' })}</strong>
				</span>
				<div className={'text'}>
					<span className={'when'}>
						<StatusChip status={booking.bookingStatus} size={'small'} />
						<b>
							{when} · {seoulClock(date)}
						</b>
					</span>
					<strong className={'title'}>
						{booking.treatmentData?.treatmentName} · {booking.clinicData?.clinicName}
					</strong>
					<span className={'meta'}>
						{t('Dr.')} {booking.doctorData?.doctorName} ·{' '}
						{interpreter ? t('{{lang}} interpreter', { lang: interpreter }) : t('No interpreter')} · {t('Seoul time')}
					</span>
				</div>
			</div>
			<div className={'actions'}>
				<Button
					variant={'contained'}
					startIcon={<ChatBubbleOutlineRoundedIcon />}
					disabled={opening}
					onClick={() => openChat(booking.clinicId)}
				>
					{t('Chat with clinic')}
				</Button>
				{directions && (
					<Button
						variant={'outlined'}
						startIcon={<DirectionsOutlinedIcon />}
						href={directions}
						target={'_blank'}
						rel={'noopener noreferrer'}
					>
						{t('Directions')}
					</Button>
				)}
			</div>
		</Box>
	);
};

export default NextVisitCard;
