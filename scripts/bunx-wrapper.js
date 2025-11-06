#!/usr/bin/env bun

/**
 * bunx wrapper for Windows and Unix systems
 * This script forwards all arguments to 'bun x' command
 * Solves issue where bunx is not in PATH on Windows
 */

const { spawn } = require('node:child_process');

// Get all arguments passed to this script
const args = process.argv.slice(2);

if (args.length === 0) {
  process.exit(1);
}

// Execute bun x with all arguments
const bunPath = process.env.BUN_PATH || 'bun';
const child = spawn(bunPath, ['x', ...args], {
  stdio: 'inherit',
  shell: false,
});

child.on('error', (_error) => {
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});
