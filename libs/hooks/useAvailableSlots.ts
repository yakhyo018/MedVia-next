import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { GET_AVAILABLE_SLOTS } from '../../apollo/user/query';

export interface FreeTime {
	/** ISO start (UTC), exactly as the API returned it — holdSlots takes it back. */
	start: string;
	/** The doctor who has this time. With "any doctor", the first of them. */
	doctorId: string;
}

/**
 * The free times of one treatment on one Seoul day. The API answers per doctor, so "any
 * available doctor" asks each doctor who performs it and merges the answers by time.
 */
const useAvailableSlots = (treatmentId: string, doctorIds: string[], date: string) => {
	const client = useApolloClient();
	const [times, setTimes] = useState<FreeTime[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const doctorKey = doctorIds.join(',');

	useEffect(() => {
		if (!treatmentId || !doctorKey || !date) {
			setTimes([]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError('');
		Promise.all(
			doctorKey.split(',').map((doctorId) =>
				client
					.query({
						query: GET_AVAILABLE_SLOTS,
						variables: { input: { treatmentId, doctorId, date } },
						fetchPolicy: 'network-only',
					})
					.then((result) => (result.data?.getAvailableSlots ?? []).map((start: string) => ({ start, doctorId }))),
			),
		)
			.then((perDoctor: FreeTime[][]) => {
				if (cancelled) return;
				const byTime = new Map<string, FreeTime>();
				perDoctor.flat().forEach((time) => {
					if (!byTime.has(time.start)) byTime.set(time.start, time);
				});
				setTimes(Array.from(byTime.values()).sort((a, b) => a.start.localeCompare(b.start)));
			})
			.catch((err: Error) => {
				if (!cancelled) setError(err.message);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [client, treatmentId, doctorKey, date]);

	return { times, loading, error };
};

export default useAvailableSlots;
