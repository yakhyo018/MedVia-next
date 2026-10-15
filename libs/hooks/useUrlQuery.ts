import { useRouter } from 'next/router';

type QueryPatch = Record<string, string | number | undefined | null>;

/**
 * A list page's state in the URL (`?tab=&page=&text=`): back / forward and shared links keep
 * it. `set` merges a patch, drops empty values and, unless the patch names `page`, goes back to
 * page 1 — a new filter never opens on page 7.
 */
const useUrlQuery = () => {
	const router = useRouter();

	const get = (key: string): string => {
		const value = router.query[key];
		return typeof value === 'string' ? value : '';
	};

	const page = Math.max(1, Number(get('page')) || 1);

	const set = async (patch: QueryPatch) => {
		const query: Record<string, string> = {};
		for (const [key, value] of Object.entries(router.query)) if (typeof value === 'string') query[key] = value;
		if (!('page' in patch)) delete query.page;
		for (const [key, value] of Object.entries(patch)) {
			if (value === undefined || value === null || value === '' || (key === 'page' && Number(value) <= 1))
				delete query[key];
			else query[key] = String(value);
		}
		await router.push({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
	};

	return { get, page, set, ready: router.isReady };
};

export default useUrlQuery;
