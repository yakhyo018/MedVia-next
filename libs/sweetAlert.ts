import Swal, { SweetAlertIcon } from 'sweetalert2';
import { i18n } from 'next-i18next';
import { Messages } from './config';

/** Alerts live outside React, so they read the active language from the i18next instance. */
const t = (key: string): string => i18n?.t(key) ?? key;

/**
 * MedVia look: SweetAlert's own button styles are off and every part gets a class
 * from scss/pc/alert.scss, which reads the design tokens.
 */
const MODAL_CLASSES = {
	container: 'mv-swal',
	popup: 'mv-swal-popup',
	icon: 'mv-swal-icon',
	title: 'mv-swal-title',
	htmlContainer: 'mv-swal-text',
	actions: 'mv-swal-actions',
	confirmButton: 'mv-swal-btn mv-swal-btn--primary',
	cancelButton: 'mv-swal-btn mv-swal-btn--outlined',
};

const MedviaSwal = Swal.mixin({
	buttonsStyling: false,
	reverseButtons: true,
	customClass: MODAL_CLASSES,
});

const MedviaToast = Swal.mixin({
	toast: true,
	position: 'top',
	showConfirmButton: false,
	timerProgressBar: false,
	customClass: {
		container: 'mv-swal mv-swal--toast',
		popup: 'mv-toast',
		icon: 'mv-toast-icon',
		title: 'mv-toast-title',
	},
});

/** The API prefixes nothing today; the replace keeps old "Definer: " texts readable. */
const clean = (msg: string): string => t(msg.replace('Definer: ', ''));

const confirmWith = async (msg: string, confirmText: string, danger: boolean, icon?: SweetAlertIcon) => {
	const result = await MedviaSwal.fire({
		icon,
		title: clean(msg),
		showCancelButton: true,
		confirmButtonText: t(confirmText),
		cancelButtonText: t('Cancel'),
		customClass: {
			...MODAL_CLASSES,
			confirmButton: `mv-swal-btn ${danger ? 'mv-swal-btn--danger' : 'mv-swal-btn--primary'}`,
		},
	});
	return result.isConfirmed;
};

export const sweetErrorHandling = async (err: Error) => {
	await MedviaSwal.fire({
		icon: 'error',
		text: clean(err.message),
		showConfirmButton: false,
	});
};

export const sweetTopSuccessAlert = async (msg: string, duration: number = 2000) => {
	await MedviaSwal.fire({
		icon: 'success',
		title: clean(msg),
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetContactAlert = async (msg: string, duration: number = 10000) => {
	await MedviaSwal.fire({
		title: clean(msg),
		showConfirmButton: false,
		timer: duration,
	});
};

/** Teal confirm, outlined cancel. */
export const sweetConfirmAlert = async (msg: string, confirmText: string = 'Confirm'): Promise<boolean> => {
	return await confirmWith(msg, confirmText, false, 'question');
};

/** Red confirm for what cannot be undone: cancel a booking, delete a post. */
export const sweetDangerConfirmAlert = async (msg: string, confirmText: string = 'Delete'): Promise<boolean> => {
	return await confirmWith(msg, confirmText, true, 'warning');
};

/** "Please log in first" with a teal Log in button; the caller routes to /account/join. */
export const sweetLoginConfirmAlert = async (msg: string): Promise<boolean> => {
	return await confirmWith(msg, 'Log in', false);
};

export const sweetErrorAlert = async (msg: string, duration: number = 5000) => {
	await MedviaSwal.fire({
		icon: 'error',
		title: clean(msg),
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetMixinErrorAlert = async (msg: string, duration: number = 3000) => {
	await MedviaSwal.fire({
		icon: 'error',
		title: clean(msg),
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetMixinSuccessAlert = async (msg: string, duration: number = 2000) => {
	await MedviaSwal.fire({
		icon: 'success',
		title: clean(msg),
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetBasicAlert = async (text: string) => {
	await MedviaSwal.fire({ title: clean(text), confirmButtonText: t('OK') });
};

export const sweetErrorHandlingForAdmin = async (err: Error) => {
	const errorMessage = err.message ?? Messages.SOMETHING_WENT_WRONG;
	await MedviaSwal.fire({
		icon: 'error',
		text: clean(errorMessage),
		showConfirmButton: false,
	});
};

/** White pill at the top with a green mark. */
export const sweetTopSmallSuccessAlert = async (
	msg: string,
	duration: number = 2000,
	enable_forward: boolean = false,
) => {
	await MedviaToast.fire({
		icon: 'success',
		title: clean(msg),
		timer: duration,
	});
	if (enable_forward) window.location.reload();
};
