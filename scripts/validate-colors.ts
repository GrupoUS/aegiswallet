#!/usr/bin/env bun
/**
 * Color System Validation Script
 *
 * This script validates that no hardcoded Tailwind color classes are used in the codebase.
 * It searches for patterns like text-green-500, bg-red-500, border-yellow-500, etc.
 *
 * Usage: bun run validate:colors
 *
 * Exit codes:
 * - 0: No violations found
 * - 1: Violations found
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import pc from 'picocolors'

// Hardcoded color patterns to detect
const HARDCODED_COLOR_PATTERNS = [
  // Tailwind color utilities with numeric shades
  /\b(text|bg|border|ring|shadow|from|to|via)-(red|green|blue|yellow|purple|pink|indigo|teal|cyan|lime|emerald|sky|violet|fuchsia|rose|amber|orange)-(50|100|200|300|400|500|600|700|800|900|950)\b/g,
]

// Allowed exceptions (e.g., in documentation or comments)
const ALLOWED_PATTERNS = [
  /\/\/ ❌.*?(green|red|yellow|blue|teal)-\d{3}/g, // Comments showing bad examples
  /\/\*.*?(green|red|yellow|blue|teal)-\d{3}.*?\*\//gs, // Block comments
]

interface Violation {
  file: string
  line: number
  column: number
  match: string
  context: string
}

const violations: Violation[] = []

/**
 * Check if a match is in an allowed context (comment, documentation)
 */
function isAllowedException(content: string, matchIndex: number): boolean {
  for (const pattern of ALLOWED_PATTERNS) {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      if (match.index === undefined) continue
      const start = match.index
      const end = start + match[0].length
      if (matchIndex >= start && matchIndex <= end) {
        return true
      }
    }
  }
  return false
}

/**
 * Get line and column number from string index
 */
function getLineAndColumn(content: string, index: number): { line: number; column: number } {
  const lines = content.substring(0, index).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

/**
 * Get context around the violation (3 lines before and after)
 */
function getContext(content: string, lineNumber: number): string {
  const lines = content.split('\n')
  const start = Math.max(0, lineNumber - 2)
  const end = Math.min(lines.length, lineNumber + 1)

  return lines
    .slice(start, end)
    .map((line, idx) => {
      const actualLine = start + idx + 1
      const prefix = actualLine === lineNumber ? '>' : ' '
      return `${prefix} ${actualLine.toString().padStart(4)} | ${line}`
    })
    .join('\n')
}

/**
 * Scan a file for hardcoded color violations
 */
async function scanFile(filePath: string): Promise<void> {
  try {
    const content = await readFile(filePath, 'utf-8')

    for (const pattern of HARDCODED_COLOR_PATTERNS) {
      const matches = content.matchAll(pattern)

      for (const match of matches) {
        if (match.index === undefined) continue

        // Skip if this is an allowed exception
        if (isAllowedException(content, match.index)) {
          continue
        }

        const { line, column } = getLineAndColumn(content, match.index)
        const context = getContext(content, line)

        violations.push({
          file: filePath,
          line,
          column,
          match: match[0],
          context,
        })
      }
    }
  } catch (error) {
    console.error(pc.red(`Error reading file ${filePath}:`), error)
  }
}

/**
 * Recursively scan directory for TypeScript/TSX files
 */
async function scanDirectory(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      // Skip node_modules, dist, build, etc.
      if (entry.isDirectory()) {
        if (['node_modules', 'dist', 'build', 'coverage', '.git'].includes(entry.name)) {
          continue
        }
        await scanDirectory(fullPath)
      } else if (entry.isFile()) {
        // Only scan TypeScript and TSX files
        if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          await scanFile(fullPath)
        }
      }
    }
  } catch (error) {
    console.error(pc.red(`Error scanning directory ${dir}:`), error)
  }
}

/**
 * Print violations in a readable format
 */
function printViolations(): void {
  if (violations.length === 0) {
    console.log(pc.green('✓ No hardcoded color violations found!'))
    console.log(pc.dim('All components are using semantic color tokens.'))
    return
  }

  console.log(pc.red(`✗ Found ${violations.length} hardcoded color violation(s):\n`))

  // Group violations by file
  const violationsByFile = violations.reduce(
    (acc, violation) => {
      if (!acc[violation.file]) {
        acc[violation.file] = []
      }
      acc[violation.file].push(violation)
      return acc
    },
    {} as Record<string, Violation[]>
  )

  for (const [file, fileViolations] of Object.entries(violationsByFile)) {
    console.log(pc.cyan(`\n${file}`))
    console.log(pc.dim('─'.repeat(80)))

    for (const violation of fileViolations) {
      console.log(pc.yellow(`  Line ${violation.line}:${violation.column}`))
      console.log(pc.red(`  Found: ${violation.match}`))
      console.log(pc.dim('\n  Context:'))
      console.log(pc.dim(violation.context))
      console.log()
    }
  }

  console.log(pc.yellow('\n⚠ Recommendations:'))
  console.log(pc.dim('  • Replace hardcoded colors with semantic tokens'))
  console.log(pc.dim('  • Use text-success, text-warning, text-financial-positive, etc.'))
  console.log(pc.dim('  • See docs/design-specs/ui-ux-action-plan.md for guidance'))
  console.log()
}

/**
 * Main execution
 */
async function main() {
  console.log(pc.blue('🎨 AegisWallet Color System Validator\n'))
  console.log(pc.dim('Scanning for hardcoded Tailwind color classes...\n'))

  const startTime = Date.now()

  // Scan src directory
  await scanDirectory(join(process.cwd(), 'src'))

  const duration = Date.now() - startTime

  printViolations()

  console.log(pc.dim(`\nCompleted in ${duration}ms`))

  // Exit with error code if violations found
  if (violations.length > 0) {
    process.exit(1)
  }
}

// Run the validator
main().catch((error) => {
  console.error(pc.red('Fatal error:'), error)
  process.exit(1)
})
