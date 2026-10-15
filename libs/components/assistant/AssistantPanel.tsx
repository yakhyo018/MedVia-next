import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { Button, IconButton, Skeleton, TextField, Tooltip } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import AssistantText from './AssistantText';
import { GET_DOCTOR_CLINIC, GET_MY_ASSISTANT_SESSION } from '../../../apollo/user/query';
import {
	CLOSE_ASSISTANT_SESSION,
	CONFIRM_ASSISTANT_HOLD,
	SEND_ASSISTANT_MESSAGE,
	SET_AI_CONSENT,
} from '../../../apollo/user/mutation';
import { userVar } from '../../../apollo/store';
import {
	AssistantClinicCard,
	AssistantHold,
	AssistantReply,
	AssistantSession,
	AssistantSlotOption,
} from '../../types/assistant/assistant';
import { SlotHold } from '../../types/booking/booking';
import { Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';
import { formatKrw, seoulTime } from '../../utils';

/** The API's `@Length(1, 1000)` on a message. */
const MESSAGE_MAX = 1000;

/** Ready-made first questions (the patient's own language through i18n). */
const SUGGESTIONS = [
	'Laser toning in Gangnam next week',
	'A dentist who speaks Russian',
	'A health check-up this Saturday',
];

interface ChatItem {
	role: 'user' | 'assistant';
	text: string;
	/** Only the reply that found them carries cards; restored turns are text only (the API keeps text). */
	clinics?: AssistantClinicCard[];
	slots?: AssistantSlotOption[];
}

interface AssistantPanelProps {
	onClose: () => void;
}

/**
 * The booking assistant: the patient writes in their language, the assistant searches clinics
 * and free times, and may propose one time. Nothing is held until the patient presses Confirm
 * (`confirmAssistantHold`); then the usual booking page takes over (questionnaire, consents).
 */
const AssistantPanel = (props: AssistantPanelProps) => {
	const { onClose } = props;
	const router = useRouter();
	const client = useApolloClient();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [sessionId, setSessionId] = useState<string>('');
	const [items, setItems] = useState<ChatItem[]>([]);
	const [hold, setHold] = useState<AssistantHold | null>(null);
	const [text, setText] = useState<string>('');
	const [loadingSession, setLoadingSession] = useState<boolean>(true);
	const [full, setFull] = useState<boolean>(false);
	const [now, setNow] = useState<number>(Date.now());
	const listRef = useRef<HTMLDivElement>(null);
	const consented = Boolean(user.memberAiConsentAt);

	/** APOLLO REQUESTS **/
	const [sendAssistantMessage, { loading: sending }] = useMutation(SEND_ASSISTANT_MESSAGE);
	const [confirmAssistantHold, { loading: confirming }] = useMutation(CONFIRM_ASSISTANT_HOLD);
	const [closeAssistantSession, { loading: closing }] = useMutation(CLOSE_ASSISTANT_SESSION);
	const [setAiConsent, { loading: consenting }] = useMutation(SET_AI_CONSENT);
	const holdLeft = hold ? Math.max(0, new Date(hold.expiresAt).getTime() - now) : 0;

	/** LIFECYCLES **/
	useEffect(() => {
		// The active conversation comes back on open; "no session" (NO_DATA_FOUND) is a fresh start.
		if (!consented) {
			setLoadingSession(false);
			return;
		}
		let alive = true;
		client
			.query({ query: GET_MY_ASSISTANT_SESSION, fetchPolicy: 'network-only' })
			.then(({ data }) => {
				const session: AssistantSession | undefined = data?.getMyAssistantSession;
				if (!alive || !session) return;
				setSessionId(session._id);
				setItems(session.turns.map((turn) => ({ role: turn.role === 'user' ? 'user' : 'assistant', text: turn.text })));
				setHold(session.pendingHold ?? null);
			})
			.catch(() => undefined)
			.finally(() => alive && setLoadingSession(false));
		return () => {
			alive = false;
		};
	}, [client, consented]);

	useEffect(() => {
		listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
	}, [items.length, sending, hold]);

	useEffect(() => {
		// The proposal's countdown.
		if (!hold) return;
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, [hold]);

	/** HANDLERS **/
	const sendHandler = async (message: string) => {
		const body = message.trim();
		if (!body || sending) return;
		setItems((current) => [...current, { role: 'user', text: body }]);
		setText('');
		try {
			const { data } = await sendAssistantMessage({
				variables: { input: { text: body, ...(sessionId ? { sessionId } : {}) } },
			});
			const reply: AssistantReply = data.sendAssistantMessage;
			setSessionId(reply.sessionId);
			setItems((current) => [
				...current,
				{ role: 'assistant', text: reply.text, clinics: reply.clinics, slots: reply.slots },
			]);
			setHold(reply.pendingHold ?? null);
			setNow(Date.now());
		} catch (err) {
			const errorText = (err as Error).message;
			// The message did not count: take it back into the field.
			setItems((current) => current.slice(0, -1));
			setText(body);
			if (errorText === Messages.ASSISTANT_SESSION_FULL) setFull(true);
			else if (errorText === Messages.NO_DATA_FOUND) setSessionId('');
			else await sweetMixinErrorAlert(errorText);
		}
	};

	const submitHandler = (event: React.FormEvent) => {
		event.preventDefault();
		sendHandler(text);
	};

	const keyHandler = (event: React.KeyboardEvent) => {
		// Enter sends, Shift+Enter breaks the line (not while an IME is composing Korean).
		if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
			event.preventDefault();
			sendHandler(text);
		}
	};

	const newChatHandler = async () => {
		try {
			if (sessionId) await closeAssistantSession({ variables: { sessionId } });
		} catch (err) {
			// An already-closed session is still a fresh start here.
			if ((err as Error).message !== Messages.NO_DATA_FOUND) await sweetMixinErrorAlert((err as Error).message);
		}
		setSessionId('');
		setItems([]);
		setHold(null);
		setFull(false);
	};

	const consentHandler = async () => {
		try {
			const result = await setAiConsent({ variables: { agreed: true } });
			const at = result.data?.setAiConsent?.memberAiConsentAt;
			userVar({ ...userVar(), memberAiConsentAt: at ? String(at) : new Date().toISOString() });
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	/** The held time is booked at the doctor's clinic: from the cards shown, else from the doctor. */
	const clinicOf = async (proposal: AssistantHold): Promise<string> => {
		const cards = items.flatMap((item) => item.clinics ?? []);
		const card = cards.find((item) => item.clinicName === proposal.clinicName);
		if (card) return card.clinicId;
		const { data } = await client.query({
			query: GET_DOCTOR_CLINIC,
			variables: { doctorId: proposal.doctorId },
			fetchPolicy: 'cache-first',
		});
		return data.getDoctor.clinicId;
	};

	const confirmHandler = async () => {
		if (!hold || !sessionId) return;
		const proposal = hold;
		try {
			const { data } = await confirmAssistantHold({ variables: { sessionId } });
			const held: SlotHold = data.confirmAssistantHold;
			const clinicId = await clinicOf(proposal);
			setHold(null);
			onClose();
			await router.push({
				pathname: '/booking',
				query: {
					clinic: clinicId,
					treatment: proposal.treatmentId,
					doctor: proposal.doctorId,
					start: new Date(held.slotStart).toISOString(),
					until: new Date(held.holdExpiresAt).toISOString(),
				},
			});
		} catch (err) {
			const errorText = (err as Error).message;
			if (errorText === Messages.NO_PENDING_HOLD) setHold(null);
			await sweetMixinErrorAlert(errorText);
		}
	};

	const clinicCard = (clinic: AssistantClinicCard) => (
		<Link
			key={clinic.clinicId}
			href={`/clinics/detail?id=${clinic.clinicId}`}
			className={'assistant-clinic'}
			onClick={onClose}
		>
			<strong>{clinic.clinicName}</strong>
			<span className={'meta'}>
				{clinic.district && (
					<span>
						<PlaceOutlinedIcon />
						{t(`district.${clinic.district}`, { defaultValue: clinic.district })}
					</span>
				)}
				{Boolean(clinic.rating) && (
					<span>
						<StarRoundedIcon className={'star'} />
						{clinic.rating?.toFixed(1)}
					</span>
				)}
				{Boolean(clinic.minPriceKrw) && <span>{t('from {{price}}', { price: formatKrw(clinic.minPriceKrw) })}</span>}
			</span>
		</Link>
	);

	const minutes = Math.floor(holdLeft / 60000);
	const seconds = Math.floor((holdLeft % 60000) / 1000);

	let body: React.ReactNode;
	if (!consented) {
		body = (
			<div className={'assistant-gate'}>
				<span className={'mark'}>
					<AutoAwesomeRoundedIcon />
				</span>
				<strong>{t('The assistant uses AI')}</strong>
				<p>
					{t(
						'Your messages go to an AI model to find clinics and free times. It never books without your Confirm and gives no medical advice.',
					)}
				</p>
				<Button variant={'contained'} disabled={consenting} onClick={consentHandler}>
					{t('Agree and start')}
				</Button>
				<Link href={'/mypage/medical'} onClick={onClose}>
					{t('Medical data & consent')}
				</Link>
			</div>
		);
	} else if (loadingSession) {
		body = (
			<div className={'assistant-list'}>
				<Skeleton variant={'rounded'} height={64} />
				<Skeleton variant={'rounded'} height={44} width={'70%'} sx={{ alignSelf: 'flex-end' }} />
			</div>
		);
	} else {
		body = (
			<div className={'assistant-list'} ref={listRef} aria-live={'polite'}>
				<div className={'bubble assistant'}>
					<p>
						{t('Hi {{name}}! Tell me what treatment you need, when and where — I will find clinics and free times.', {
							name: user.memberFullName?.split(' ')[0] ?? '',
						})}
					</p>
				</div>
				{items.length === 0 && (
					<div className={'assistant-suggestions'}>
						{SUGGESTIONS.map((suggestion) => (
							<button key={suggestion} type={'button'} onClick={() => sendHandler(t(suggestion))}>
								{t(suggestion)}
							</button>
						))}
					</div>
				)}
				{items.map((item, index) => (
					<React.Fragment key={index}>
						<div className={`bubble ${item.role}`}>
							{item.role === 'assistant' ? <AssistantText text={item.text} /> : <p>{item.text}</p>}
						</div>
						{Boolean(item.clinics?.length) && (
							<div className={'assistant-clinics'}>{item.clinics?.map(clinicCard)}</div>
						)}
						{Boolean(item.slots?.length) && (
							<div className={'assistant-slots'}>
								{item.slots?.map((slot) => (
									<button
										key={`${slot.doctorId}-${slot.slotStart}`}
										type={'button'}
										disabled={sending || index !== items.length - 1}
										onClick={() => sendHandler(t('I’d like {{label}}', { label: slot.label }))}
									>
										<ScheduleRoundedIcon />
										{slot.label}
									</button>
								))}
							</div>
						)}
					</React.Fragment>
				))}
				{sending && (
					<div className={'bubble assistant typing'} aria-label={t('The assistant is writing…')}>
						<i />
						<i />
						<i />
					</div>
				)}
				{hold && (
					<div className={`assistant-hold ${holdLeft ? '' : 'expired'}`}>
						<span className={'label'}>{t('Proposed time')}</span>
						<strong>{hold.treatmentName ?? '—'}</strong>
						<span>{hold.clinicName}</span>
						<span className={'when'}>
							<ScheduleRoundedIcon />
							{hold.label ?? seoulTime(hold.slotStart, router.locale)}
						</span>
						{Boolean(hold.priceKrw) && (
							<span className={'price'}>{t('from {{price}}', { price: formatKrw(hold.priceKrw) })}</span>
						)}
						{holdLeft ? (
							<>
								<Button variant={'contained'} disabled={confirming} onClick={confirmHandler}>
									{t('Confirm and continue')}
								</Button>
								<span className={'note'}>
									{t('Nothing is held until you confirm · {{time}} left', {
										time: `${minutes}:${String(seconds).padStart(2, '0')}`,
									})}
								</span>
							</>
						) : (
							<span className={'note'}>{t('This proposal expired. Ask the assistant again.')}</span>
						)}
					</div>
				)}
				{full && (
					<div className={'assistant-full'}>
						<span>{t('This conversation is full.')}</span>
						<Button size={'small'} variant={'outlined'} onClick={newChatHandler}>
							{t('New conversation')}
						</Button>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className={'assistant-panel'} role={'dialog'} aria-label={t('MedVia Assistant')}>
			<header className={'assistant-head'}>
				<span className={'mark'}>
					<AutoAwesomeRoundedIcon />
				</span>
				<div className={'title'}>
					<strong>{t('MedVia Assistant')}</strong>
					<span>{t('Finds clinics and free times · AI')}</span>
				</div>
				{consented && (
					<Tooltip title={t('New conversation')}>
						<span>
							<IconButton
								aria-label={t('New conversation')}
								disabled={closing || sending || (!sessionId && items.length === 0)}
								onClick={newChatHandler}
							>
								<AddCommentOutlinedIcon />
							</IconButton>
						</span>
					</Tooltip>
				)}
				<IconButton aria-label={t('Close')} onClick={onClose}>
					<CloseRoundedIcon />
				</IconButton>
			</header>
			{body}
			{/* Always visible, so the patient sees where to write; locked until AI consent. */}
			<form className={'assistant-compose'} onSubmit={submitHandler}>
				<TextField
					value={text}
					multiline
					maxRows={4}
					fullWidth
					size={'small'}
					placeholder={
						consented ? t('Ask about a treatment, a date, a language…') : t('Press “Agree and start” to write')
					}
					disabled={!consented || full}
					inputProps={{ maxLength: MESSAGE_MAX, 'aria-label': t('Message') }}
					onChange={(event) => setText(event.target.value)}
					onKeyDown={keyHandler}
				/>
				<IconButton
					type={'submit'}
					className={'send'}
					aria-label={t('Send')}
					disabled={!consented || !text.trim() || sending || full}
				>
					<SendRoundedIcon />
				</IconButton>
				<p className={'disclaimer'}>{t('AI can make mistakes. It books only after you press Confirm.')}</p>
			</form>
		</div>
	);
};

export default AssistantPanel;
