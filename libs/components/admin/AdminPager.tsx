import { useTranslation } from 'next-i18next';
import { Pagination } from '@mui/material';
import { ADMIN_I18N, ADMIN_NS } from './adminText';

interface AdminPagerProps {
	page: number;
	limit: number;
	total: number;
	/** Rows on this page. */
	shown: number;
	onChange: (page: number) => void;
}

/** A list's footer: "1–10 of 42" and the page buttons (only when there is more than one page). */
const AdminPager = (props: AdminPagerProps) => {
	const { page, limit, total, shown, onChange } = props;
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const pages = Math.ceil(total / limit);
	const from = total ? (page - 1) * limit + 1 : 0;

	return (
		<div className={'admin-pager'}>
			<span>
				{t('Rows per page: {{limit}}', { limit })} ·{' '}
				{t('{{from}}–{{to}} of {{total}}', {
					from,
					to: from ? from + shown - 1 : 0,
					total: total.toLocaleString('en-US'),
				})}
			</span>
			{pages > 1 && (
				<Pagination
					page={Math.min(page, pages)}
					count={pages}
					shape={'rounded'}
					size={'small'}
					onChange={(_event, value) => onChange(value)}
				/>
			)}
		</div>
	);
};

export default AdminPager;
