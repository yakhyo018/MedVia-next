import { ReactNode } from 'react';

export interface AdminPill {
	key: string;
	label: string;
	/** "Pending (12)"; left out while unknown. */
	count?: number | null;
}

interface AdminPillsProps {
	pills: AdminPill[];
	active: string;
	onChange: (key: string) => void;
	/** Something on the right of the row (a note, Export, New notice). */
	end?: ReactNode;
	label?: string;
}

/** The filter pills above an admin list; the active one is teal. */
const AdminPills = (props: AdminPillsProps) => {
	const { pills, active, onChange, end, label } = props;

	return (
		<div className={'admin-pills-row'}>
			<div className={'admin-pills'} role={'tablist'} aria-label={label}>
				{pills.map((pill) => (
					<button
						key={pill.key}
						type={'button'}
						role={'tab'}
						aria-selected={pill.key === active}
						className={pill.key === active ? 'active' : ''}
						onClick={() => onChange(pill.key)}
					>
						{pill.label}
						{typeof pill.count === 'number' && ` (${pill.count.toLocaleString('en-US')})`}
					</button>
				))}
			</div>
			{end && <div className={'end'}>{end}</div>}
		</div>
	);
};

export default AdminPills;
