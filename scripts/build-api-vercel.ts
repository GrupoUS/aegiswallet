/**
 * Build script for Vercel API functions
 * Bundles the Hono server with path aliases resolved
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..');

async function buildApi() {
	console.log('🔨 Building API for Vercel...');

	try {
		await build({
			entryPoints: [path.join(rootDir, 'api', 'index.ts')],
			bundle: true,
			outfile: path.join(rootDir, 'api', 'dist', 'index.js'),
			platform: 'node',
			target: 'node20',
			format: 'esm',
			sourcemap: false,
			minify: true,
			external: [
				// Don't bundle node built-ins
				'node:*',
				// Don't bundle heavy dependencies that Vercel includes
				'@neondatabase/serverless',
				'drizzle-orm',
				'@clerk/backend',
			],
			alias: {
				'@': path.join(rootDir, 'src'),
			},
			define: {
				'process.env.NODE_ENV': '"production"',
			},
			banner: {
				js: '// Bundled for Vercel Serverless Functions',
			},
		});

		console.log('✅ API built successfully!');
		console.log(`   Output: api/dist/index.js`);
	} catch (error) {
		console.error('❌ Build failed:', error);
		process.exit(1);
	}
}

void buildApi();
