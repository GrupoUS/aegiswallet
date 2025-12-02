import { Hono } from 'hono';

// Minimal Hono app for Vercel diagnostics
// Vercel expects: export default app (NOT handle(app))
const app = new Hono().basePath('/api');

app.get('/health', (c) =>
	c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: 'vercel',
	}),
);

app.get('/v1/health', (c) =>
	c.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		environment: 'vercel',
		version: 'v1',
	}),
);

app.all('*', (c) =>
	c.json(
		{
			error: 'Not Found',
			path: c.req.path,
			method: c.req.method,
		},
		404,
	),
);

export default app;
