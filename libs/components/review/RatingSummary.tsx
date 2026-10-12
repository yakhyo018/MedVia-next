import { useTranslation } from 'next-i18next';
import { Box } from '@mui/material';
import { RatingSummary as Summary } from '../../types/review/review';
import Stars from './Stars';

interface RatingSummaryProps {
	summary: Summary;
}

/** The big average, its stars and one bar per star count (5 → 1). */
const RatingSummary = (props: RatingSummaryProps) => {
	const { summary } = props;
	const { t } = useTranslation('common');
	const rows = [...summary.distribution].sort((a, b) => b.stars - a.stars);

	return (
		<Box className={'rating-summary'}>
			<div className={'score'}>
				<strong>{summary.rating.toFixed(1)}</strong>
				<Stars value={summary.rating} size={18} />
				<span>
					{summary.reviews} {t('verified reviews')}
				</span>
			</div>
			<div className={'bars'}>
				{rows.map((row) => {
					const share = summary.reviews ? Math.round((row.count / summary.reviews) * 100) : 0;
					return (
						<div key={row.stars} className={'bar'}>
							<span>{row.stars}</span>
							<i>
								<b style={{ width: `${share}%` }} />
							</i>
							<em>{share}%</em>
						</div>
					);
				})}
			</div>
		</Box>
	);
};

export default RatingSummary;
