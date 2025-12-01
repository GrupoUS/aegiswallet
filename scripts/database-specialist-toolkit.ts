/**
 * Database Specialist Toolkit - Complete Integration
 *
 * Master control script for all database operations
 * Integrates health checking, auto-repair, performance optimization, and LGPD compliance
 *
 * Usage: bun scripts/database-specialist-toolkit.ts [command] [options]
 */

import { DatabaseAutoRepair } from './database-auto-repair';
import { DatabaseHealthChecker, type HealthCheckResult } from './database-health-check';
import {
	DatabasePerformanceOptimizer,
	type PerformanceAnalysisResult,
} from './database-performance-optimizer';
import { type LGPDComplianceResult, LGPDComplianceValidator } from './lgpd-compliance-validator';

interface ToolkitOptions {
	command: 'health' | 'repair' | 'optimize' | 'compliance' | 'full' | 'quick';
	dryRun?: boolean;
	interactive?: boolean;
	auto?: boolean;
	output?: 'console' | 'json' | 'both';
}

class DatabaseSpecialistToolkit {
	private healthChecker: DatabaseHealthChecker;
	private autoRepair: DatabaseAutoRepair;
	private lgpdValidator: LGPDComplianceValidator;
	private performanceOptimizer: DatabasePerformanceOptimizer;

	constructor() {
		this.healthChecker = new DatabaseHealthChecker();
		this.autoRepair = new DatabaseAutoRepair();
		this.lgpdValidator = new LGPDComplianceValidator();
		this.performanceOptimizer = new DatabasePerformanceOptimizer();
	}

	async run(options: ToolkitOptions): Promise<void> {
		console.log('🗄️  DATABASE SPECIALIST TOOLKIT');
		console.log('🇧🇷 Brazilian Fintech + Neon + Drizzle Expert System');
		console.log('='.repeat(60));

		let results: any = {};

		try {
			switch (options.command) {
				case 'health':
					results.health = await this.runHealthCheck();
					break;

				case 'repair':
					results = await this.runAutoRepair(options);
					break;

				case 'optimize':
					results.performance = await this.runPerformanceOptimization();
					break;

				case 'compliance':
					results.compliance = await this.runLGPDCompliance();
					break;

				case 'full':
					results = await this.runFullAnalysis(options);
					break;

				case 'quick':
					results = await this.runQuickCheck();
					break;

				default:
					throw new Error(`Unknown command: ${options.command}`);
			}

			this.displayResults(results, options);
		} catch (error) {
			console.error('\n❌ Toolkit execution failed:', error);
			process.exit(1);
		} finally {
			await this.cleanup();
		}
	}

	private async runHealthCheck(): Promise<HealthCheckResult> {
		console.log('\n🏥 DATABASE HEALTH CHECK');
		console.log('-'.repeat(40));

		return await this.healthChecker.runComprehensiveHealthCheck();
	}

	private async runAutoRepair(options: ToolkitOptions): Promise<any> {
		console.log('\n🔧 DATABASE AUTO-REPAIR');
		console.log('-'.repeat(40));

		// First run health check to identify issues
		const healthResult = await this.healthChecker.runComprehensiveHealthCheck();

		if (healthResult.issues.length === 0) {
			console.log('✅ No issues found - Database is healthy!');
			return { health: healthResult, repair: null };
		}

		// Then run auto-repair
		await this.autoRepair.runAutoRepair({
			dryRun: options.dryRun,
			interactive: options.interactive !== false,
		});

		// Run post-repair health check
		const postRepairHealth = await this.healthChecker.runComprehensiveHealthCheck();

		return {
			health: healthResult,
			repair: {
				preScore: healthResult.score,
				postScore: postRepairHealth.score,
				improvement: postRepairHealth.score - healthResult.score,
			},
		};
	}

