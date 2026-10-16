import { ReactNode } from 'react';
import { Skeleton } from '@mui/material';

interface AdminStatCardProps {
	label: string;
	value?: number | string | null;
	/** A line under the number ("3 older than 2 h"). */
	sub?: string;
	/** The round icon on the left; none on the Bookings monitor. */
	icon?: ReactNode;
	tone?: 'teal' | 'warning' | 'success' | 'danger';
}

/** One number of a stats row; a skeleton while the value is unknown. */
const AdminStatCard = (props: AdminStatCardProps) => {
	const { label, value, sub, icon, tone = 'teal' } = props;

	return (
		<div className={'admin-stat'}>
			{icon && <span className={`icon ${tone}`}>{icon}</span>}
			<div className={'text'}>
				<span className={'label'}>{label}</span>
				{value === undefined || value === null ? (
					<Skeleton width={48} height={34} />
				) : (
					<strong>{typeof value === 'number' ? value.toLocaleString('en-US') : value}</strong>
				)}
				{sub && <span className={'sub'}>{sub}</span>}
			</div>
		</div>
	);
};

export default AdminStatCard;
