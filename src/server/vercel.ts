import { handle } from 'hono/vercel';

console.log('[Vercel] Loading AegisWallet API...');

import app from './index';

console.log('[Vercel] App loaded successfully');

export const config = {
	runtime: 'nodejs',
	maxDuration: 30,
};

export default handle(app);