	private async runPerformanceOptimization(): Promise<PerformanceAnalysisResult> {
		console.log('\n⚡ PERFORMANCE OPTIMIZATION');
		console.log('-'.repeat(40));

		return await this.performanceOptimizer.runPerformanceAnalysis();
	}

	private async runLGPDCompliance(): Promise<LGPDComplianceResult> {
		console.log('\n🇧🇷 LGPD COMPLIANCE VALIDATION');
		console.log('-'.repeat(40));

		return await this.lgpdValidator.validateCompliance();
	}

	private async runFullAnalysis(options: ToolkitOptions): Promise<any> {
		console.log('\n🔍 COMPREHENSIVE DATABASE ANALYSIS');
		console.log('-'.repeat(40));

		const results: any = {};

		// Step 1: Health Check
		console.log('\n📊 Step 1/4: Health Assessment...');
		results.health = await this.healthChecker.runComprehensiveHealthCheck();

		// Step 2: Performance Analysis
		console.log('\n⚡ Step 2/4: Performance Analysis...');
		results.performance = await this.performanceOptimizer.runPerformanceAnalysis();

		// Step 3: LGPD Compliance
		console.log('\n🇧🇷 Step 3/4: LGPD Compliance...');
		results.compliance = await this.lgpdValidator.validateCompliance();

		// Step 4: Auto-Repair (if issues found)
		if (results.health.issues.length > 0 && !options.dryRun) {
			console.log('\n🔧 Step 4/4: Auto-Repair...');
			await this.autoRepair.runAutoRepair({
				dryRun: false,
				interactive: options.interactive !== false,
			});

			// Post-repair health check
			const postRepairHealth = await this.healthChecker.runComprehensiveHealthCheck();
			results.repair = {
				preScore: results.health.score,
				postScore: postRepairHealth.score,
				improvement: postRepairHealth.score - results.health.score,
			};
		}

		return results;
	}

	private async runQuickCheck(): Promise<any> {
		console.log('\n⚡ QUICK HEALTH CHECK');
		console.log('-'.repeat(40));

		// Essential checks only
		const basicChecks = [];

		try {
			// Connection test
			const { db } = await import('../src/db/client');
			const { sql } = await import('drizzle-orm');

			const startTime = Date.now();
			await db.execute(sql`SELECT 1`);
			const latency = Date.now() - startTime;

			basicChecks.push({
				name: 'Database Connection',
				status: '✅',
				value: `${latency}ms`,
			});

			// Basic table count
			const tableCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM information_schema.tables
        WHERE table_schema = 'public'
      `);
			basicChecks.push({
				name: 'Table Count',
				status: '✅',
				value: tableCount.rows[0]?.count,
			});

			// Recent activity
			const recentActivity = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM audit_logs
          WHERE created_at > NOW() - INTERVAL '1 hour'
        ) as recent
      `);
			basicChecks.push({
				name: 'Recent Activity',
				status: recentActivity.rows[0]?.recent ? '✅' : '⚠️',
				value: recentActivity.rows[0]?.recent ? 'Active' : 'No recent activity',
			});
		} catch {
			basicChecks.push({
				name: 'Connection Test',
				status: '❌',
				value: 'Failed',
			});
		}

