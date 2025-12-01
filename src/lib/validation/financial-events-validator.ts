import { z } from 'zod';

import type {
	BrazilianEventType,
	FinancialEventCategory,
	FinancialEventMetadata,
	InstallmentInfo,
} from '@/types/financial.interfaces';
import type { FinancialEvent, FinancialEventType } from '@/types/financial-events';

export type { FinancialEventCategory };

const EVENT_TYPES = ['income', 'expense', 'bill', 'scheduled', 'transfer'] as const;
const EVENT_STATUSES = ['pending', 'paid', 'scheduled', 'cancelled', 'completed'] as const;
const PRIORITIES = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'] as const;

const BRAZILIAN_EVENT_TYPES: readonly BrazilianEventType[] = [
	'SALARIO',
	'DECIMO_TERCEIRO',
	'FERIAS',
	'ALUGUEL',
	'CONDOMINIO',
	'LUZ',
	'AGUA',
	'INTERNET',
	'CELULAR',
	'SUPERMERCADO',
	'RESTAURANTE',
	'TRANSPORTE_PUBLICO',
	'UBER_99',
	'COMBUSTIVEL',
	'PIX_TRANSFER',
	'TED_DOC',
	'BOLETO_PAGAMENTO',
	'CARTAO_CREDITO',
	'INVESTIMENTO_CDB',
	'INVESTIMENTO_TESOURO',
	'PREVIDENCIA',
	'PLANO_SAUDE',
] as const;

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

export interface SanitizedFinancialEvent extends Record<string, unknown> {
	userId?: string;
	title?: string;
	description?: string;
	amount?: number;
	start?: Date;
	end?: Date;
	type?: FinancialEventType;
	status?: string;
	priority?: string;
	category?: FinancialEventCategory | string;
	color?: string;
	location?: string;
	notes?: string;
	icon?: string;
	tags?: string[];
	attachments?: string[];
	metadata?: FinancialEventMetadata;
	installmentInfo?: InstallmentInfo;
	brazilianEventType?: BrazilianEventType;
	isRecurring?: boolean;
	allDay?: boolean;
	recurrenceRule?: string;
	parentEventId?: string;
	dueDate?: Date | null;
	completedAt?: Date | null;
	isIncome?: boolean;
}

