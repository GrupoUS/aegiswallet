// Vercel Serverless Function - Minimal API Entry Point
// Compatible with Vercel's Node.js runtime

export const config = {
  maxDuration: 10,
};

// Using any to avoid needing @vercel/node types
export default function handler(req: any, res: any) {
  const path = req.url || '/';
  const method = req.method || 'GET';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Health check endpoints
  if (path.includes('/health')) {
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: '1.0.0',
    });
  }

  // API info
  if (path === '/api' || path === '/api/') {
    return res.status(200).json({
      name: 'AegisWallet API',
      version: '1.0.0',
      endpoints: ['/api/v1/health'],
      documentation: 'https://github.com/GrupoUS/aegiswallet',
    });
  }

  // 404 for unknown routes
  return res.status(404).json({
    error: 'Not Found',
    message: `Route ${method} ${path} not found`,
    timestamp: new Date().toISOString(),
  });
}
