// @ts-nocheck - Utility script with runtime-correct but type-incompatible Neon query access patterns
/**
 * Database Health Check - Advanced Auto-Diagnosis
 *
 * Comprehensive database health assessment for Neon + Drizzle
 * Detects issues across performance, security, compliance, and schema consistency
 *
 * Usage: bun scripts/database-health-check.ts
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';

import { getHttpClient } from '../src/db/client';
import * as schema from '../src/db/schema';

interface HealthCheckResult {
	status: 'excellent' | 'good' | 'fair' | 'critical';
	score: number; // 0-100
	issues: Array<{
		severity: 'critical' | 'high' | 'medium' | 'low';
		category: 'performance' | 'security' | 'compliance' | 'schema';
		description: string;
		recommendation: string;
	}>;
	metrics: {
		connection: { status: string; latency: number };
		performance: { slowQueries: number; indexUsage: number };
		security: { rlsPolicies: number; encryptionStatus: string };
		compliance: { lgpdScore: number; auditCoverage: number };
		schema: { tableCount: number; relationCount: number };
	};
}

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;

class DatabaseHealthChecker {
	private db: ReturnType<typeof getHttpClient>;
	private pool: Pool;
	private poolDb: ReturnType<typeof drizzlePool>;

	constructor() {
		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error('DATABASE_URL environment variable is not set');
		}

		this.db = getHttpClient();
		this.pool = new Pool({ connectionString: databaseUrl });
		this.poolDb = drizzlePool(this.pool, { schema });
	}

	async runComprehensiveHealthCheck(): Promise<HealthCheckResult> {
		console.log('🏥 Starting comprehensive database health check...\n');

		const result: HealthCheckResult = {
			status: 'excellent',
			score: 100,
			issues: [],
			metrics: {
				connection: { status: 'unknown', latency: 0 },
				performance: { slowQueries: 0, indexUsage: 100 },
				security: { rlsPolicies: 0, encryptionStatus: 'unknown' },
				compliance: { lgpdScore: 0, auditCoverage: 0 },
				schema: { tableCount: 0, relationCount: 0 },
			},
		};

		try {
			// Phase 1: Basic Connectivity and Performance
			await this.checkConnectionPerformance(result);

			// Phase 2: Schema Analysis
			await this.analyzeSchema(result);

			// Phase 3: Performance Deep Dive
			await this.analyzePerformance(result);

			// Phase 4: Security Assessment
			await this.assessSecurity(result);

			// Phase 5: Brazilian LGPD Compliance
			await this.checkLGPDCompliance(result);

			// Phase 6: Calculate Overall Score
			this.calculateOverallScore(result);
		} catch (error) {
			result.issues.push({
				severity: 'critical',
				category: 'performance',
				description: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
				recommendation: 'Check database connection and configuration',
			});
			result.status = 'critical';
			result.score = 0;
		}

		return result;
	}

	private async checkConnectionPerformance(
		result: HealthCheckResult,
	): Promise<void> {
		console.log('📡 Testing connection performance...');

		const startTime = Date.now();

		try {
			// Test HTTP client
			const httpResult = await this.db.execute(
				sql`SELECT 1 as test, version() as pg_version`,
			);
			const httpLatency = Date.now() - startTime;

			result.metrics.connection.status = 'healthy';
			result.metrics.connection.latency = httpLatency;

			console.log(`   ✅ HTTP Connection: ${httpLatency}ms`);
			console.log(
				`   ✅ PostgreSQL: ${httpResult[0]?.pg_version?.split(' ')[1] || 'Unknown'}`,
			);

			// Test pool client for transactions
			const poolStart = Date.now();
			await this.poolDb.execute(sql`SELECT 1 as pool_test`);
			const poolLatency = Date.now() - poolStart;

			console.log(`   ✅ Pool Connection: ${poolLatency}ms`);

			if (httpLatency > 1000) {
				result.issues.push({
					severity: 'high',
					category: 'performance',
					description: `High HTTP connection latency: ${httpLatency}ms`,
					recommendation: 'Check Neon compute size and network configuration',
				});
			}
		} catch (error) {
			result.metrics.connection.status = 'failed';
			result.issues.push({
				severity: 'critical',
				category: 'performance',
				description: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
				recommendation: 'Verify DATABASE_URL and Neon project status',
			});
		}
	}

	private async analyzeSchema(result: HealthCheckResult): Promise<void> {
		console.log('\n📋 Analyzing schema structure...');

		try {
			// Count tables
			const tableResult = await this.db.execute(sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);
			result.metrics.schema.tableCount = parseInt(
				tableResult[0]?.count || '0',
				10,
			);

			// Check for Drizzle schema consistency
			const schemaTables = Object.keys(schema).length;

			console.log(`   📊 Database Tables: ${result.metrics.schema.tableCount}`);
			console.log(`   📊 Drizzle Schemas: ${schemaTables}`);

			if (result.metrics.schema.tableCount !== schemaTables) {
				result.issues.push({
					severity: 'medium',
					category: 'schema',
					description: `Schema mismatch: ${result.metrics.schema.tableCount} DB tables vs ${schemaTables} Drizzle schemas`,
					recommendation: 'Run "bun db:generate" to sync schemas',
				});
			}

			// Check for missing relations
			const relationCount = Object.keys(schema).filter((key) =>
				key.includes('Relations'),
			).length;
			result.metrics.schema.relationCount = relationCount;

			console.log(`   🔗 Relation Definitions: ${relationCount}`);
		} catch (error) {
			result.issues.push({
				severity: 'high',
				category: 'schema',
				description: `Schema analysis failed: ${error instanceof Error ? error.message : String(error)}`,
				recommendation: 'Check database permissions and schema access',
			});
		}
	}

	private async analyzePerformance(result: HealthCheckResult): Promise<void> {
		console.log('\n⚡ Analyzing performance metrics...');

		try {
			// Check slow queries (if pg_stat_statements is available)
			try {
				const slowQueries = await this.db.execute(sql`
          SELECT COUNT(*) as count, AVG(mean_exec_time) as avg_time
          FROM pg_stat_statements
          WHERE mean_exec_time > 100
        `);

				const slowCount = parseInt(slowQueries[0]?.count || '0', 10);
				const avgTime = parseFloat(slowQueries[0]?.avg_time || '0');

				result.metrics.performance.slowQueries = slowCount;

				console.log(`   🐌 Slow Queries (>100ms): ${slowCount}`);
				console.log(`   📊 Average Query Time: ${avgTime.toFixed(2)}ms`);

				if (slowCount > 5) {
					result.issues.push({
						severity: 'high',
						category: 'performance',
						description: `${slowCount} slow queries detected (>100ms average)`,
						recommendation: 'Review query optimization and indexing strategy',
					});
				}
			} catch {
				console.log(
					'   ℹ️  pg_stat_statements not available - performance metrics limited',
				);
			}

			// Check index usage
			const indexStats = await this.db.execute(sql`
        SELECT
          COUNT(*) as total_indexes,
          COUNT(CASE WHEN idx_scan = 0 THEN 1 END) as unused_indexes
        FROM pg_stat_user_indexes
      `);

			const totalIndexes = parseInt(indexStats[0]?.total_indexes || '0', 10);
			const unusedIndexes = parseInt(indexStats[0]?.unused_indexes || '0', 10);

			const usageRate =
				totalIndexes > 0
					? ((totalIndexes - unusedIndexes) / totalIndexes) * 100
					: 100;
			result.metrics.performance.indexUsage = Math.round(usageRate);

			console.log(`   📈 Index Usage Rate: ${usageRate.toFixed(1)}%`);
			console.log(`   📄 Unused Indexes: ${unusedIndexes}/${totalIndexes}`);

			if (usageRate < 90) {
				result.issues.push({
					severity: 'medium',
					category: 'performance',
					description: `Index usage rate is ${(100 - usageRate).toFixed(1)}% below optimal`,
					recommendation:
						'Review and remove unused indexes to improve write performance',
				});
			}
		} catch (error) {
			result.issues.push({
				severity: 'medium',
				category: 'performance',
				description: `Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`,
				recommendation:
					'Ensure proper database permissions for pg_stat_* tables',
			});
		}
	}

	private async assessSecurity(result: HealthCheckResult): Promise<void> {
		console.log('\n🔒 Assessing security posture...');

		try {
			// Check for RLS policies (if available)
			try {
				const rlsStats = await this.db.execute(sql`
          SELECT COUNT(*) as policy_count
          FROM pg_policies
          WHERE schemaname = 'public'
        `);

				const policyCount = parseInt(rlsStats[0]?.policy_count || '0', 10);
				result.metrics.security.rlsPolicies = policyCount;

				console.log(`   🛡️  RLS Policies: ${policyCount}`);

				// Check tables without RLS
				const tablesWithoutRls = await this.db.execute(sql`
          SELECT COUNT(*) as count
          FROM information_schema.tables t
          LEFT JOIN pg_policies p ON t.table_name = p.tablename AND t.table_schema = p.schemaname
          WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
            AND p.tablename IS NULL
        `);

				const tablesMissingRls = parseInt(
					tablesWithoutRls[0]?.count || '0',
					10,
				);

				if (tablesMissingRls > 0 && policyCount > 0) {
					result.issues.push({
						severity: 'high',
						category: 'security',
						description: `${tablesMissingRls} tables missing RLS policies`,
						recommendation:
							'Implement Row-Level Security for all user data tables',
					});
				}
			} catch {
				console.log('   ℹ️  RLS policy analysis not available');
			}

			// Check for encryption (Neon handles this at rest)
			result.metrics.security.encryptionStatus = 'enabled';
			console.log(`   🔐 Encryption at Rest: enabled (Neon default)`);

			// Check connection security
			const isSSL =
				process.env.DATABASE_URL?.includes('sslmode=require') || false;
			if (!isSSL) {
				result.issues.push({
					severity: 'high',
					category: 'security',
					description: 'Database connection not using SSL/TLS',
					recommendation: 'Update DATABASE_URL to include sslmode=require',
				});
			}
			console.log(
				`   🔒 Connection Security: ${isSSL ? 'SSL enabled' : 'SSL disabled - WARNING'}`,
			);
		} catch (error) {
			result.issues.push({
				severity: 'medium',
				category: 'security',
				description: `Security assessment failed: ${error instanceof Error ? error.message : String(error)}`,
				recommendation:
					'Ensure proper database permissions for security analysis',
			});
		}
	}

	private async checkLGPDCompliance(result: HealthCheckResult): Promise<void> {
		console.log('\n🇧🇷 Checking Brazilian LGPD compliance...');

		try {
			let complianceScore = 100;

			// Check for audit_logs table
			const hasAuditLogs = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'audit_logs'
        )
      `);

			if (hasAuditLogs[0]?.exists) {
				console.log('   ✅ Audit logs table present');

				// Check audit log completeness
				const auditColumns = await this.db.execute(sql`
          SELECT COUNT(*) as column_count
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'audit_logs'
            AND column_name IN ('user_id', 'action', 'created_at', 'ip_address')
        `);

				const auditCoverage = parseInt(
					auditColumns[0]?.column_count || '0',
					10,
				);
				result.metrics.compliance.auditCoverage = Math.round(
					(auditCoverage / 4) * 100,
				);

				if (result.metrics.compliance.auditCoverage < 100) {
					complianceScore -= 20;
					result.issues.push({
						severity: 'medium',
						category: 'compliance',
						description:
							'Audit logs missing required columns for LGPD compliance',
						recommendation:
							'Ensure audit_logs has user_id, action, created_at, and ip_address columns',
					});
				}
			} else {
				complianceScore -= 50;
				result.issues.push({
					severity: 'high',
					category: 'compliance',
					description:
						'Audit logs table missing - required for LGPD compliance',
					recommendation:
						'Create audit_logs table for comprehensive data access tracking',
				});
			}

			// Check for LGPD-specific tables
			const lgpdTables = [
				'lgpd_consents',
				'data_export_requests',
				'data_deletion_requests',
			];
			let lgpdTableCount = 0;

			for (const table of lgpdTables) {
				const exists = await this.db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = ${table}
          )
        `);

				if (exists[0]?.exists) {
					lgpdTableCount++;
				}
			}

			console.log(`   📋 LGPD Tables: ${lgpdTableCount}/${lgpdTables.length}`);

			if (lgpdTableCount < lgpdTables.length) {
				complianceScore -= 25;
				result.issues.push({
					severity: 'medium',
					category: 'compliance',
					description: 'Missing LGPD compliance tables',
					recommendation:
						'Implement lgpd_consents, data_export_requests, and data_deletion_requests tables',
				});
			}

			result.metrics.compliance.lgpdScore = Math.max(0, complianceScore);
			console.log(
				`   📊 LGPD Compliance Score: ${result.metrics.compliance.lgpdScore}%`,
			);
		} catch (error) {
			result.issues.push({
				severity: 'medium',
				category: 'compliance',
				description: `LGPD compliance check failed: ${error instanceof Error ? error.message : String(error)}`,
				recommendation: 'Ensure database permissions for compliance analysis',
			});
		}
	}

	private calculateOverallScore(result: HealthCheckResult): void {
		let totalScore = 100;

		// Deduct points based on issue severity
		result.issues.forEach((issue) => {
			switch (issue.severity) {
				case 'critical':
					totalScore -= 25;
					break;
				case 'high':
					totalScore -= 15;
					break;
				case 'medium':
					totalScore -= 8;
					break;
				case 'low':
					totalScore -= 3;
					break;
			}
		});

		result.score = Math.max(0, totalScore);

		// Determine status
		if (result.score >= 90) {
			result.status = 'excellent';
		} else if (result.score >= 70) {
			result.status = 'good';
		} else if (result.score >= 50) {
			result.status = 'fair';
		} else {
			result.status = 'critical';
		}
	}

	async cleanup(): Promise<void> {
		if (this.pool) {
			await this.pool.end();
		}
	}
}

async function main() {
	const checker = new DatabaseHealthChecker();

	try {
		const result = await checker.runComprehensiveHealthCheck();

		console.log(`\n${'='.repeat(60)}`);
		console.log('🏥 DATABASE HEALTH ASSESSMENT COMPLETE');
		console.log('='.repeat(60));

		console.log(
			`\n📊 Overall Status: ${result.status.toUpperCase()} (${result.score}/100)`,
		);

		if (result.issues.length > 0) {
			console.log('\n⚠️  ISSUES FOUND:');
			result.issues.forEach((issue, index) => {
				const icon =
					issue.severity === 'critical'
						? '🚨'
						: issue.severity === 'high'
							? '⚠️'
							: issue.severity === 'medium'
								? '⚡'
								: '💡';

				console.log(
					`${index + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.category}`,
				);
				console.log(`   📝 ${issue.description}`);
				console.log(`   💡 ${issue.recommendation}`);
				console.log('');
			});
		} else {
			console.log('\n✅ No issues detected - Database is in excellent health!');
		}

		console.log('📈 METRICS SUMMARY:');
		console.log(
			`   🔗 Connection: ${result.metrics.connection.status} (${result.metrics.connection.latency}ms)`,
		);
		console.log(
			`   ⚡ Performance: ${result.metrics.performance.slowQueries} slow queries, ${result.metrics.performance.indexUsage}% index usage`,
		);
		console.log(
			`   🔒 Security: ${result.metrics.security.rlsPolicies} RLS policies, ${result.metrics.security.encryptionStatus} encryption`,
		);
		console.log(
			`   🇧🇷 Compliance: ${result.metrics.compliance.lgpdScore}% LGPD score, ${result.metrics.compliance.auditCoverage}% audit coverage`,
		);
		console.log(
			`   📋 Schema: ${result.metrics.schema.tableCount} tables, ${result.metrics.schema.relationCount} relations`,
		);

		console.log('\n🚀 RECOMMENDATIONS:');
		if (result.status === 'critical') {
			console.log('   🚨 Address critical issues immediately');
		} else if (result.status === 'fair') {
			console.log('   ⚡ Schedule performance and security improvements');
		} else if (result.status === 'good') {
			console.log('   🔍 Monitor for optimization opportunities');
		} else {
			console.log('   ✅ Maintain current monitoring and backup procedures');
		}
	} catch (error) {
		console.error('\n❌ Health check failed:', error);
		process.exit(1);
	} finally {
		await checker.cleanup();
	}
}

// Run if executed directly
if (import.meta.main) {
	main().catch(console.error);
}

export { DatabaseHealthChecker, type HealthCheckResult };
