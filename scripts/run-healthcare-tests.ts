#!/usr/bin/env bun

/**
 * Healthcare Testing Runner
 *
 * This script runs comprehensive healthcare compliance tests using
 * Biome + Vitest with LGPD, voice interface, and quality control integration.
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface TestResult {
	name: string;
	status: 'passed' | 'failed' | 'skipped';
	duration: number;
	coverage?: {
		lines: number;
		functions: number;
		branches: number;
		statements: number;
	};
	errors?: string[];
}

interface TestReport {
	timestamp: string;
	environment: string;
	results: TestResult[];
	summary: {
		total: number;
		passed: number;
		failed: number;
		skipped: number;
		coverage?: {
			lines: number;
			functions: number;
			branches: number;
			statements: number;
		};
	};
	qualityMetrics: {
		codeQuality: number;
		security: number;
		performance: number;
		compliance: number;
	};
}

const HEALTHCARE_TEST_SUITES = [
	{
		config: 'vitest.healthcare.config.ts',
		critical: true,
		name: 'LGPD Compliance Tests',
		pattern: 'src/test/healthcare/lgpd-compliance.test.ts',
	},
	{
		config: 'vitest.healthcare.config.ts',
		critical: true,
		name: 'Voice Interface Tests',
		pattern: 'src/test/healthcare/voice-interface.test.ts',
	},
	{
		config: 'vitest.healthcare.config.ts',
		critical: true,
		name: 'tRPC Integration Tests',
		pattern: 'src/test/healthcare/trpc-integration.test.ts',
	},
	{
		config: 'vitest.healthcare.config.ts',
		critical: false,
		name: 'Quality Control Integration',
		pattern: 'src/test/utils/quality-control-integration.test.ts',
	},
];

interface CommandOptions {
	cwd?: string;
	env?: Record<string, string>;
	timeout?: number;
	encoding?: BufferEncoding;
	stdio?: 'pipe' | 'inherit' | 'ignore';
}

function runCommand(
	command: string,
	options: CommandOptions = {},
): { stdout: string; stderr: string } {
	try {
		const stdout = execSync(command, {
			encoding: 'utf8',
			stdio: 'pipe',
			...options,
		});
		return { stderr: '', stdout };
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const execError = error as {
			stdout?: string;
			stderr?: string;
			message?: string;
		};

		return {
			stderr: execError.stderr || errorMessage,
			stdout: execError.stdout || '',
		};
	}
}

function parseVitestOutput(output: string): TestResult {
	// Extract test results
	const passedMatch = output.match(/✓ (\d+) test[s]? passed/);
	const failedMatch = output.match(/✗ (\d+) test[s]? failed/);
	const skippedMatch = output.match(/○ (\d+) test[s]? skipped/);

	const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
	const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
	const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;

	// Extract duration
	const durationMatch = output.match(/Test Files\s+\d+\s+passed\s+\((\d+)\)/);
	const duration = durationMatch ? parseInt(durationMatch[1], 10) : 0;

	// Extract coverage if available
	const coverageMatch = output.match(
		/All files\s+\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)/,
	);
	let coverage: TestResult['coverage'] | undefined;

	if (coverageMatch) {
		coverage = {
			branches: parseInt(coverageMatch[2], 10),
			functions: parseInt(coverageMatch[3], 10),
			lines: parseInt(coverageMatch[4], 10),
			statements: parseInt(coverageMatch[1], 10),
		};
	}

	return {
		coverage,
		duration,
		errors: failed > 0 ? [`${failed} tests failed`] : undefined,
		name: '',
		status: failed > 0 ? 'failed' : passed > 0 ? 'passed' : 'skipped',
	};
}

function runBiomeLinting(): {
	success: boolean;
	errors: string[];
	score: number;
} {
	const { stderr } = runCommand(
		'bunx biome check --files-ignore-unknown=true src/test/healthcare/',
	);

	const errors: string[] = [];
	let success = true;

	if (stderr) {
		const errorLines = stderr.split('\n').filter((line) => line.trim());
		errors.push(...errorLines);
		success = false;
	}

	// Calculate quality score based on error count
	const score = Math.max(0, 100 - errors.length * 5);

	return {
		errors,
		score,
		success,
	};
}

function runTestSuite(suite: (typeof HEALTHCARE_TEST_SUITES)[0]): TestResult {
	const startTime = Date.now();

	// Run Vitest with specific configuration
	const { stdout, stderr } = runCommand(
		`bunx vitest run --config ${suite.config} ${suite.pattern}`,
		{ timeout: 60000 }, // 60 second timeout
	);

	const duration = Date.now() - startTime;
	const result = parseVitestOutput(stdout);

	result.name = suite.name;
	result.duration = duration;

	// Add stderr as errors if present
	if (stderr && !stderr.includes('node:internal')) {
		result.errors = result.errors || [];
		result.errors.push(stderr.trim());
	}

	return result;
}

function calculateQualityMetrics(
	results: TestResult[],
	biomeScore: number,
): TestReport['qualityMetrics'] {

	const codeQuality = biomeScore;
	const security =
		results.find((r) => r.name.includes('LGPD'))?.status === 'passed' ? 100 : 0;
	const performance =
		results.find((r) => r.name.includes('Voice'))?.status === 'passed'
			? 100
			: 0;
	const compliance = results
		.filter(
			(r) =>
				r.name.includes('LGPD') ||
				r.name.includes('RLS') ||
				r.name.includes('Voice'),
		)
		.every((r) => r.status === 'passed')
		? 100
		: 0;

	return {
		codeQuality,
		compliance,
		performance,
		security,
	};
}

function generateTestReport(
	results: TestResult[],
	biomeScore: number,
): TestReport {
	const passed = results.filter((r) => r.status === 'passed').length;
	const failed = results.filter((r) => r.status === 'failed').length;
	const skipped = results.filter((r) => r.status === 'skipped').length;

	// Calculate overall coverage
	const overallCoverage = results
		.filter((r) => r.coverage)
		.reduce(
			(acc, r) => ({
				branches: acc.branches + (r.coverage?.branches || 0),
				functions: acc.functions + (r.coverage?.functions || 0),
				lines: acc.lines + (r.coverage?.lines || 0),
				statements: acc.statements + (r.coverage?.statements || 0),
			}),
			{ branches: 0, functions: 0, lines: 0, statements: 0 },
		);

	const coverageCount = results.filter((r) => r.coverage).length;
	const averageCoverage =
		coverageCount > 0
			? {
					branches: Math.round(overallCoverage.branches / coverageCount),
					functions: Math.round(overallCoverage.functions / coverageCount),
					lines: Math.round(overallCoverage.lines / coverageCount),
					statements: Math.round(overallCoverage.statements / coverageCount),
				}
			: undefined;

	return {
		environment: process.env.NODE_ENV || 'test',
		qualityMetrics: calculateQualityMetrics(results, biomeScore),
		results,
		summary: {
			coverage: averageCoverage,
			failed,
			passed,
			skipped,
			total: results.length,
		},
		timestamp: new Date().toISOString(),
	};
}

function saveTestReport(report: TestReport): void {
	const reportPath = join(process.cwd(), 'healthcare-test-report.json');
	writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

function printSummary(report: TestReport): void {
	console.log('\n=== Healthcare Test Report ===');
	console.log(`Total tests: ${report.summary.total}`);
	console.log(`Passed: ${report.summary.passed}`);
	console.log(`Failed: ${report.summary.failed}`);
	console.log(`Skipped: ${report.summary.skipped}`);

	if (report.summary.coverage) {
		console.log('\nCoverage:');
		console.log(`  Lines: ${report.summary.coverage.lines}%`);
		console.log(`  Functions: ${report.summary.coverage.functions}%`);
		console.log(`  Branches: ${report.summary.coverage.branches}%`);
		console.log(`  Statements: ${report.summary.coverage.statements}%`);
	}

	const overallScore = Math.round(
		(report.qualityMetrics.codeQuality +
			report.qualityMetrics.security +
			report.qualityMetrics.performance +
			report.qualityMetrics.compliance) /
			4,
	);

	console.log(`\nOverall Quality Score: ${overallScore}%`);
	console.log(`  Code Quality: ${report.qualityMetrics.codeQuality}%`);
	console.log(`  Security: ${report.qualityMetrics.security}%`);
	console.log(`  Performance: ${report.qualityMetrics.performance}%`);
	console.log(`  Compliance: ${report.qualityMetrics.compliance}%`);

	if (overallScore >= 90) {
		console.log('\n✅ Excellent quality standards met');
	} else if (overallScore >= 80) {
		console.log('\n⚠️  Good quality with room for improvement');
	} else if (overallScore >= 70) {
		console.log('\n❌ Quality needs attention');
	} else {
		console.log('\n🚨 Critical quality issues detected');
	}
}

async function main(): Promise<void> {
	try {
		// 1. Run Biome linting
		const biomeResult = runBiomeLinting();
		if (!biomeResult.success) {
			console.error('Biome linting errors:');
			biomeResult.errors.forEach((error) => console.error(`  ${error}`));
		}

		// 2. Run all healthcare test suites
		const results: TestResult[] = [];

		for (const suite of HEALTHCARE_TEST_SUITES) {
			try {
				const result = runTestSuite(suite);
				results.push(result);

				const status =
					result.status === 'passed'
						? '✅'
						: result.status === 'failed'
							? '❌'
							: '⏭️';
				
				console.log(`${status} ${result.name} (${result.duration}ms)`);

				if (result.errors && result.errors.length > 0) {
					console.error(`  Errors in ${result.name}:`);
					result.errors.forEach((error) => console.error(`    ${error}`));
				}
			} catch (error) {
				results.push({
					duration: 0,
					errors: [`Execution failed: ${error}`],
					name: suite.name,
					status: 'failed',
				});
			}
		}

		// 3. Generate comprehensive report
		const report = generateTestReport(results, biomeResult.score);

		// 4. Save report
		saveTestReport(report);

		// 5. Print summary
		printSummary(report);

		// 6. Exit with appropriate code
		const failed = report.summary.failed;
		const criticalFailed = results.filter((r) => {
			const suite = HEALTHCARE_TEST_SUITES.find((s) => s.name === r.name);
			return r.status === 'failed' && suite?.critical;
		}).length;

		if (criticalFailed > 0) {
			process.exit(1);
		} else if (failed > 0) {
			process.exit(2);
		} else {
			process.exit(0);
		}
	} catch (_error) {
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.main) {
	main();
}
