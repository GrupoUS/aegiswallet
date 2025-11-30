/**
 * Agent Tools API
 * Execute financial tools for the AI agent
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AppEnv } from '@/server/hono-types';
import { authMiddleware } from '@/server/middleware/auth';

const toolExecutionSchema = z.object({
	arguments: z.record(z.string(), z.unknown()).optional().default({}),
});

const toolsRouter = new Hono<AppEnv>();

/**
 * POST /api/v1/agent/tools/:toolName
 * Execute a specific financial tool
 *
 * Params:
 * - toolName: string - Name of the tool to execute
 *
 * Body:
 * - arguments: object - Tool-specific arguments
 */
toolsRouter.post(
	'/:toolName',
	authMiddleware,
	zValidator('json', toolExecutionSchema),
	async (c) => {
		const toolName = c.req.param('toolName');
		const { arguments: args } = c.req.valid('json');

		// TODO: Implement tool execution in Tasks FA-008 to FA-014
		return c.json(
			{
				error: 'Not implemented',
				message: `Tool ${toolName} will be implemented in subsequent tasks`,
				toolName,
				receivedArgs: args,
			},
			501,
		);
	},
);

export { toolsRouter };
export default toolsRouter;