		return { quickCheck: basicChecks };
	}

	private displayResults(results: any, options: ToolkitOptions): void {
		if (options.output === 'json') {
			console.log('\n📄 JSON OUTPUT:');
			console.log(JSON.stringify(results, null, 2));
			return;
		}

		if (options.output === 'both') {
			console.log('\n📄 DETAILED RESULTS:');
			this.displayDetailedResults(results);

			console.log('\n📄 JSON OUTPUT:');
			console.log(JSON.stringify(results, null, 2));
			return;
		}

		// Default console output
		this.displayDetailedResults(results);
	}

	/**
	 * Display health results section
	 */
	private displayHealthResults(health: any): void {
		console.log(`\n🏥 DATABASE HEALTH: ${health.status.toUpperCase()} (${health.score}/100)`);

		if (health.issues.length > 0) {
			console.log(`⚠️  Issues Found: ${health.issues.length}`);
			health.issues.slice(0, 3).forEach((issue: any, i: number) => {
				console.log(`   ${i + 1}. [${issue.severity}] ${issue.description}`);
			});
			if (health.issues.length > 3) {
				console.log(`   ... and ${health.issues.length - 3} more`);
			}
		}
	}

	/**
	 * Display performance results section
	 */
	private displayPerformanceResults(perf: any): void {
		console.log(`\n⚡ PERFORMANCE: ${perf.status.toUpperCase()} (${perf.overallScore}/100)`);
		console.log(`   📊 Query Performance: ${perf.metrics.queryPerformance.score}/100`);
		console.log(`   📈 Index Efficiency: ${perf.metrics.indexEfficiency.score}/100`);
		console.log(`   🔗 Connection Health: ${perf.metrics.connectionHealth.score}/100`);

		if (perf.recommendations.length > 0) {
			console.log(`   💡 Top Recommendations: ${perf.recommendations.slice(0, 2).length}`);
			perf.recommendations.slice(0, 2).forEach((rec: any, i: number) => {
				console.log(`     ${i + 1}. ${rec.description}`);
			});
		}
	}

	/**
	 * Display LGPD compliance results section
	 */
	private displayComplianceResults(compliance: any): void {
		console.log(
			`\n🇧🇷 LGPD COMPLIANCE: ${compliance.status.toUpperCase()} (${compliance.overallScore}/100)`,
		);

		Object.entries(compliance.requirements).forEach(([key, req]: [string, any]) => {
			const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
			const score = req.score;
			const icon = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌';
			console.log(`   ${icon} ${name}: ${score}/100`);
		});
	}

	/**
	 * Display repair results section
	 */
	private displayRepairResults(repair: any): void {
		console.log(`\n🔧 REPAIR RESULTS:`);
		console.log(`   📊 Pre-Repair Score: ${repair.preScore}/100`);
		console.log(`   ✅ Post-Repair Score: ${repair.postScore}/100`);
		console.log(
			`   📈 Improvement: ${repair.improvement > 0 ? '+' : ''}${repair.improvement} points`,
		);
	}

	/**
	 * Display quick check results section
	 */
	private displayQuickCheckResults(quickCheck: any[]): void {
		console.log('\n⚡ QUICK CHECK RESULTS:');
		quickCheck.forEach((check: any) => {
			console.log(`   ${check.status} ${check.name}: ${check.value}`);
		});
	}

	/**
	 * Calculate and display overall assessment
	 */
	private displayOverallAssessment(results: any): void {
		console.log('\n🎯 OVERALL ASSESSMENT:');
		const scores = [
			results.health?.score || 0,
			results.performance?.overallScore || 0,
			results.compliance?.overallScore || 0,
		].filter((score) => score > 0);

		if (scores.length > 0) {
			const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
			const status =
				overallScore >= 90
					? 'EXCELLENT'
					: overallScore >= 75
						? 'GOOD'
						: overallScore >= 60
							? 'NEEDS ATTENTION'
							: 'CRITICAL';

			console.log(`   📊 Overall Score: ${overallScore}/100`);
			console.log(`   📋 Status: ${status}`);
		}
	}

	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Refactored to reduce complexity
	private displayDetailedResults(results: any): void {
		console.log(`\n${'='.repeat(60)}`);
		console.log('📊 ANALYSIS RESULTS SUMMARY');
		console.log('='.repeat(60));

		// Display individual sections
		if (results.health) {
			this.displayHealthResults(results.health);
		}

		if (results.performance) {
			this.displayPerformanceResults(results.performance);
		}

		if (results.compliance) {
			this.displayComplianceResults(results.compliance);
		}

		if (results.repair) {
			this.displayRepairResults(results.repair);
		}

		if (results.quickCheck) {
			this.displayQuickCheckResults(results.quickCheck);
		}

		// Overall assessment and recommendations
		this.displayOverallAssessment(results);
		this.generateFinalRecommendations(results);
	}

	private generateFinalRecommendations(results: any): void {
		console.log('\n💡 FINAL RECOMMENDATIONS:');
		const recommendations: string[] = [];

		// Health-based recommendations
		if (results.health?.score < 70) {
			recommendations.push('🔧 Address database health issues immediately');
		}

		// Performance-based recommendations
		if (results.performance?.overallScore < 75) {
			recommendations.push('⚡ Implement performance optimizations');
		}

		// Compliance-based recommendations
		if (results.compliance?.overallScore < 80) {
			recommendations.push('🇧🇷 Improve LGPD compliance measures');
		}

		// Brazilian fintech specific recommendations
		if (results.performance?.brazilianOptimizations) {
			const brazilian = results.performance.brazilianOptimizations;
			if (!brazilian.pixTransactions.optimized) {
				recommendations.push('💰 Optimize PIX transaction performance (<150ms target)');
			}
			if (!brazilian.voiceQueries.optimized) {
				recommendations.push('🎤 Improve voice query processing (<100ms target)');
			}
		}

		if (recommendations.length === 0) {
			recommendations.push('✅ Database is well-optimized - continue monitoring');
		}

		recommendations.forEach((rec, i) => {
			console.log(`   ${i + 1}. ${rec}`);
		});

		console.log('\n🔧 SCHEDULED MAINTENANCE:');
		console.log('   📊 Weekly: Run health check and performance analysis');
		console.log('   🇧🇷 Monthly: LGPD compliance validation');
		console.log('   🔍 Quarterly: Comprehensive database review');
	}

	private async cleanup(): Promise<void> {
		try {
			await this.healthChecker.cleanup?.();
			// Note: AutoRepair, LGPDValidator, and PerformanceOptimizer don't have explicit cleanup methods
		} catch (error) {
			console.warn('⚠️  Cleanup warning:', error);
		}
	}
}

