import { useRouter } from 'next/router';
import { useMutation, useReactiveVar } from '@apollo/client';
import { LIKE_TARGET } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { LikeGroup } from '../enums/like.enum';
import { MemberType } from '../enums/member.enum';
import { sweetLoginConfirmAlert, sweetMixinErrorAlert } from '../sweetAlert';
import { ClientMessages } from '../config';

/** The counter field of each liked type, so the card updates without a refetch. */
const COUNTER: Record<LikeGroup, { typename: string; field: string }> = {
	[LikeGroup.CLINIC]: { typename: 'Clinic', field: 'clinicLikes' },
	[LikeGroup.DOCTOR]: { typename: 'Doctor', field: 'doctorLikes' },
	[LikeGroup.ARTICLE]: { typename: 'BoardArticle', field: 'articleLikes' },
};

/**
 * The heart on a clinic, doctor or post. A guest is asked to log in (and comes back here);
 * clinic, doctor and admin accounts cannot like — the API would refuse them.
 */
const useLikeTarget = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [likeTarget] = useMutation(LIKE_TARGET);

	return async (likeGroup: LikeGroup, likeRefId: string) => {
		try {
			if (!user._id) {
				const login = await sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED);
				if (login) await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
				return;
			}
			if (user.memberType !== MemberType.USER) {
				await sweetMixinErrorAlert(ClientMessages.PATIENTS_ONLY);
				return;
			}
			await likeTarget({
				variables: { input: { likeGroup, likeRefId } },
				update: (cache, { data }) => {
					const result = data?.likeTarget;
					if (!result) return;
					const { typename, field } = COUNTER[likeGroup];
					cache.modify({
						id: cache.identify({ __typename: typename, _id: likeRefId }),
						fields: { meLiked: () => result.meLiked, [field]: () => result.likes },
					});
				},
			});
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};
};

export default useLikeTarget;
