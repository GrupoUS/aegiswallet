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
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }
      const [key, ...rest] = trimmed.split('=');
      if (!key) {
        return;
      }
      const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (value.length === 0) {
        return;
      }
      map[key.trim()] = value;
    });
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
  console.error('❌ Missing required environment variables:');
  missing.forEach((key) => {
    console.error(`  • ${key}`);
  });
  console.error('\nRefer to env.example and docs/ops/supabase-env.md for the authoritative list.');
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('⚠️ Optional variables not found (recommended to set):');
  warnings.forEach((key) => console.warn(`  • ${key}`));
}

console.log('✅ Supabase environment validated successfully.');

