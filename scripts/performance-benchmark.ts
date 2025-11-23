#!/usr/bin/env bun

/**
 * OXLint Performance Benchmark Script
 * Validates 50-100x faster performance claims
 *
 * This script benchmarks OXLint against traditional linters (ESLint, Biome)
 * and validates performance improvements for the AegisWallet project.
 */

import { execSync } from 'node:child_process';

interface BenchmarkResult {
  tool: string;
  duration: number;
  exitCode: number;
  filesProcessed?: number;
  issuesFound?: number;
}

interface PerformanceReport {
  totalFiles: number;
  benchmarks: BenchmarkResult[];
  improvements: {
    vsBiome: number;
    vsESLint?: number;
  };
  target: number;
  achieved: boolean;
}

// Configuration
const CONFIG = {
  // Target performance improvement (50x minimum)
  targetImprovement: 50,
  // File patterns to benchmark
  patterns: ['src/**/*.{ts,tsx,js,jsx}', 'scripts/**/*.{ts,tsx,js,jsx}'],
  // Benchmark tools
  tools: [
    {
      command: 'bunx oxlint --quiet',
      name: 'OXLint',
      warmup: true,
    },
    {
      command: 'bunx biome check --files-ignore-unknown=true src scripts',
      name: 'Biome',
    },
    {
      command: 'bunx oxlint --category=security --quiet',
      name: 'OXLint Security',
    },
    {
      command: 'bunx oxlint --config=.oxlintrc.healthcare.json --quiet',
      name: 'OXLint Healthcare',
    },
  ],
};

// Colors for output
const colors = {
  blue: '\x1b[34m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(_message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const _timestamp = new Date().toISOString();
  const _prefix =
    type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';

  const _colorFn =
    type === 'success'
      ? colorize
      : type === 'warning'
        ? (t: string) => colorize(t, 'yellow')
        : type === 'error'
          ? (t: string) => colorize(t, 'red')
          : (t: string) => colorize(t, 'blue');
}

/**
 * Count total files that will be processed
 */
