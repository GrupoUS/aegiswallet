/**
 * Build script for Vercel API functions
 * Bundles the Hono server with path aliases resolved
 *
 * This creates a single bundled file at api/index.js that Vercel
 * recognizes as a serverless function. The Hono app handles all
 * routes under /api/*.
 *
 * Entry Point: src/server/vercel.ts (Node.js runtime wrapper)
 * Output: api/index.js (bundled with all dependencies)
 *
 * Why Node.js runtime (not Edge)?
 * - Clerk SDK requires Node.js APIs
 * - Drizzle ORM with connection pooling needs Node.js
 * - Secure logger and other utilities use Node.js features
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..');

async function buildApi() {
	console.log('🔨 Building API for Vercel...');
	console.log(`   Entry: src/server/vercel.ts`);
	console.log(`   Output: api/index.js`);
	console.log(`   Runtime: Node.js 20.x`);

	try {
		const result = await build({
			// Use the Vercel wrapper as entry point (includes full Hono app with all routes)
			entryPoints: [path.join(rootDir, 'src', 'server', 'vercel.ts')],
			bundle: true,
			outfile: path.join(rootDir, 'api', 'index.js'),
			// Node.js runtime (required for Clerk, Drizzle with pooling)
			platform: 'node',
			target: 'node20',
			format: 'esm',
			sourcemap: false,
			minify: true,
			// Keep function names for better debugging in Vercel logs
			keepNames: true,
			// External modules - only Node.js built-ins
			// Note: All npm packages must be bundled for Vercel serverless
			external: [
				// Node.js built-ins only
				'node:*',
			],
			// Resolve @ alias to src directory
			alias: {
				'@': path.join(rootDir, 'src'),
			},
			define: {
				'process.env.NODE_ENV': '"production"',
			},
			banner: {
				js: `// AegisWallet API - Bundled for Vercel Node.js Runtime
// Generated at: ${new Date().toISOString()}
// Entry: src/server/vercel.ts
`,
			},
			metafile: true,
		});

		// Log bundle analysis
		const outputs = Object.keys(result.metafile?.outputs || {});
		for (const output of outputs) {
			const info = result.metafile?.outputs[output];
			if (info) {
				const sizeKB = (info.bytes / 1024).toFixed(2);
				const sizeMB = (info.bytes / 1024 / 1024).toFixed(2);
				console.log(`   Bundle size: ${sizeKB} KB (${sizeMB} MB)`);

				// Warn if bundle is too large
				if (info.bytes > 5 * 1024 * 1024) {
					console.warn('⚠️  Warning: Bundle exceeds 5MB. Consider code splitting.');
				}
			}
		}

		console.log('✅ API built successfully!');
		console.log('');
		console.log('📋 Vercel Deployment Notes:');
		console.log('   - Function: api/index.js');
		console.log('   - Runtime: Node.js 20.x');
		console.log('   - Routes: /api/* → api/index.js');
		console.log('   - Max Duration: 30s');
		console.log('');
		console.log('🔗 API Endpoints:');
		console.log('   - GET  /api/health');
		console.log('   - GET  /api/v1/health');
		console.log('   - GET  /api/v1/users/me');
		console.log('   - GET  /api/v1/banking/*');
		console.log('   - GET  /api/v1/transactions/*');
		console.log('   - GET  /api/v1/contacts/*');
		console.log('   - POST /api/v1/compliance/*');
		console.log('   - POST /api/v1/voice/*');
		console.log('   - POST /api/v1/ai/*');
	} catch (error) {
		console.error('❌ Build failed:', error);
		process.exit(1);
	}
}

void buildApi();
