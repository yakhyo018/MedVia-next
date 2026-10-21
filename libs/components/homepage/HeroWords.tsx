import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

/** "in your language" as the patients we serve write it — a showcase, like HeroChat's messages. */
const PHRASES: Record<string, string> = {
	uz: 'oʻz tilingizda',
	ru: 'на своём языке',
};
const INTERVAL = 2600;

/**
 * The hero's last line: the page language first (so the server render and the first frame match),
 * then the same words in the other patient languages. Screen readers get the page language only.
 */
const HeroWords = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const words = [
		t('in your language'),
		...Object.keys(PHRASES)
			.filter((l) => l !== router.locale)
			.map((l) => PHRASES[l]),
	];
	const [index, setIndex] = useState<number>(0);

	/** LIFECYCLES **/
	useEffect(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), INTERVAL);
		return () => clearInterval(timer);
	}, [words.length]);

	return (
		<em className={'hero-words'}>
			<span className={'sr-text'}>{words[0]}</span>
			<span key={index} className={'word'} aria-hidden={'true'}>
				{words[index]}.
			</span>
		</em>
	);
};

export default HeroWords;
