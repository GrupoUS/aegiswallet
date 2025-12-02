import { Hono } from 'hono';
import { handle } from 'hono/vercel';

// Minimal Hono app for Vercel diagnostics
const app = new Hono();

app.get('/api/health', (c) =>
	c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: 'vercel',
	})
);

app.get('/api/v1/health', (c) =>
	c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: 'vercel',
		version: 'v1',
	})
);

app.all('*', (c) =>
	c.json(
		{
			error: 'Not Found',
			path: c.req.path,
			method: c.req.method,
		},
		404
	)
);

export default handle(app);
