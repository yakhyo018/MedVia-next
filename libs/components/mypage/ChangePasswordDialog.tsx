import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { changePassword } from '../../auth';
import { ClientMessages, PASSWORD_MAX, PASSWORD_MIN } from '../../config';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../sweetAlert';

interface ChangePasswordDialogProps {
	open: boolean;
	/** A Google-only account has no password yet: it sets its first one. */
	hasPassword: boolean;
	onClose: () => void;
}

interface PasswordForm {
	currentPassword: string;
	newPassword: string;
	repeatPassword: string;
}

const DEFAULT_INPUT: PasswordForm = { currentPassword: '', newPassword: '', repeatPassword: '' };

/** Change password. The API then signs out every other device; this one stays signed in. */
const ChangePasswordDialog = (props: ChangePasswordDialogProps) => {
	const { open, hasPassword, onClose } = props;
	const { t } = useTranslation('common');
	const [input, setInput] = useState<PasswordForm>(DEFAULT_INPUT);
	const [errors, setErrors] = useState<Partial<PasswordForm>>({});
	const [saving, setSaving] = useState<boolean>(false);

	const inputHandler = (name: keyof PasswordForm, value: string) => {
		setInput({ ...input, [name]: value });
		if (errors[name]) setErrors({ ...errors, [name]: undefined });
	};

	const closeHandler = () => {
		setInput(DEFAULT_INPUT);
		setErrors({});
		onClose();
	};

	const submitHandler = async (event: React.FormEvent) => {
		event.preventDefault();
		const found: Partial<PasswordForm> = {};
		if (hasPassword && !input.currentPassword) found.currentPassword = ClientMessages.FILL_ALL_INPUTS;
		if (input.newPassword.length < PASSWORD_MIN) found.newPassword = ClientMessages.PASSWORD_TOO_SHORT;
		if (input.repeatPassword !== input.newPassword) found.repeatPassword = ClientMessages.PASSWORDS_DIFFERENT;
		setErrors(found);
		if (Object.keys(found).length > 0) return;
		try {
			setSaving(true);
			await changePassword(input.newPassword, hasPassword ? input.currentPassword : undefined);
			closeHandler();
			await sweetTopSmallSuccessAlert(t('Password changed. Other devices are signed out.'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setSaving(false);
		}
	};

	const field = (name: keyof PasswordForm, label: string, autoComplete: string) => (
		<TextField
			type={'password'}
			label={label}
			value={input[name]}
			autoComplete={autoComplete}
			onChange={(event) => inputHandler(name, event.target.value)}
			error={Boolean(errors[name])}
			helperText={errors[name] ? t(errors[name] as string) : undefined}
			inputProps={{ maxLength: PASSWORD_MAX }}
			fullWidth
		/>
	);

	return (
		<Dialog open={open} onClose={closeHandler} maxWidth={'xs'} fullWidth className={'password-dialog'}>
			<form noValidate onSubmit={submitHandler}>
				<DialogTitle>{hasPassword ? t('Change password') : t('Set a password')}</DialogTitle>
				<DialogContent className={'fields'}>
					{hasPassword && field('currentPassword', t('Current password'), 'current-password')}
					{field('newPassword', t('New password'), 'new-password')}
					{field('repeatPassword', t('Repeat the new password'), 'new-password')}
				</DialogContent>
				<DialogActions>
					<Button variant={'outlined'} onClick={closeHandler}>
						{t('Cancel')}
					</Button>
					<Button type={'submit'} variant={'contained'} disabled={saving}>
						{t('Save')}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default ChangePasswordDialog;
