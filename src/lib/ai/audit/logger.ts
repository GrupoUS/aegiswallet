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
	const { createClient } = await import('@supabase/supabase-js');
	const supabaseUrl =
		process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
	const supabaseKey =
		process.env.SUPABASE_SERVICE_ROLE_KEY ||
		process.env.VITE_SUPABASE_ANON_KEY ||
		'';
	const supabase = createClient(supabaseUrl, supabaseKey);

	try {
		await supabase.from('ai_audit_logs').insert({
			user_id: entry.userId,
			session_id: entry.sessionId,
			provider: entry.provider,
			model: entry.model,
			action_type: entry.actionType,
			tool_name: entry.toolName,
			input_summary: entry.inputSummary.slice(0, 500), // Truncate to avoid PII
			output_summary: entry.outputSummary.slice(0, 500),
			tokens_used: entry.tokensUsed,
			latency_ms: entry.latencyMs,
			outcome: entry.outcome,
			error_message: entry.errorMessage,
			affected_tables: entry.affectedTables,
			affected_record_ids: entry.affectedRecordIds,
			created_at: new Date().toISOString(),
		});
	} catch (_error) {
		// Do not fail the main operation due to logging error
	}
}
