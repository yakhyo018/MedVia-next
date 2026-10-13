import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useApolloClient, useMutation } from '@apollo/client';
import { Box, Button, CircularProgress, IconButton, MenuItem, Select, TextField } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { GET_MY_ROOMS, GET_ROOM_MESSAGES } from '../../../apollo/user/query';
import { MARK_ROOM_READ, SEND_MESSAGE } from '../../../apollo/user/mutation';
import { ChatMessage, ChatMessages, ChatRoom } from '../../types/chat/chat';
import { MessageType, SenderType, TranslationStatus } from '../../enums/chat.enum';
import { Language } from '../../enums/common.enum';
import { LANGUAGES } from '../../config';
import { liveEvents } from '../../hooks/useLiveSocket';
import { initials, seoulClock, seoulTime } from '../../utils';
import { sweetMixinErrorAlert } from '../../sweetAlert';

const PAGE_SIZE = 30;
const MESSAGE_MAX = 2000;

/** The backend's textFor: the original in the reader's language, else its translation, else the original. */
const textFor = (message: ChatMessage, lang: Language): string => {
	if (message.messageLang === lang) return message.messageText;
	return message.messageTranslations?.find((item) => item.lang === lang)?.text ?? message.messageText;
};

const langLabel = (code: Language) => LANGUAGES.find((lang) => lang.code === code)?.label ?? code;

interface ChatConversationProps {
	room: ChatRoom;
	/** The patient's chat language (their profile language, not the site's). */
	myLang: Language;
	onBack?: () => void;
}

/**
 * One room: history by cursor (newest first from the API, shown oldest at the top), new and
 * translated messages from the socket, and the composer. The patient writes in their language;
 * the clinic reads Korean, the patient reads their own — the API translates both ways.
 */
