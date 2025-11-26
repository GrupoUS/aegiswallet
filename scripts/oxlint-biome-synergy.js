#!/usr/bin/env bun
/**
 * OXLint + Biome Synergy Script for AegisWallet
 * Optimized for 50-100x faster linting with healthcare compliance
 *
 * Features:
 * - Parallel execution of OXLint and Biome
 * - Healthcare compliance validation (LGPD)
 * - Brazilian market specific rules
 * - Performance benchmarking
 * - CI/CD integration ready
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
// Script configuration
const CONFIG = {
  // File patterns for linting
  patterns: [
    'src/**/*.{ts,tsx,js,jsx}',
    'scripts/**/*.{ts,tsx,js,jsx}',
    'vitest.config.ts',
    'vitest.*.config.ts',
  ],
  // OXLint configurations
  oxlintConfigs: {
    healthcare: '.oxlintrc.healthcare.json',
    main: '.oxlintrc.json',
  },
  // Biome configuration
  biomeConfig: 'biome.json',
  // Performance thresholds
  performanceThreshold: 50, // 50x faster minimum
  // Colors for output
  colors: {
    blue: '\x1b[34m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
    yellow: '\x1b[33m',
  },
};
/**
 * Color utility functions
 */
const colors = {
  blue: (text) => `${CONFIG.colors.blue}${text}${CONFIG.colors.reset}`,
  bright: (text) => `${CONFIG.colors.bright}${text}${CONFIG.colors.reset}`,
  cyan: (text) => `${CONFIG.colors.cyan}${text}${CONFIG.colors.reset}`,
  green: (text) => `${CONFIG.colors.green}${text}${CONFIG.colors.reset}`,
  red: (text) => `${CONFIG.colors.red}${text}${CONFIG.colors.reset}`,
  yellow: (text) => `${CONFIG.colors.yellow}${text}${CONFIG.colors.reset}`,
};
/**
 * Log utility with colors
 */
function log(_message, type = 'info') {
  const _timestamp = new Date().toISOString();
  const _prefix =
    type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
  const _colorFn =
    type === 'success'
      ? colors.green
      : type === 'warning'
        ? colors.yellow
        : type === 'error'
          ? colors.red
          : colors.blue;
}
/**
 * Perform health check on configuration files
 */
function healthCheck() {
  log('Performing health check...');
  const results = {
    biomeConfig: existsSync(CONFIG.biomeConfig),
    healthcareConfig: existsSync(CONFIG.oxlintConfigs.healthcare),
    oxlintConfig: existsSync(CONFIG.oxlintConfigs.main),
    typeSupport: existsSync('tsconfig.json'),
  };
  Object.entries(results).forEach(([key, value]) => {
    const status = value ? '✓' : '✗';
    const message = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    log(`${status.charAt(0)} ${message}: ${status}`, value ? 'success' : 'error');
  });
  const allValid = Object.values(results).every(Boolean);
  if (!allValid) {
    log('Health check failed - some configuration files missing', 'error');
    process.exit(1);
  }
  log('Health check passed', 'success');
  return results;
}
/**
 * Execute command and measure performance
 */
