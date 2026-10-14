import { useTranslation } from 'next-i18next';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { MemberType } from '../../enums/member.enum';

interface AuthorBadgeProps {
	authorType?: MemberType;
}

/** "Doctor" next to a doctor's name (accounts made by verified clinics); "MedVia" for the team. */
const AuthorBadge = (props: AuthorBadgeProps) => {
	const { authorType } = props;
	const { t } = useTranslation('common');
	if (authorType === MemberType.DOCTOR) {
		return (
			<span className={'author-badge doctor'}>
				<VerifiedRoundedIcon />
				{t('Doctor')}
			</span>
		);
	}
	if (authorType === MemberType.ADMIN) return <span className={'author-badge team'}>{t('MedVia team')}</span>;
	return null;
};

export default AuthorBadge;