function countFiles(): number {
  try {
    const result = execSync(
      'find src scripts -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l',
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return parseInt(result.trim(), 10) || 0;
  } catch {
    // Fallback for Windows
    try {
      const result = execSync(
        'dir /s /b src\\*.ts src\\*.tsx src\\*.js src\\*.jsx scripts\\*.ts scripts\\*.tsx scripts\\*.js scripts\\*.jsx 2>nul | find /c /v ""',
        { encoding: 'utf8', stdio: 'pipe' }
      );
      return parseInt(result.trim(), 10) || 0;
    } catch {
      return 0;
    }
  }
}

/**
 * Execute benchmark run for a tool
 */
function runBenchmark(tool: (typeof CONFIG.tools)[0]): BenchmarkResult {
  log(`Benchmarking ${colorize(tool.name, 'cyan')}...`);

  // Warm up cache if specified
  if (tool.warmup) {
    try {
      execSync(tool.command, { stdio: 'ignore' });
    } catch {
      // Ignore warmup failures
    }
  }

  // Run actual benchmark
  const startTime = process.hrtime.bigint();

  try {
    execSync(tool.command, {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    log(`${tool.name} completed in ${colorize(`${duration.toFixed(2)}ms`, 'green')}`, 'success');

    return {
      duration,
      exitCode: 0,
      tool: tool.name,
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;

    log(`${tool.name} failed after ${colorize(`${duration.toFixed(2)}ms`, 'red')}`, 'error');

    return {
      duration,
      exitCode: error.status || 1,
      tool: tool.name,
    };
  }
}

/**
 * Calculate performance improvements
 */
function calculateImprovements(benchmarks: BenchmarkResult[]): {
  vsBiome: number;
  vsESLint?: number;
} {
  const oxlintResult = benchmarks.find((b) => b.tool === 'OXLint');
  const biomeResult = benchmarks.find((b) => b.tool === 'Biome');

  const improvements: { vsBiome: number; vsESLint?: number } = {
    vsBiome: 0,
  };

  if (oxlintResult && biomeResult && biomeResult.duration > 0) {
    improvements.vsBiome = biomeResult.duration / oxlintResult.duration;
  }

  return improvements;
}

/**
 * Generate performance report
 */
function generateReport(totalFiles: number, benchmarks: BenchmarkResult[]): PerformanceReport {
  const improvements = calculateImprovements(benchmarks);
  const achieved = improvements.vsBiome >= CONFIG.targetImprovement;

  return {
    achieved,
    benchmarks,
    improvements,
    target: CONFIG.targetImprovement,
    totalFiles,
  };
}

/**
 * Display benchmark results
 */
function displayResults(report: PerformanceReport) {
  const fastest = Math.min(...report.benchmarks.map((b) => b.duration));

  report.benchmarks.forEach((benchmark) => {
    const _speed = fastest > 0 ? `${(benchmark.duration / fastest).toFixed(1)}x` : 'N/A';
    const _status =
      benchmark.exitCode === 0 ? colorize('✓ PASS', 'green') : colorize('✗ FAIL', 'red');
    const _duration = colorize(`${benchmark.duration.toFixed(2)}ms`, 'blue');
  });

  const oxlintResult = report.benchmarks.find((b) => b.tool === 'OXLint');
  const biomeResult = report.benchmarks.find((b) => b.tool === 'Biome');

  if (oxlintResult && biomeResult) {
    const improvement = report.improvements.vsBiome;
    const _totalTime = oxlintResult.duration + biomeResult.duration;

    // Performance classification
    if (improvement >= 100) {
    } else if (improvement >= 50) {
    } else if (improvement >= 20) {
    } else if (improvement >= 5) {
    } else {
    }
  }

  if (report.achieved) {
  } else {
  }

  // Healthcare compliance note
  const healthcareResult = report.benchmarks.find((b) => b.tool === 'OXLint Healthcare');
  if (healthcareResult) {
  }
}

/**
 * Generate JSON report for CI/CD integration
 */
function generateJsonReport(report: PerformanceReport): void {
  const jsonReport = {
    benchmarks: report.benchmarks,
    classification:
      report.improvements.vsBiome >= 100
        ? 'exceptional'
        : report.improvements.vsBiome >= 50
          ? 'excellent'
          : report.improvements.vsBiome >= 20
            ? 'good'
            : report.improvements.vsBiome >= 5
              ? 'moderate'
              : 'needs-optimization',
    summary: {
      achieved: report.achieved,
      actualImprovement: report.improvements.vsBiome,
      targetImprovement: report.target,
      totalFiles: report.totalFiles,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    require('node:fs').writeFileSync(
      'oxlint-performance-report.json',
      JSON.stringify(jsonReport, null, 2)
    );
    log('JSON report saved to oxlint-performance-report.json', 'success');
  } catch (_error) {
    log('Failed to save JSON report', 'error');
  }
}

/**
 * Main execution function
 */
function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const quiet = args.includes('--quiet');

  if (!quiet) {
    log('🚀 OXLint Performance Benchmark for AegisWallet');
    log('Validating 50-100x faster linting performance claims');
    log('');
  }

  // Count files to process
  const totalFiles = countFiles();
  if (!quiet) {
    log(`Found ${colorize(totalFiles.toString(), 'blue')} files to process`);
  }

  if (totalFiles === 0) {
    log('No files found to benchmark', 'error');
    process.exit(1);
  }

  // Run benchmarks
  const benchmarks: BenchmarkResult[] = [];

  CONFIG.tools.forEach((tool) => {
    const result = runBenchmark(tool);
    benchmarks.push(result);
  });

  // Generate report
  const report = generateReport(totalFiles, benchmarks);

  // Display results
  if (!quiet) {
    displayResults(report);
  }

  // Generate JSON output if requested
  if (jsonOutput) {
    generateJsonReport(report);
  }

  // Exit with appropriate code
  process.exit(report.achieved ? 0 : 1);
}

// Execute if run directly
if (import.meta.main) {
  main();
}

export { main, runBenchmark, generateReport };