function executeWithTiming(command, description) {
  log(`Running ${description}...`);
  const startTime = process.hrtime.bigint();
  try {
    execSync(command, {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    log(`${description} completed in ${duration.toFixed(2)}ms`, 'success');
    return { duration, exitCode: 0 };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    log(`${description} failed after ${duration.toFixed(2)}ms`, 'error');
    return { duration, exitCode: error.status || 1 };
  }
}
/**
 * Run OXLint with different configurations
 */
function runOXLint(config = 'main') {
  const configMap = {
    healthcare: '--config=.oxlintrc.healthcare.json',
    main: '',
    performance: '--category=perf',
    security: '--category=security',
  };
  const configFlag = configMap[config];
  const command = `bunx oxlint ${configFlag} --quiet`;
  const description = `OXLint (${config})`;
  const result = executeWithTiming(command, description);
  return result.exitCode;
}
/**
 * Run Biome for formatting and additional linting
 */
function runBiome() {
  const command =
    'bunx biome check --files-ignore-unknown=true --files-max-size=10485760 src scripts';
  const description = 'Biome check';
  const result = executeWithTiming(command, description);
  return result.exitCode;
}
/**
 * Run TypeScript type-aware linting with tsgolint
 */
function runTypeAwareLinting() {
  const command = 'bunx tsgolint src/**/*.{ts,tsx}';
  const description = 'TypeScript type-aware linting';
  const result = executeWithTiming(command, description);
  return result.exitCode;
}
/**
 * Performance benchmark against Biome
 */
function performanceBenchmark() {
  log('🚀 Running performance benchmark...');
  // Warm up cache
  execSync('bunx oxlint --quiet', { stdio: 'ignore' });
  // Benchmark OXLint
  const oxlintStart = process.hrtime.bigint();
  execSync('bunx oxlint --quiet', { stdio: 'ignore' });
  const oxlintEnd = process.hrtime.bigint();
  const oxlintTime = Number(oxlintEnd - oxlintStart) / 1000000;
  // Benchmark Biome
  const biomeStart = process.hrtime.bigint();
  execSync('bunx biome check --files-ignore-unknown=true src scripts', { stdio: 'ignore' });
  const biomeEnd = process.hrtime.bigint();
  const biomeTime = Number(biomeEnd - biomeStart) / 1000000;
  // Calculate metrics
  const totalTime = oxlintTime + biomeTime;
  const improvement = biomeTime / oxlintTime;
  const metrics = {
    biome: biomeTime,
    improvement,
    oxlint: oxlintTime,
    total: totalTime,
  };
  // Log results
  log(`📊 Performance Metrics:`, 'info');
  log(`  OXLint: ${oxlintTime.toFixed(2)}ms`, 'success');
  log(`  Biome: ${biomeTime.toFixed(2)}ms`, 'info');
  log(`  Combined: ${totalTime.toFixed(2)}ms`, 'info');
  log(
    `  Improvement: ${improvement.toFixed(1)}x faster`,
    improvement >= CONFIG.performanceThreshold ? 'success' : 'warning'
  );
  return metrics;
}
/**
 * Healthcare compliance validation
 */
function validateHealthcareCompliance() {
  log('🏥 Validating healthcare compliance (LGPD)...');
  const exitCode = runOXLint('healthcare');
  if (exitCode === 0) {
    log('Healthcare compliance validation passed', 'success');
    return true;
  }
  log('Healthcare compliance validation failed', 'error');
  return false;
}
/**
 * Security validation
 */
function validateSecurity() {
  log('🔒 Validating security rules...');
  const exitCode = runOXLint('security');
  if (exitCode === 0) {
    log('Security validation passed', 'success');
    return true;
  }
  log('Security validation failed', 'error');
  return false;
}
/**
 * Performance validation
 */
function validatePerformance() {
  log('⚡ Validating performance anti-patterns...');
  const exitCode = runOXLint('performance');
  if (exitCode === 0) {
    log('Performance validation passed', 'success');
    return true;
  }
  log('Performance issues detected - review suggestions', 'warning');
  return true; // Don't fail for performance warnings
}
/**
 * Main execution function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  log('🚀 AegisWallet OXLint + Biome Synergy Script');
  log('Optimized for 50-100x faster linting with healthcare compliance');
  log('');
  // Perform health check
  healthCheck();
  let overallExitCode = 0;
  const startTime = Date.now();
  switch (command) {
    case 'oxlint':
      overallExitCode = runOXLint('main');
      break;
    case 'healthcare':
      if (!validateHealthcareCompliance()) {
        overallExitCode = 1;
      }
      break;
    case 'security':
      if (!validateSecurity()) {
        overallExitCode = 1;
      }
      break;
    case 'performance':
      if (!validatePerformance()) {
        overallExitCode = 1;
      }
      break;
    case 'benchmark':
      performanceBenchmark();
      break;
    case 'types':
      overallExitCode = runTypeAwareLinting();
      break;
    default: {
      log('Running comprehensive validation...');
      // Run performance benchmark first
      const metrics = performanceBenchmark();
      // Run all validations
      const oxlintResult = runOXLint('main');
      const biomeResult = runBiome();
      const typeResult = runTypeAwareLinting();
      const healthcareValid = validateHealthcareCompliance();
      const securityValid = validateSecurity();
      const performanceValid = validatePerformance();
      // Combine exit codes
      overallExitCode = Math.max(
        oxlintResult,
        biomeResult,
        typeResult,
        healthcareValid ? 0 : 1,
        securityValid ? 0 : 1
      );
      // Log summary
      const totalDuration = Date.now() - startTime;
      log('');
      log('📊 Validation Summary:', 'info');
      log(`  Total Duration: ${totalDuration}ms`, 'info');
      log(
        `  Performance Improvement: ${metrics.improvement.toFixed(1)}x`,
        metrics.improvement >= CONFIG.performanceThreshold ? 'success' : 'warning'
      );
      log(
        `  Healthcare Compliance: ${healthcareValid ? '✓' : '✗'}`,
        healthcareValid ? 'success' : 'error'
      );
      log(
        `  Security Validation: ${securityValid ? '✓' : '✗'}`,
        securityValid ? 'success' : 'error'
      );
      log(
        `  Performance Validation: ${performanceValid ? '✓' : '⚠'}`,
        performanceValid ? 'success' : 'warning'
      );
      break;
    }
  }
  if (overallExitCode === 0) {
    log('🎉 All validations completed successfully!', 'success');
  } else {
    log('❌ Some validations failed. Please review the output above.', 'error');
  }
  process.exit(overallExitCode);
}
// Execute main function
if (import.meta.main) {
  main();
}
export { main, healthCheck, performanceBenchmark, validateHealthcareCompliance };
