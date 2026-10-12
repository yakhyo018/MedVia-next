import { useTranslation } from 'next-i18next';

type Tone = 'success' | 'warning' | 'danger' | 'teal' | 'neutral';

/** One colour per meaning, whatever the entity: a booking, a clinic, a review, a member. */
const TONES: Record<string, Tone> = {
	CONFIRMED: 'success',
	ACTIVE: 'success',
	PENDING: 'warning',
	HELD: 'warning',
	CHANGES_REQUESTED: 'warning',
	EDIT_REQUESTED: 'warning',
	DECLINED: 'danger',
	CANCELLED: 'danger',
	REJECTED: 'danger',
	SUSPENDED: 'danger',
	NO_SHOW: 'danger',
	BLOCK: 'danger',
	COMPLETED: 'teal',
	BOOKED: 'teal',
};

interface StatusChipProps {
	status: string;
	size?: 'small' | 'medium';
}

const StatusChip = (props: StatusChipProps) => {
	const { status, size = 'medium' } = props;
	const { t } = useTranslation('common');
	const tone = TONES[status] ?? 'neutral';

	return (
		<span className={`mv-status-chip ${tone} ${size}`}>
			<i />
			{t(`status.${status}`)}
		</span>
	);
};

export default StatusChip;
