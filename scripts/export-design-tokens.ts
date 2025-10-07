#!/usr/bin/env bun

/**
 * Export Design Tokens to JSON
 *
 * This script exports CSS custom properties from src/index.css
 * to a JSON format that can be consumed by design tools like
 * Figma, Sketch, or other design systems.
 *
 * Usage: bun run scripts/export-design-tokens.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface ColorToken {
  name: string
  value: string
  type: 'color'
  description?: string
}

interface TokenGroup {
  [key: string]: ColorToken
}

interface DesignTokens {
  version: string
  lastUpdated: string
  colors: {
    light: TokenGroup
    dark: TokenGroup
  }
}

// Read index.css
const cssPath = resolve(process.cwd(), 'src/index.css')
const cssContent = readFileSync(cssPath, 'utf-8')

// Parse CSS variables
function parseCSSVariables(content: string, selector: string): TokenGroup {
  const tokens: TokenGroup = {}

  // Find the selector block
  const selectorRegex = new RegExp(`${selector}\\s*{([^}]+)}`, 's')
  const match = content.match(selectorRegex)

  if (!match) return tokens

  const block = match[1]

  // Extract CSS variables
  const varRegex = /--([a-z-]+):\s*oklch\(([^)]+)\);/g
  let varMatch

  while ((varMatch = varRegex.exec(block)) !== null) {
    const [, name, value] = varMatch

    // Skip non-color tokens
    if (name.includes('radius') || name.includes('chart')) continue

    tokens[name] = {
      name,
      value: `oklch(${value})`,
      type: 'color',
      description: getTokenDescription(name),
    }
  }

  return tokens
}

// Get token description
function getTokenDescription(name: string): string {
  const descriptions: Record<string, string> = {
    success: 'Success state color for confirmations and positive feedback',
    'success-foreground': 'Text color on success backgrounds',
    warning: 'Warning state color for cautions and pending states',
    'warning-foreground': 'Text color on warning backgrounds',
    info: 'Information color for neutral actions and messages',
    'info-foreground': 'Text color on info backgrounds',
    destructive: 'Error and destructive action color',
    'destructive-foreground': 'Text color on destructive backgrounds',
    'financial-positive': 'Positive financial amounts (income, received)',
    'financial-negative': 'Negative financial amounts (expenses, sent)',
    'financial-neutral': 'Neutral financial amounts (pending)',
    'pix-primary': 'Primary PIX branding color',
    'pix-accent': 'PIX accent color for gradients and highlights',
  }

  return descriptions[name] || `Color token: ${name}`
}

// Parse light and dark mode tokens
const lightTokens = parseCSSVariables(cssContent, ':root')
const darkTokens = parseCSSVariables(cssContent, '\\.dark')

// Create design tokens object
const designTokens: DesignTokens = {
  version: '2.0.0',
  lastUpdated: new Date().toISOString(),
  colors: {
    light: lightTokens,
    dark: darkTokens,
  },
}

// Write to JSON file
const outputPath = resolve(process.cwd(), 'design-tokens.json')
writeFileSync(outputPath, JSON.stringify(designTokens, null, 2), 'utf-8')

console.log('✅ Design tokens exported successfully!')
console.log(`📄 Output: ${outputPath}`)
console.log(`🎨 Tokens exported:`)
console.log(`   - Light mode: ${Object.keys(lightTokens).length} tokens`)
console.log(`   - Dark mode: ${Object.keys(darkTokens).length} tokens`)
console.log('')
console.log('💡 Use this file to sync with design tools like Figma or Sketch')
