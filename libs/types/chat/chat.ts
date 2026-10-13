import { MessageType, SenderType, TranslationStatus } from '../../enums/chat.enum';
import { Language } from '../../enums/common.enum';

export interface MessageTranslation {
	lang: Language;
	text: string;
}

export interface ChatMessage {
	_id: string;
	messageType: MessageType;
	senderType: SenderType;
	/** The original, in the sender's language. */
	messageText: string;
	messageLang: Language;
	messageTranslations: MessageTranslation[];
	messageTranslationStatus: TranslationStatus;
	/** What this viewer reads (GraphQL only; socket payloads leave it out — see textFor). */
	displayText?: string;
	roomId: string;
	senderId?: string | null;
	createdAt: Date;
}

export interface ChatMessages {
	list: ChatMessage[];
	/** Pass back as `before` for the next (older) page; null at the start of the room. */
	nextCursor?: string | null;
}

export interface ChatRoom {
	_id: string;
	roomLastAt: Date;
	unread: number;
	lastText?: string | null;
	memberId: string;
	clinicId: string;
	clinicName?: string;
	clinicLogo?: string;
	patientName?: string;
	patientLang?: Language;
}
