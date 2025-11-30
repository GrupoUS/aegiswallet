/**
 * Agent API Routes
 * Financial agent context and tool execution endpoints
 */

import { Hono } from 'hono';

import { contextRouter } from './context';
import { toolsRouter } from './tools';
import type { AppEnv } from '@/server/hono-types';

const agentRouter = new Hono<AppEnv>();

agentRouter.route('/context', contextRouter);
agentRouter.route('/tools', toolsRouter);

export { agentRouter };
export default agentRouter;
