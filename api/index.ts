// Minimal Vercel Serverless Function (Native TypeScript)
// Let Vercel compile this directly without esbuild bundling

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // Health check endpoint
  if (path === '/api/health' || path === '/api') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        runtime: 'edge',
        path: path,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // 404 for other routes
  return new Response(
    JSON.stringify({
      error: 'Route not found in minimal mode',
      path: path,
      method: request.method,
      note: 'Full API temporarily disabled for debugging',
    }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
