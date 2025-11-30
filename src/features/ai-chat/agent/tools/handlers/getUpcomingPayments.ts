import { and, eq, gte, lte } from 'drizzle-orm';

import type { GetUpcomingPaymentsInput } from '../schemas';
import { db } from '@/db/client';
import { transactionSchedules } from '@/db/schema';

export interface UpcomingPaymentsResult {
	payments: Array<{
		id: string;
		description: string;
		amount: number;
		dueDate: string;
		isRecurring: boolean;
		daysUntilDue: number;
	}>;
	totalAmount: number;
	count: number;
	summary: string;
}

export async function getUpcomingPayments(
	userId: string,
	input: GetUpcomingPaymentsInput,
): Promise<UpcomingPaymentsResult> {
	const { daysAhead = 30 } = input;

	const today = new Date();
	const futureDate = new Date();
	futureDate.setDate(today.getDate() + daysAhead);

	const todayStr = today.toISOString().split('T')[0];
	const futureDateStr = futureDate.toISOString().split('T')[0];

	const schedules = await db
		.select({
			id: transactionSchedules.id,
			description: transactionSchedules.description,
			amount: transactionSchedules.amount,
			scheduledDate: transactionSchedules.scheduledDate,
			recurrenceRule: transactionSchedules.recurrenceRule,
		})
		.from(transactionSchedules)
		.where(
			and(
				eq(transactionSchedules.userId, userId),
				eq(transactionSchedules.isActive, true),
				eq(transactionSchedules.executed, false),
				gte(transactionSchedules.scheduledDate, todayStr),
				lte(transactionSchedules.scheduledDate, futureDateStr),
			),
		)
		.orderBy(transactionSchedules.scheduledDate);

	const payments = schedules.map((s) => {
		const dueDate = new Date(s.scheduledDate);
		const diffTime = dueDate.getTime() - today.getTime();
		const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return {
			id: s.id,
			description: s.description,
			amount: Math.abs(Number(s.amount)),
			dueDate: dueDate.toLocaleDateString('pt-BR'),
			isRecurring: !!s.recurrenceRule,
			daysUntilDue,
		};
	});

	const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

	const urgentPayments = payments.filter((p) => p.daysUntilDue <= 3);
	const summary =
		payments.length === 0
			? `Nenhum pagamento agendado para os próximos ${daysAhead} dias.`
			: urgentPayments.length > 0
				? `${payments.length} pagamento(s) agendado(s), total de R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ⚠️ ${urgentPayments.length} vence(m) em até 3 dias!`
				: `${payments.length} pagamento(s) agendado(s), total de R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;

	return {
		payments,
		totalAmount,
		count: payments.length,
		summary,
	};
}