const ChatConversation = (props: ChatConversationProps) => {
	const { room, myLang, onBack } = props;
	const router = useRouter();
	const { t } = useTranslation('common');
	const client = useApolloClient();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [cursor, setCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [loadingOlder, setLoadingOlder] = useState<boolean>(false);
	const [text, setText] = useState<string>('');
	// The language of the message box: the profile language by default, any of the five on demand.
	const [inputLang, setInputLang] = useState<Language>(myLang);
	const [sending, setSending] = useState<boolean>(false);
	const [originals, setOriginals] = useState<Set<string>>(new Set());
	const bottomRef = useRef<HTMLDivElement>(null);

	const [sendMessage] = useMutation(SEND_MESSAGE);
	const [markRoomRead] = useMutation(MARK_ROOM_READ, { refetchQueries: [GET_MY_ROOMS] });

	/** Newer first from the API → oldest first on screen; one copy per _id (the socket echoes ours). */
	const merge = (current: ChatMessage[], incoming: ChatMessage[]) => {
		const byId = new Map(current.map((message) => [message._id, message]));
		incoming.forEach((message) => byId.set(message._id, { ...byId.get(message._id), ...message }));
		return Array.from(byId.values()).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
	};

	/** LIFECYCLES **/
	useEffect(() => {
		let cancelled = false;
		setMessages([]);
		setCursor(null);
		setLoading(true);
		client
			.query({
				query: GET_ROOM_MESSAGES,
				variables: { input: { roomId: room._id, limit: PAGE_SIZE } },
				fetchPolicy: 'network-only',
			})
			.then((result) => {
				if (cancelled) return;
				const page: ChatMessages = result.data.getRoomMessages;
				setMessages(merge([], page.list));
				setCursor(page.nextCursor ?? null);
				if (room.unread) markRoomRead({ variables: { roomId: room._id } }).catch(() => undefined);
			})
			.catch((err: Error) => {
				if (!cancelled) sweetMixinErrorAlert(err.message);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// A new room, a new history; unread is read once when the room opens.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [client, room._id]);

	useEffect(() => {
		const onMessage = (event: Event) => {
			const message = (event as CustomEvent<ChatMessage>).detail;
			if (String(message?.roomId) !== room._id) return;
			setMessages((current) => merge(current, [message]));
			// Reading it here means it is read: keep the room's unread at zero.
			if (message.senderType !== SenderType.PATIENT) {
				markRoomRead({ variables: { roomId: room._id } }).catch(() => undefined);
			}
		};
		liveEvents?.addEventListener('message:new', onMessage);
		liveEvents?.addEventListener('message:translated', onMessage);
		return () => {
			liveEvents?.removeEventListener('message:new', onMessage);
			liveEvents?.removeEventListener('message:translated', onMessage);
		};
	}, [room._id, markRoomRead]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: 'end' });
	}, [messages.length]);

	/** HANDLERS **/
	const olderHandler = async () => {
		if (!cursor) return;
		try {
			setLoadingOlder(true);
			const result = await client.query({
				query: GET_ROOM_MESSAGES,
				variables: { input: { roomId: room._id, limit: PAGE_SIZE, before: cursor } },
				fetchPolicy: 'network-only',
			});
			const page: ChatMessages = result.data.getRoomMessages;
			setMessages((current) => merge(current, page.list));
			setCursor(page.nextCursor ?? null);
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setLoadingOlder(false);
		}
	};

	const sendHandler = async (event: FormEvent) => {
		event.preventDefault();
		const body = text.trim();
		if (!body || sending) return;
		try {
			setSending(true);
			const result = await sendMessage({
				variables: { input: { roomId: room._id, messageText: body, messageLang: inputLang } },
			});
			setMessages((current) => merge(current, [result.data.sendMessage]));
			setText('');
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		} finally {
			setSending(false);
		}
	};

	const toggleOriginal = (id: string) =>
		setOriginals((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const otherLang = Language.KO;

	return (
		<Box className={'chat-conversation'}>
			<header className={'chat-head'}>
				{onBack && (
					<IconButton aria-label={t('Back to chats')} onClick={onBack}>
						<ArrowBackRoundedIcon />
					</IconButton>
				)}
				<span className={'avatar'}>{initials(room.clinicName)}</span>
				<span className={'who'}>
					<strong>{room.clinicName}</strong>
					<Link href={`/clinics/detail?id=${room.clinicId}`}>{t('Clinic page')}</Link>
				</span>
				{/* Follows the message box: the language the patient is writing in now, and Korean */}
				<span className={'pair'} title={`${langLabel(inputLang)} ↔ ${langLabel(otherLang)}`}>
					{inputLang} ↔ {otherLang}
				</span>
			</header>

			<div className={'chat-messages'} aria-live={'polite'}>
				{cursor && (
					<Button size={'small'} className={'older'} disabled={loadingOlder} onClick={olderHandler}>
						{t('Load earlier messages')}
					</Button>
				)}
				{loading ? (
					<div className={'chat-state'}>
						<CircularProgress size={24} />
					</div>
				) : messages.length === 0 ? (
					<div className={'chat-state'}>{t('Write your first message — the clinic reads it in Korean.')}</div>
				) : (
					messages.map((message) => {
						const when = `${seoulTime(message.createdAt, router.locale, false)} · ${seoulClock(message.createdAt)}`;
						if (message.messageType === MessageType.SYSTEM || message.senderType === SenderType.SYSTEM) {
							return (
								<div key={message._id} className={'system'}>
									{message.displayText ?? textFor(message, myLang)}
								</div>
							);
						}
						const mine = message.senderType === SenderType.PATIENT;
						const pending = message.messageTranslationStatus === TranslationStatus.PENDING;
						const korean = message.messageTranslations?.find((item) => item.lang === otherLang)?.text;
						const shown = textFor(message, myLang);
						const translated = !mine && message.messageLang !== myLang && shown !== message.messageText;
						const showOriginal = originals.has(message._id);
						return (
							<div key={message._id} className={`bubble ${mine ? 'mine' : 'theirs'}`}>
								<p>{showOriginal ? message.messageText : shown}</p>
								<span className={'meta'}>
									{mine && korean && (
										<>
											{t('Sent in Korean')}: {korean} ·{' '}
										</>
									)}
									{pending && <em className={'translating'}>{t('Translating…')} · </em>}
									{translated && (
										<>
											{t('Translated from {{lang}}', { lang: langLabel(message.messageLang) })} ·{' '}
											<button type={'button'} onClick={() => toggleOriginal(message._id)}>
												{showOriginal ? t('Show translation') : t('Show original')}
											</button>{' '}
											·{' '}
										</>
									)}
									<time>{when}</time>
								</span>
							</div>
						);
					})
				)}
				<div ref={bottomRef} />
			</div>

			<form className={'chat-compose'} onSubmit={sendHandler}>
				<Select
					size={'small'}
					className={'input-lang'}
					value={inputLang}
					onChange={(event) => setInputLang(event.target.value as Language)}
					inputProps={{ 'aria-label': t('I write in') }}
					renderValue={(value) => value}
				>
					{LANGUAGES.map((lang) => (
						<MenuItem key={lang.code} value={lang.code}>
							{lang.label}
						</MenuItem>
					))}
				</Select>
				<TextField
					fullWidth
					multiline
					maxRows={4}
					value={text}
					placeholder={t('Write in {{lang}}…', { lang: langLabel(inputLang) })}
					inputProps={{ maxLength: MESSAGE_MAX, 'aria-label': t('Message') }}
					onChange={(event) => setText(event.target.value)}
					onKeyDown={(event) => {
						// Enter sends, Shift+Enter makes a new line.
						if (event.key === 'Enter' && !event.shiftKey) sendHandler(event);
					}}
				/>
				<IconButton type={'submit'} className={'send'} aria-label={t('Send')} disabled={!text.trim() || sending}>
					{sending ? <CircularProgress size={20} color={'inherit'} /> : <SendRoundedIcon />}
				</IconButton>
			</form>
		</Box>
	);
};

export default ChatConversation;
