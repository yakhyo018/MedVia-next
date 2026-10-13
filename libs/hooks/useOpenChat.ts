import { useRouter } from 'next/router';
import { useMutation, useReactiveVar } from '@apollo/client';
import { OPEN_ROOM } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { MemberType } from '../enums/member.enum';
import { ClientMessages } from '../config';
import { sweetLoginConfirmAlert, sweetMixinErrorAlert } from '../sweetAlert';

/**
 * "Chat with clinic": the patient's room with this clinic (created on first use), then the chat
 * page on it. A guest is asked to log in and comes back; other account types are refused.
 */
const useOpenChat = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [openRoom, { loading }] = useMutation(OPEN_ROOM);

	const openChat = async (clinicId: string) => {
		try {
			if (!user._id) {
				const login = await sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED);
				if (login) await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
				return;
			}
			if (user.memberType !== MemberType.USER) throw new Error(ClientMessages.PATIENTS_ONLY);
			const result = await openRoom({ variables: { clinicId } });
			await router.push({ pathname: '/mypage/chat', query: { room: result.data.openRoom._id } });
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	return { openChat, opening: loading };
};

export default useOpenChat;
