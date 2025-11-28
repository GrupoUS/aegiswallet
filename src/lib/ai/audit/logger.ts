import { db } from '@/db/client';
import { auditLogs } from '@/db/schema';

interface AuditLogEntry {
	userId: string;
	sessionId: string;
	provider: string;
	model: string;
	actionType: 'chat' | 'tool_call';
	toolName?: string;
	inputSummary: string;
	outputSummary: string;
	tokensUsed?: number;
	latencyMs: number;
	outcome: 'success' | 'blocked' | 'error';
	errorMessage?: string;
	affectedTables?: string[];
	affectedRecordIds?: string[];
}

export async function logAIOperation(entry: AuditLogEntry): Promise<void> {
	try {
		await db.insert(auditLogs).values({
			userId: entry.userId,
			action: `ai_${entry.actionType}`,
			resourceType: entry.toolName || 'ai_chat',
			sessionId: entry.sessionId,
			success: entry.outcome === 'success',
			errorMessage: entry.errorMessage,
			newValues: {
				provider: entry.provider,
				model: entry.model,
				action_type: entry.actionType,
				tool_name: entry.toolName,
				input_summary: entry.inputSummary.slice(0, 500), // Truncate to avoid PII
				output_summary: entry.outputSummary.slice(0, 500),
				tokens_used: entry.tokensUsed,
				latency_ms: entry.latencyMs,
				outcome: entry.outcome,
				affected_tables: entry.affectedTables,
				affected_record_ids: entry.affectedRecordIds,
			},
		});
	} catch (_error) {
		// Do not fail the main operation due to logging error
	}
}
