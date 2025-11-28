#!/usr/bin/env bun

/**
 * Minimal environment validator to ensure critical Neon Database and Clerk secrets exist
 * before running smoke tests, migrations or production builds.
 *
 * Usage:
 *   bun scripts/check-env.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

type EnvMap = Record<string, string>;

const REQUIRED_VARS = [
	'DATABASE_URL',
	'VITE_CLERK_PUBLISHABLE_KEY',
	'CLERK_SECRET_KEY',
	'VITE_API_URL',
] as const;

const OPTIONAL_VARS = [
	'DATABASE_URL_UNPOOLED',
	'VITE_APP_ENV',
	'VITE_APP_VERSION',
];

const envFiles = ['.env.local', '.env'];

function loadEnvFiles(): EnvMap {
	const map: EnvMap = {};
	for (const file of envFiles) {
		const fullPath = path.resolve(process.cwd(), file);
		if (!existsSync(fullPath)) {
			continue;
		}
		const content = readFileSync(fullPath, 'utf-8');
		for (const line of content.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) {
				continue;
			}
			const [key, ...rest] = trimmed.split('=');
			if (!key) {
				continue;
			}
			const value = rest
				.join('=')
				.trim()
				.replace(/^['"]|['"]$/g, '');
			if (value.length === 0) {
				continue;
			}
			map[key.trim()] = value;
		}
	}
	return map;
}

const fileEnv = loadEnvFiles();

function resolveEnv(key: string): string | undefined {
	return process.env[key] ?? fileEnv[key];
}

const missing = REQUIRED_VARS.filter((key) => !resolveEnv(key));
const warnings = OPTIONAL_VARS.filter((key) => !resolveEnv(key));

if (missing.length > 0) {
	process.stderr.write('❌ Missing required environment variables:\n');
	for (const key of missing) {
		process.stderr.write(`  • ${key}\n`);
	}
	process.stderr.write(
		'\nRefer to env.example for the authoritative list of required variables.\n',
	);
	process.exit(1);
}

if (warnings.length > 0) {
	process.stdout.write(
		'⚠️ Optional variables not found (recommended to set):\n',
	);
	for (const key of warnings) {
		process.stdout.write(`  • ${key}\n`);
	}
}

process.stdout.write('✅ Environment variables validated successfully.\n');
