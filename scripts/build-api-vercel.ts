/**
 * Build script for Vercel API functions
 * Bundles the Hono server with path aliases resolved
 *
 * This creates a single bundled file at api/index.js that Vercel
 * recognizes as a serverless function. The Hono app handles all
 * routes under /api/*.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..');

async function buildApi() {
	console.log('🔨 Building API for Vercel...');
	console.log(`   Entry: src/server/api-source/server.ts`);
	console.log(`   Output: api/index.js`);

	try {
		const result = await build({
			entryPoints: [path.join(rootDir, 'src', 'server', 'api-source', 'server.ts')],
			bundle: true,
			outfile: path.join(rootDir, 'api', 'index.js'),
			platform: 'browser', // Edge runtime uses browser-like APIs
			target: 'es2022',
			format: 'esm',
			sourcemap: false,
			minify: true,
			// Keep function names for better debugging in Vercel logs
			keepNames: true,
			// External modules that Edge runtime provides
			external: [],
			// Inject createRequire for CJS modules that need require()
			inject: [],
			// Resolve @ alias to src directory
			alias: {
				'@': path.join(rootDir, 'src'),
			},
			define: {
				'process.env.NODE_ENV': '"production"',
			},
			banner: {
				js: `// Bundled for Vercel Edge Runtime
// Generated at: ${new Date().toISOString()}
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
				console.log(`   Bundle size: ${sizeKB} KB`);
			}
		}

		console.log('✅ API built successfully!');
		console.log('');
		console.log('📋 Vercel Deployment Notes:');
		console.log('   - Function: api/index.js');
		console.log('   - Runtime: Node.js 20.x');
		console.log('   - Routes: /api/* → api/index.js');
	} catch (error) {
		console.error('❌ Build failed:', error);
		process.exit(1);
	}
}

void buildApi();
