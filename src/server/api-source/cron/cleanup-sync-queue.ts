/**
 * Cron Job: Cleanup Sync Queue
 * Schedule: Weekly on Sunday at 3 AM (0 3 * * 0)
 * Purpose: Remove old completed/failed sync queue items
 *
 * @deprecated This cron job is currently disabled.
 * This functionality needs to be re-implemented
 * using the Neon/Drizzle database client when Google Calendar sync is prioritized.
 */

export const config = {
	maxDuration: 30,
};

interface VercelRequest {
	method: string;
	headers: Record<string, string | undefined>;
}

interface VercelResponse {
	status: (code: number) => VercelResponse;
	json: (data: Record<string, unknown>) => void;
}

export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
) {
	// Only allow GET requests (Vercel cron uses GET)
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	// Verify cron secret in production
	const cronSecret = req.headers['x-vercel-cron-secret'];
	if (
		process.env.VERCEL &&
		process.env.CRON_SECRET &&
		cronSecret !== process.env.CRON_SECRET
	) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	// Feature currently disabled - awaiting implementation
	return res.status(200).json({
		success: true,
		message: 'Sync queue cleanup is currently disabled',
		reason: 'Awaiting implementation with Neon/Drizzle',
		deleted: {
			completed: 0,
			failed: 0,
			audit_logs: 0,
			total: 0,
		},
	});
}
