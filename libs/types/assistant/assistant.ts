import { AssistantSessionStatus } from '../../enums/assistant.enum';
import { Language } from '../../enums/common.enum';

/** A clinic the assistant found; it links to the clinic page. */
export interface AssistantClinicCard {
	clinicId: string;
	clinicName: string;
	district?: string | null;
	rating?: number | null;
	minPriceKrw?: number | null;
}

/** A free time the assistant offers ("Tue 14 Oct · 14:00 · Dr. Han"). */
export interface AssistantSlotOption {
	treatmentId: string;
	doctorId: string;
	slotStart: Date;
	label: string;
}

/** The time the assistant proposes to hold — held only when the patient presses Confirm. */
export interface AssistantHold {
	treatmentId: string;
	doctorId: string;
	slotStart: Date;
	label?: string | null;
	clinicName?: string | null;
	treatmentName?: string | null;
	priceKrw?: number | null;
	/** The proposal expires (15 minutes). */
	expiresAt: Date;
}

export interface AssistantReply {
	sessionId: string;
	text: string;
	clinics: AssistantClinicCard[];
	slots: AssistantSlotOption[];
	pendingHold?: AssistantHold | null;
	toolsUsed: string[];
}

/** 'user' or 'assistant'; tool calls are not shown. */
export interface AssistantTurn {
	role: string;
	text: string;
}

export interface AssistantSession {
	_id: string;
	sessionStatus: AssistantSessionStatus;
	sessionLang: Language;
	turns: AssistantTurn[];
	pendingHold?: AssistantHold | null;
	turnCount: number;
}
