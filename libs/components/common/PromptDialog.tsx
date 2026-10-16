import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

interface PromptDialogProps {
	open: boolean;
	title: string;
	/** A line under the title: what happens after. */
	text?: string;
	label: string;
	confirmText: string;
	/** Red confirm: decline, cancel, remove. */
	danger?: boolean;
	type?: 'text' | 'password';
	/** The shortest accepted answer; 0 = optional. */
	minLength?: number;
	maxLength?: number;
	/** Shown under the field when the answer is too short. */
	errorText?: string;
	busy?: boolean;
	onConfirm: (value: string) => void;
	onClose: () => void;
}

/** A confirm with one text answer: the reason to decline or cancel, a block note, a new password. */
const PromptDialog = (props: PromptDialogProps) => {
	const { open, title, text, label, confirmText, danger = false, type = 'text', minLength = 0 } = props;
	const { maxLength = 300, errorText, busy = false, onConfirm, onClose } = props;
	const { t } = useTranslation('common');
	const [value, setValue] = useState<string>('');
	const [error, setError] = useState<boolean>(false);

	useEffect(() => {
		if (open) {
			setValue('');
			setError(false);
		}
	}, [open]);

	const submitHandler = (event: React.FormEvent) => {
		event.preventDefault();
		if (value.trim().length < minLength) {
			setError(true);
			return;
		}
		onConfirm(value.trim());
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth={'xs'} fullWidth className={'prompt-dialog'}>
			<form noValidate onSubmit={submitHandler}>
				<DialogTitle>{title}</DialogTitle>
				<DialogContent className={'fields'}>
					{text && <p className={'hint'}>{text}</p>}
					<TextField
						autoFocus
						fullWidth
						type={type}
						label={label}
						value={value}
						multiline={type === 'text'}
						minRows={type === 'text' ? 2 : undefined}
						onChange={(event) => {
							setValue(event.target.value);
							setError(false);
						}}
						error={error}
						helperText={error ? (errorText ?? t('Please fill in all required fields!')) : undefined}
						inputProps={{ maxLength }}
					/>
				</DialogContent>
				<DialogActions>
					<Button variant={'outlined'} onClick={onClose}>
						{t('Cancel')}
					</Button>
					<Button type={'submit'} variant={'contained'} color={danger ? 'error' : 'primary'} disabled={busy}>
						{confirmText}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default PromptDialog;
