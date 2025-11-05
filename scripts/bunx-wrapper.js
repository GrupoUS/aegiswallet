#!/usr/bin/env bun

/**
 * bunx wrapper for Windows and Unix systems
 * This script forwards all arguments to 'bun x' command
 * Solves issue where bunx is not in PATH on Windows
 */

const { spawn } = require('child_process')

// Get all arguments passed to this script
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: bunx [flags] <package> [arguments...]')
  console.error('Example: bunx vitest --version')
  console.error('Example: bunx cowsay "Hello world!"')
  process.exit(1)
}

// Execute bun x with all arguments
const bunPath = process.env.BUN_PATH || 'bun'
const child = spawn(bunPath, ['x', ...args], {
  stdio: 'inherit',
  shell: false,
})

child.on('error', (error) => {
  console.error(`Error executing bun x: ${error.message}`)
  process.exit(1)
})

child.on('exit', (code) => {
  process.exit(code)
})
