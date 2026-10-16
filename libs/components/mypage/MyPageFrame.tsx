import { useTranslation } from 'next-i18next';
import WorkspaceFrame, { WorkspaceFrameProps } from '../layout/WorkspaceFrame';
import MyMenu from './MyMenu';
import { MemberType } from '../../enums/member.enum';

/**
 * Every MyPage section sits in this frame: the band and the side menu on a computer, a back link
 * on a phone (the overview lists the sections there). Only patient accounts get in.
 */
const MyPageFrame = (props: WorkspaceFrameProps) => {
	const { t } = useTranslation('common');

	return (
		<WorkspaceFrame
			{...props}
			home={{ href: '/mypage', label: t('My Page') }}
			memberType={MemberType.USER}
			deniedText={t('My Page is for patient accounts.')}
			side={<MyMenu variant={'side'} />}
		/>
	);
};

export default MyPageFrame;
