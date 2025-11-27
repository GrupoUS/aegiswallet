/**
 * Build script for Vercel API functions
 * Bundles the Hono server with path alias resolution
 */

import * as esbuild from 'esbuild';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function buildApi() {
  console.log('Building API bundle for Vercel...');

  try {
    const result = await esbuild.build({
      entryPoints: [path.join(rootDir, 'api/index.ts')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: path.join(rootDir, 'api/dist/index.js'),
      sourcemap: true,
      minify: false, // Keep readable for debugging
      
      // Resolve path aliases
      alias: {
        '@': path.join(rootDir, 'src'),
        // Redirect any bun-specific hono imports to empty modules
        'hono/bun': path.join(rootDir, 'scripts/empty-module.js'),
        'hono/adapter/bun': path.join(rootDir, 'scripts/empty-module.js'),
        'hono/adapter/bun/ssg': path.join(rootDir, 'scripts/empty-module.js'),
      },
      
      // External packages that should not be bundled
      external: [
        // Node.js built-ins
        'node:*',
        'fs',
        'path',
        'crypto',
        'stream',
        'buffer',
        'util',
        'events',
        'http',
        'https',
        'url',
        'querystring',
        'os',
        'net',
        'tls',
        'zlib',
        'async_hooks',
        // Keep Supabase external (it's a complex package)
        '@supabase/supabase-js',
        // Keep @hono/node-server external as it's the adapter we use
        '@hono/node-server',
        '@hono/node-server/vercel',
      ],
      
      // Banner for ESM compatibility
      banner: {
        js: `
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`.trim(),
      },
      
      // Log level
      logLevel: 'info',
    });

    if (result.errors.length > 0) {
      console.error('Build errors:', result.errors);
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      console.warn('Build warnings:', result.warnings);
    }

    console.log('✓ API bundle built successfully: api/dist/index.js');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApi();
