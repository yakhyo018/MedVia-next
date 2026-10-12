import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Box } from '@mui/material';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';

/** When each step of the sample conversation appears, in ms after load. */
const STEPS = [900, 1600, 2300, 3600];

/**
 * A sample chat on the hero photo: the patient writes in Russian, the clinic reads Korean,
 * the answer comes back in Russian. The messages are a showcase, not translated per locale.
 */
interface HeroChatProps {
	/** Phones: two messages, no translation line, sits on the photo's bottom edge. */
	compact?: boolean;
}

const HeroChat = (props: HeroChatProps) => {
	const { compact = false } = props;
	const { t } = useTranslation('common');
	const [step, setStep] = useState<number>(0);

	/** LIFECYCLES **/
	useEffect(() => {
		const timers = STEPS.map((delay, index) => setTimeout(() => setStep(index + 1), delay));
		return () => timers.forEach(clearTimeout);
	}, []);

	return (
		<Box className={`hero-chat mv-enter ${compact ? 'compact' : ''}`}>
			<div className={'chat-head'}>
				<span className={'avatar'}>SG</span>
				<div>
					<strong>Seoul Glow Dermatology</strong>
					<span className={'online'}>
						<i />
						{t('Online · replies in minutes')}
					</span>
				</div>
			</div>
			<div className={'chat-body'}>
				{step >= 1 && <p className={'bubble mine mv-pop'}>Здравствуйте! Можно записаться на завтра?</p>}
				{step >= 2 && !compact && (
					<p className={'translated mv-pop'}>
						<TranslateRoundedIcon />
						안녕하세요! 내일 예약 가능할까요?
					</p>
				)}
				{step === 3 && (
					<p className={'bubble typing mv-pop'} aria-label={t('typing')}>
						<i />
						<i />
						<i />
					</p>
				)}
				{step >= 4 && <p className={'bubble theirs mv-pop'}>Да, завтра свободно в 14:00. Забронировать?</p>}
			</div>
		</Box>
	);
};

export default HeroChat;
