import { useTranslation } from 'next-i18next';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../sweetAlert';

/** Share this page: the phone's share sheet when there is one, else copy the link. */
const useShare = () => {
	const { t } = useTranslation('common');

	return async (title?: string) => {
		try {
			const url = window.location.href;
			if (navigator.share) {
				await navigator.share({ title, url });
				return;
			}
			await navigator.clipboard.writeText(url);
			await sweetTopSmallSuccessAlert(t('Link copied'), 1500);
		} catch (err) {
			// Closing the share sheet is not an error.
			if ((err as Error).name === 'AbortError') return;
			await sweetMixinErrorAlert((err as Error).message);
		}
	};
};

export default useShare;
