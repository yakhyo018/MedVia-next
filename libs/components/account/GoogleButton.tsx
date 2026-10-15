import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { googleLogIn } from '../../auth';
import { MemberType } from '../../enums/member.enum';
import { Language } from '../../enums/common.enum';
import { GOOGLE_CLIENT_ID, Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';

interface GoogleButtonProps {
	/** login: an existing account (or a linked one); signup: may create the patient account. */
	mode: 'login' | 'signup';
	/** The sign-up form's "I agree to the Terms" — a new account needs it. */
	termsAccepted: boolean;
	memberLang: Language;
	onSignedIn: () => void;
	/** A Google account without a MedVia account pressed it on the Log in tab. */
	onNeedsSignup: () => void;
}

/**
 * "Continue with Google" for patients: Google's own button gives an ID token, the API verifies
 * it (`googleLogin`) and starts the session like a password login. Hidden when no client id is
 * configured (REACT_APP_GOOGLE_CLIENT_ID).
 */
const GoogleButton = (props: GoogleButtonProps) => {
	const { mode, termsAccepted, memberLang, onSignedIn, onNeedsSignup } = props;
	const router = useRouter();
	const { t } = useTranslation('common');

	if (!GOOGLE_CLIENT_ID) return null;

	/** HANDLERS **/
	const credentialHandler = async (idToken?: string) => {
		if (!idToken) return sweetMixinErrorAlert(t(Messages.GOOGLE_TOKEN_INVALID));
		// A new account needs the terms: ask before anything is sent.
		if (mode === 'signup' && !termsAccepted) return sweetMixinErrorAlert(t(Messages.TERMS_REQUIRED));
		try {
			await googleLogIn({
				idToken,
				memberType: MemberType.USER,
				memberLang,
				...(mode === 'signup' ? { termsAccepted: true } : {}),
			});
			onSignedIn();
		} catch (err) {
			const message = (err as Error).message;
			if (mode === 'login' && message === Messages.TERMS_REQUIRED) {
				await sweetMixinErrorAlert(t('No MedVia account for this Google account yet — accept the terms to sign up.'));
				onNeedsSignup();
				return;
			}
			await sweetMixinErrorAlert(t(message));
		}
	};

	return (
		<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
			<div className={'google-sign-in'}>
				<span className={'or'}>{t('or')}</span>
				<GoogleLogin
					onSuccess={(response) => credentialHandler(response.credential)}
					onError={() => sweetMixinErrorAlert(t(Messages.GOOGLE_TOKEN_INVALID))}
					text={mode === 'signup' ? 'signup_with' : 'continue_with'}
					theme={'outline'}
					size={'large'}
					shape={'rectangular'}
					logo_alignment={'center'}
					width={'360'}
					locale={router.locale ?? 'en'}
				/>
			</div>
		</GoogleOAuthProvider>
	);
};

export default GoogleButton;