async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log('🗄️  DATABASE SPECIALIST TOOLKIT');
		console.log('');
		console.log('Usage: bun scripts/database-specialist-toolkit.ts <command> [options]');
		console.log('');
		console.log('Commands:');
		console.log('  health     - Comprehensive database health check');
		console.log('  repair     - Auto-detect and fix database issues');
		console.log('  optimize   - Performance analysis and optimization');
		console.log('  compliance - Brazilian LGPD compliance validation');
		console.log('  full       - Complete analysis (health + performance + compliance + repair)');
		console.log('  quick      - Quick health check for monitoring');
		console.log('');
		console.log('Options:');
		console.log('  --dry-run     - Show what would be done without making changes');
		console.log('  --auto        - Run automatically without prompts');
		console.log('  --no-interactive - Run without user interaction');
		console.log('  --output json - Output results in JSON format');
		console.log('  --output both - Output both console and JSON format');
		console.log('');
		console.log('Examples:');
		console.log('  bun scripts/database-specialist-toolkit.ts health');
		console.log('  bun scripts/database-specialist-toolkit.ts repair --dry-run');
		console.log('  bun scripts/database-specialist-toolkit.ts full --auto');
		console.log('  bun scripts/database-specialist-toolkit.ts optimize --output json');
		process.exit(1);
	}

	const command = args[0] as ToolkitOptions['command'];
	const options: ToolkitOptions = {
		command,
		dryRun: args.includes('--dry-run'),
		interactive: !(args.includes('--no-interactive') || args.includes('--auto')),
		auto: args.includes('--auto'),
		output: args.includes('--json') ? 'json' : args.includes('--both') ? 'both' : 'console',
	};

	const toolkit = new DatabaseSpecialistToolkit();
	await toolkit.run(options);
}

// Run if executed directly
if (import.meta.main) {
	main().catch(console.error);
}

export { DatabaseSpecialistToolkit };
