#!/usr/bin/env bun

/**
 * Minimal environment validator to ensure critical Supabase secrets exist
 * before running smoke tests, migrations or production builds.
 *
 * Usage:
 *   bun scripts/check-env.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

type EnvMap = Record<string, string>;

const REQUIRED_VARS = [
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_QA_USER_ID',
] as const;

const OPTIONAL_VARS = ['VITE_SUPABASE_ANON_KEY'];

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
    '\nRefer to env.example and docs/ops/supabase-env.md for the authoritative list.\n'
  );
  process.exit(1);
}

if (warnings.length > 0) {
  process.stdout.write('⚠️ Optional variables not found (recommended to set):\n');
  for (const key of warnings) {
    process.stdout.write(`  • ${key}\n`);
  }
}

process.stdout.write('✅ Supabase environment validated successfully.\n');
