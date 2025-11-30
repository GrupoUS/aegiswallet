import { and, desc, eq } from 'drizzle-orm';

import type { GetFinancialInsightsInput } from '../schemas';
import { db } from '@/db/client';
import { aiInsights } from '@/db/schema';

export interface FinancialInsightsResult {
	insights: Array<{
		id: string;
		type: string;
		title: string;
		description: string;
		recommendation: string | null;
		impactLevel: string;
		createdAt: Date;
	}>;
	count: number;
	summary: string;
}

export async function getFinancialInsights(
	userId: string,
	input: GetFinancialInsightsInput,
): Promise<FinancialInsightsResult> {
	const { type, onlyUnread = true, limit = 5 } = input;

	const conditions = [eq(aiInsights.userId, userId)];

	if (type) {
		conditions.push(eq(aiInsights.insightType, type));
	}
	if (onlyUnread) {
		conditions.push(eq(aiInsights.isRead, false));
	}

	const insightsData = await db
		.select({
			id: aiInsights.id,
			type: aiInsights.insightType,
			title: aiInsights.title,
			description: aiInsights.description,
			recommendation: aiInsights.recommendation,
			impactLevel: aiInsights.impactLevel,
			createdAt: aiInsights.createdAt,
		})
		.from(aiInsights)
		.where(and(...conditions))
		.orderBy(desc(aiInsights.createdAt))
		.limit(limit);

	const insights = insightsData.map((i) => ({
		id: i.id,
		type: i.type,
		title: i.title,
		description: i.description,
		recommendation: i.recommendation,
		impactLevel: i.impactLevel || 'medium',
		createdAt: i.createdAt ?? new Date(),
	}));

	const highImpact = insights.filter((i) => i.impactLevel === 'high').length;

	const summary =
		insights.length === 0
			? 'Nenhum insight disponível no momento.'
			: highImpact > 0
				? `${insights.length} insight(s) disponível(is), ${highImpact} de alta importância.`
				: `${insights.length} insight(s) disponível(is) para você.`;

	return {
		insights,
		count: insights.length,
		summary,
	};
}
