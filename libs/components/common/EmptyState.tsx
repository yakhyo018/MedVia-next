import { ReactNode } from 'react';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
	title: string;
	text?: string;
	action?: ReactNode;
}

const EmptyState = (props: EmptyStateProps) => {
	const { title, text, action } = props;

	return (
		<div className={'mv-empty-state'}>
			<span className={'icon'}>
				<InboxOutlinedIcon />
			</span>
			<strong>{title}</strong>
			{text && <p>{text}</p>}
			{action}
		</div>
	);
};

export default EmptyState;
