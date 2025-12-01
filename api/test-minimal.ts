// Minimal test serverless function
import { handle } from 'hono/vercel';
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/test', (c) => {
	return c.json({
		message: 'Hello from minimal Hono!',
		timestamp: new Date().toISOString(),
	});
});

export const config = {
	runtime: 'nodejs',
	maxDuration: 30,
};

export default handle(app);
