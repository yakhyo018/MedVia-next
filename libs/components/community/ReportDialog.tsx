import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useMutation } from '@apollo/client';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Radio,
	RadioGroup,
	TextField,
} from '@mui/material';
import { REPORT_CONTENT } from '../../../apollo/user/mutation';
import { ReportGroup, ReportReason } from '../../enums/board-article.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

export const REASONS: Record<ReportReason, string> = {
	[ReportReason.SPAM]: 'Spam',
	[ReportReason.ADVERTISING]: 'Advertising',
	[ReportReason.MEDICAL_MISINFORMATION]: 'Wrong medical information',
	[ReportReason.PERSONAL_DATA]: 'Someone’s personal data',
	[ReportReason.ABUSE]: 'Abuse',
	[ReportReason.OTHER]: 'Other',
};

interface ReportDialogProps {
	/** What is reported; null closes the dialog. */
	target: { group: ReportGroup; id: string } | null;
	onClose: () => void;
}

/** Report a post or a comment. Five reports hide it until MedVia decides. */
const ReportDialog = (props: ReportDialogProps) => {
	const { target, onClose } = props;
	const { t } = useTranslation('common');
	const [reason, setReason] = useState<ReportReason>(ReportReason.SPAM);
	const [detail, setDetail] = useState<string>('');
	const [reportContent, { loading }] = useMutation(REPORT_CONTENT);

	useEffect(() => {
		if (target) {
			setReason(ReportReason.SPAM);
			setDetail('');
		}
	}, [target]);

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!target) return;
		try {
			await reportContent({
				variables: {
					input: {
						reportGroup: target.group,
						reportRefId: target.id,
						reportReason: reason,
						...(detail.trim() ? { reportDetail: detail.trim() } : {}),
					},
				},
			});
			onClose();
			await sweetTopSmallSuccessAlert(t('Thank you. MedVia will look at it.'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return (
		<Dialog open={Boolean(target)} onClose={onClose} maxWidth={'xs'} fullWidth className={'prompt-dialog'}>
			<form noValidate onSubmit={submitHandler}>
				<DialogTitle>
					{target?.group === ReportGroup.COMMENT ? t('Report this comment') : t('Report this post')}
				</DialogTitle>
				<DialogContent className={'fields'}>
					<RadioGroup value={reason} onChange={(event) => setReason(event.target.value as ReportReason)}>
						{Object.values(ReportReason).map((value) => (
							<FormControlLabel
								key={value}
								value={value}
								control={<Radio size={'small'} />}
								label={t(REASONS[value])}
							/>
						))}
					</RadioGroup>
					<TextField
						label={t('Details (optional)')}
						multiline
						minRows={2}
						value={detail}
						onChange={(event) => setDetail(event.target.value)}
						inputProps={{ maxLength: 500 }}
					/>
				</DialogContent>
				<DialogActions>
					<Button variant={'outlined'} onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button type={'submit'} variant={'contained'} color={'error'} disabled={loading}>
						{t('Report')}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default ReportDialog;
