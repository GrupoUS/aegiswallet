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
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Read index.css
const cssPath = resolve(process.cwd(), 'src/index.css');
const cssContent = readFileSync(cssPath, 'utf-8');
// Parse CSS variables
function parseCSSVariables(content, selector) {
  const tokens = {};
  // Find the selector block
  const selectorRegex = new RegExp(`${selector}\\s*{([^}]+)}`, 's');
  const match = content.match(selectorRegex);
  if (!match) {
    return tokens;
  }
  const block = match[1];
  // Extract CSS variables
  const varRegex = /--([a-z-]+):\s*oklch\(([^)]+)\);/g;
  let varMatch;
  while (true) {
    varMatch = varRegex.exec(block);
    if (varMatch === null) {
      break;
    }
    const [, name, value] = varMatch;
    // Skip non-color tokens
    if (name.includes('radius') || name.includes('chart')) {
      continue;
    }
    tokens[name] = {
      description: getTokenDescription(name),
      name,
      type: 'color',
      value: `oklch(${value})`,
    };
  }
  return tokens;
}
// Get token description
function getTokenDescription(name) {
  const descriptions = {
    destructive: 'Error and destructive action color',
    'destructive-foreground': 'Text color on destructive backgrounds',
    'financial-negative': 'Negative financial amounts (expenses, sent)',
    'financial-neutral': 'Neutral financial amounts (pending)',
    'financial-positive': 'Positive financial amounts (income, received)',
    info: 'Information color for neutral actions and messages',
    'info-foreground': 'Text color on info backgrounds',
    'pix-accent': 'PIX accent color for gradients and highlights',
    'pix-primary': 'Primary PIX branding color',
    success: 'Success state color for confirmations and positive feedback',
    'success-foreground': 'Text color on success backgrounds',
    warning: 'Warning state color for cautions and pending states',
    'warning-foreground': 'Text color on warning backgrounds',
  };
  return descriptions[name] || `Color token: ${name}`;
}
// Parse light and dark mode tokens
const lightTokens = parseCSSVariables(cssContent, ':root');
const darkTokens = parseCSSVariables(cssContent, '\\.dark');
// Create design tokens object
const designTokens = {
  colors: {
    dark: darkTokens,
    light: lightTokens,
  },
  lastUpdated: new Date().toISOString(),
  version: '2.0.0',
};
// Write to JSON file
const outputPath = resolve(process.cwd(), 'design-tokens.json');
writeFileSync(outputPath, JSON.stringify(designTokens, null, 2), 'utf-8');