const ensureDate = (value?: Date | string | null): Date | undefined => {
	if (!value) {
		return undefined;
	}
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? undefined : value;
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const sanitizeInstallmentInfo = (info?: InstallmentInfo | null): InstallmentInfo | undefined => {
	if (!info) {
		return undefined;
	}

	const sanitized: InstallmentInfo = {
		currentInstallment: Number(info.currentInstallment ?? 0),
		installmentAmount: Number(info.installmentAmount ?? 0),
		remainingAmount: Number(info.remainingAmount ?? 0),
		totalInstallments: Number(info.totalInstallments ?? 0),
	};

	if (info.nextInstallmentDate) {
		const date = ensureDate(info.nextInstallmentDate);
		if (date) {
			sanitized.nextInstallmentDate = date.toISOString();
		}
	}

	return sanitized;
};

const sanitizeMetadata = (
	metadata?: FinancialEventMetadata | null,
): FinancialEventMetadata | undefined => {
	if (!metadata) {
		return undefined;
	}
	const sanitized: FinancialEventMetadata = { ...metadata };

	if (
		sanitized.confidence !== undefined &&
		(typeof sanitized.confidence !== 'number' ||
			Number.isNaN(sanitized.confidence) ||
			sanitized.confidence < 0 ||
			sanitized.confidence > 1)
	) {
		sanitized.confidence = undefined;
	}

	if (sanitized.auditTrail && !Array.isArray(sanitized.auditTrail)) {
		sanitized.auditTrail = undefined;
	}

	return sanitized;
};

const baseEventSchema = z.object({
	amount: z.number().finite('Valor inválido.').optional(),
	brazilianEventType: z.string().optional(),
	category: z.string().optional(),
	color: z.string().optional(),
	completedAt: z.date().optional(),
	dueDate: z.date().optional(),
	end: z.date().optional(),
	icon: z.string().optional(),
	installmentInfo: z.any().optional(),
	location: z.string().optional(),
	metadata: z.any().optional(),
	notes: z.string().optional(),
	priority: z.enum(PRIORITIES).optional(),
	recurrenceRule: z.string().optional(),
	start: z.date().optional(),
	status: z.enum(EVENT_STATUSES).optional(),
	tags: z.array(z.string()).optional(),
	title: z.string().min(1, 'Título é obrigatório.').optional(),
	type: z.enum(EVENT_TYPES).optional(),
	userId: z.string().optional(),
});

const normalizeBrazilianEventType = (value?: string | null) => {
	if (!value) {
		return undefined;
	}
	const normalized = value.trim().toUpperCase() as BrazilianEventType;
	return BRAZILIAN_EVENT_TYPES.includes(normalized) ? normalized : undefined;
};

const normalizePriority = (value?: string) => {
	if (!value) {
		return undefined;
	}
	const normalized = value.trim().toUpperCase();
	return PRIORITIES.includes(normalized as (typeof PRIORITIES)[number]) ? normalized : undefined;
};

const normalizeStatus = (value?: string) => {
	if (!value) {
		return undefined;
	}
	const normalized = value.trim().toLowerCase();
	return EVENT_STATUSES.includes(normalized as (typeof EVENT_STATUSES)[number])
		? (normalized as (typeof EVENT_STATUSES)[number])
		: undefined;
};

const normalizeType = (value?: string) => {
	if (!value) {
		return undefined;
	}
	const normalized = value.trim().toLowerCase();
	return EVENT_TYPES.includes(normalized as (typeof EVENT_TYPES)[number])
		? (normalized as (typeof EVENT_TYPES)[number])
		: undefined;
};

const sanitizeTags = (tags?: string[] | null) => {
	if (!(tags && Array.isArray(tags))) {
		return undefined;
	}
	const sanitized = tags.map((tag) => tag?.trim()).filter((tag): tag is string => Boolean(tag));

	return sanitized.length ? Array.from(new Set(sanitized)) : [];
};

export const sanitizeFinancialEventData = (
	event: Partial<FinancialEvent> & { userId?: string },
): SanitizedFinancialEvent => {
	const sanitized: SanitizedFinancialEvent = {};

	if (event.userId) {
		sanitized.userId = event.userId.trim();
	}

	if (event.title !== undefined) {
		sanitized.title = event.title?.trim() || '';
	}

	if (event.description !== undefined) {
		sanitized.description = event.description?.trim() || '';
	}

	if (event.amount !== undefined) {
		const amount = Number(event.amount);
		if (!Number.isNaN(amount)) {
			sanitized.amount = amount;
		}
	}

	if (event.start) {
		const date = ensureDate(event.start);
		if (date) {
			sanitized.start = date;
		}
	}

	if (event.end) {
		const date = ensureDate(event.end);
		if (date) {
			sanitized.end = date;
		}
	}

	if (event.dueDate !== undefined) {
		sanitized.dueDate = ensureDate(event.dueDate) ?? null;
	}

	if (event.completedAt !== undefined) {
		sanitized.completedAt = ensureDate(event.completedAt) ?? null;
	}

	if (event.color !== undefined) {
		sanitized.color = event.color.trim();
	}

	if (event.category !== undefined) {
		sanitized.category =
			typeof event.category === 'string' ? event.category.trim() : event.category;
	}

	if (event.location !== undefined) {
		sanitized.location = event.location?.trim() || undefined;
	}

	if (event.notes !== undefined) {
		sanitized.notes = event.notes?.trim() || undefined;
	}

	if (event.icon !== undefined) {
		sanitized.icon = event.icon?.trim() || undefined;
	}

	const normalizedType = normalizeType(event.type as string);
	if (normalizedType) {
		sanitized.type = normalizedType;
		sanitized.isIncome = normalizedType === 'income';
	}

	const normalizedStatus = normalizeStatus(event.status as string);
	if (normalizedStatus) {
		sanitized.status = normalizedStatus;
	}

	const normalizedPriority = normalizePriority(event.priority as string);
	if (normalizedPriority) {
		sanitized.priority = normalizedPriority as (typeof PRIORITIES)[number];
	}

	if (event.isRecurring !== undefined) {
		sanitized.isRecurring = Boolean(event.isRecurring);
	}

	if (event.allDay !== undefined) {
		sanitized.allDay = Boolean(event.allDay);
	}

	if (event.recurrenceRule !== undefined) {
		sanitized.recurrenceRule = event.recurrenceRule?.trim() || undefined;
	}

	const tags = sanitizeTags(event.tags ?? null);
	if (tags !== undefined) {
		sanitized.tags = tags;
	}

	if (event.attachments !== undefined) {
		sanitized.attachments = Array.isArray(event.attachments) ? event.attachments : [];
	}

	const metadata = sanitizeMetadata(event.metadata);
	if (metadata) {
		sanitized.metadata = metadata;
	}

	const installmentInfo = sanitizeInstallmentInfo(event.installmentInfo);
	if (installmentInfo) {
		sanitized.installmentInfo = installmentInfo;
	}

	const brazilianEventType = normalizeBrazilianEventType(
		(event.brazilianEventType as string) ??
			(event as unknown as { brazilian_event_type?: string }).brazilian_event_type,
	);
	if (brazilianEventType) {
		sanitized.brazilianEventType = brazilianEventType;
	}

	if (event.metadata?.merchantCategory) {
		sanitized.metadata = {
			...sanitized.metadata,
			merchantCategory: event.metadata.merchantCategory.trim(),
		};
	}

	return sanitized;
};

const collectValidationErrors = (issues: z.ZodIssue[]): ValidationError[] =>
	issues.map((issue) => ({
		field: issue.path.join('.') || 'root',
		message: issue.message,
	}));

const validateInstallmentInfo = (info?: InstallmentInfo): ValidationError[] => {
	if (!info) {
		return [];
	}

	const errors: ValidationError[] = [];

	if (info.totalInstallments <= 0) {
		errors.push({
			field: 'installmentInfo.totalInstallments',
			message: 'Total de parcelas deve ser maior que zero.',
		});
	}

	if (info.currentInstallment <= 0) {
		errors.push({
			field: 'installmentInfo.currentInstallment',
			message: 'Parcela atual deve ser maior que zero.',
		});
	}

	if (info.currentInstallment > info.totalInstallments) {
		errors.push({
			field: 'installmentInfo.currentInstallment',
			message: 'Parcela atual não pode ser maior que o total.',
		});
	}

	return errors;
};

export const validateBrazilianEventType = (type?: string | null) => {
	if (!type) {
		return false;
	}
	return BRAZILIAN_EVENT_TYPES.includes(type as BrazilianEventType);
};

const validateBaseEvent = (
	event: SanitizedFinancialEvent,
	{ requireUserId }: { requireUserId?: boolean } = {},
): ValidationError[] => {
	const errors: ValidationError[] = [];
	const { success, error } = baseEventSchema.safeParse(event);

	if (!success && error) {
		errors.push(...collectValidationErrors(error.issues));
	}

	if (requireUserId && !event.userId) {
		errors.push({
			field: 'userId',
			message: 'Usuário é obrigatório.',
		});
	}

	return errors;
};

export const validateFinancialEventForInsert = (
	event: SanitizedFinancialEvent,
): ValidationResult => {
	const errors: ValidationError[] = [];

	errors.push(...validateBaseEvent(event, { requireUserId: true }));

	if (!event.title) {
		errors.push({ field: 'title', message: 'Título é obrigatório.' });
	}

	if (event.amount === undefined) {
		errors.push({ field: 'amount', message: 'Valor é obrigatório.' });
	}

	if (!event.start) {
		errors.push({ field: 'start', message: 'Data inicial é obrigatória.' });
	}

	if (!event.end) {
		errors.push({ field: 'end', message: 'Data final é obrigatória.' });
	}

	if (event.start && event.end && event.start > event.end) {
		errors.push({
			field: 'end',
			message: 'Data final não pode ser anterior à data inicial.',
		});
	}

	if (!event.type) {
		errors.push({ field: 'type', message: 'Tipo do evento é obrigatório.' });
	}

	if (event.dueDate && event.start && event.dueDate < event.start) {
		errors.push({
			field: 'dueDate',
			message: 'Data de vencimento não pode ser anterior ao início.',
		});
	}

	if (event.brazilianEventType && !validateBrazilianEventType(event.brazilianEventType)) {
		errors.push({
			field: 'brazilianEventType',
			message: 'Tipo brasileiro inválido.',
		});
	}

	errors.push(...validateInstallmentInfo(event.installmentInfo));

	return {
		errors,
		valid: errors.length === 0,
	};
};

export const validateFinancialEventForUpdate = (
	updates: SanitizedFinancialEvent,
): ValidationResult => {
	const errors: ValidationError[] = [];

	if (!Object.keys(updates).length) {
		return {
			errors: [{ field: 'root', message: 'Nenhum campo para atualizar.' }],
			valid: false,
		};
	}

	errors.push(...validateBaseEvent(updates));

	if (updates.start && updates.end && updates.start > updates.end) {
		errors.push({
			field: 'end',
			message: 'Data final não pode ser anterior à data inicial.',
		});
	}

	if (updates.dueDate && updates.start && updates.dueDate < updates.start) {
		errors.push({
			field: 'dueDate',
			message: 'Data de vencimento não pode ser anterior ao início.',
		});
	}

	if (updates.amount !== undefined && Number.isNaN(updates.amount)) {
		errors.push({
			field: 'amount',
			message: 'Valor inválido.',
		});
	}

	if (updates.brazilianEventType && !validateBrazilianEventType(updates.brazilianEventType)) {
		errors.push({
			field: 'brazilianEventType',
			message: 'Tipo brasileiro inválido.',
		});
	}

	errors.push(...validateInstallmentInfo(updates.installmentInfo));

	return {
		errors,
		valid: errors.length === 0,
	};
};
