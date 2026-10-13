import { useRouter } from 'next/router';
import { useMutation, useReactiveVar } from '@apollo/client';
import { FOLLOW_MEMBER, UNFOLLOW_MEMBER } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { sweetLoginConfirmAlert, sweetMixinErrorAlert } from '../sweetAlert';
import { ClientMessages } from '../config';

interface FollowTarget {
	/** Apollo's __typename of the followed card: 'Doctor' or 'Clinic'. */
	typename: 'Doctor' | 'Clinic';
	/** The doctor's or clinic's own _id (the cache entry). */
	id: string;
	/** The account that is followed: Doctor.memberId / Clinic.memberId. */
	memberId: string;
	following: boolean;
}

/**
 * The Follow button on a doctor or clinic. A guest is asked to log in (and comes back);
 * the counter and the button change in the cache, without a refetch.
 */
const useFollow = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [followMember] = useMutation(FOLLOW_MEMBER);
	const [unfollowMember] = useMutation(UNFOLLOW_MEMBER);

	return async (target: FollowTarget) => {
		try {
			if (!user._id) {
				const login = await sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED);
				if (login) await router.push({ pathname: '/account/join', query: { referrer: router.asPath } });
				return;
			}
			const mutate = target.following ? unfollowMember : followMember;
			const counter = target.typename === 'Doctor' ? 'doctorFollowers' : 'clinicFollowers';
			await mutate({
				variables: { input: { memberId: target.memberId } },
				update: (cache) => {
					cache.modify<Record<string, boolean | number>>({
						id: cache.identify({ __typename: target.typename, _id: target.id }),
						fields: {
							meFollowed: () => !target.following,
							[counter]: (n) => Math.max(0, Number(n ?? 0) + (target.following ? -1 : 1)),
						},
					});
				},
			});
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};
};

export default useFollow;
