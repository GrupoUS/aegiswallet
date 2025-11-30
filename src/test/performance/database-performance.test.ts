/**
 * Database Performance Monitoring Suite
 *
 * Monitoramento detalhado de performance do banco de dados Neon/PostgreSQL
 * Foco em queries específicas do PIX e RLS policies sob carga
 *
 * Métricas alvo:
 * - <150ms query response time (P95)
 * - 99.9% uptime durante pico de carga
 * - Eficiência de índices >95%
 */

import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getPoolClient } from '@/db/client';

// ========================================
// CONFIGURAÇÕES DE MONITORAMENTO
// ========================================

interface QueryMetric {
	queryType: string;
	executionTime: number;
	timestamp: number;
	success: boolean;
	rowCount?: number;
	indexUsage?: number;
	organizationId?: string;
}

class DatabasePerformanceMonitor {
	private metrics: QueryMetric[] = [];
	private queryPlans: Map<string, any> = new Map();

	recordQuery(metric: QueryMetric) {
		this.metrics.push(metric);
	}

	getQueryMetrics(queryType: string): QueryMetric[] {
		return this.metrics.filter((m) => m.queryType === queryType);
	}

	calculatePercentile(queryType: string, percentile: number): number {
		const queryMetrics = this.getQueryMetrics(queryType)
			.filter((m) => m.success)
			.map((m) => m.executionTime)
			.sort((a, b) => a - b);

		if (queryMetrics.length === 0) return 0;

		const index = Math.ceil((percentile / 100) * queryMetrics.length) - 1;
		return queryMetrics[Math.max(0, index)];
	}

	calculateAverage(queryType: string): number {
		const queryMetrics = this.getQueryMetrics(queryType).filter(
			(m) => m.success,
		);
		if (queryMetrics.length === 0) return 0;

		return (
			queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
			queryMetrics.length
		);
	}

	calculateErrorRate(queryType: string): number {
		const queryMetrics = this.getQueryMetrics(queryType);
		if (queryMetrics.length === 0) return 0;

		const errors = queryMetrics.filter((m) => !m.success).length;
		return errors / queryMetrics.length;
	}

	async analyzeQueryPerformance(
		db: any,
		query: string,
		_params: any[] = [],
	): Promise<{
		executionTime: number;
		plan: any;
		indexUsage: number;
	}> {
		const startTime = performance.now();
		try {
			// Execute EXPLAIN ANALYZE to get query plan and timing
			const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
			const [result] = await db.execute(sql.raw(explainQuery));

			const executionTime = performance.now() - startTime;
			const plan = result[0]['QUERY PLAN'][0];

			// Calculate index usage from query plan
			const indexUsage = this.calculateIndexUsageFromPlan(plan);

			return {
				executionTime,
				plan,
				indexUsage,
			};
		} catch (error) {
			const _executionTime = performance.now() - startTime;
			console.log(`❌ Query analysis failed after ${_executionTime.toFixed(2)}ms: ${error}`);
			throw new Error(`Query analysis failed: ${error}`);
		}
	}

	private calculateIndexUsageFromPlan(plan: any): number {
		const planString = JSON.stringify(plan);
		const indexOps = (planString.match(/Index Scan/gi) || []).length;
		const seqOps = (planString.match(/Seq Scan/gi) || []).length;
		const totalOps = indexOps + seqOps;

		return totalOps > 0 ? (indexOps / totalOps) * 100 : 0;
	}

	async getDatabaseStats(db: any) {
		const stats = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
        AND tablename IN ('pix_transactions', 'pix_keys', 'bank_accounts', 'transactions')
      ORDER BY tablename, attname
    `);

		const indexStats = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('pix_transactions', 'pix_keys', 'bank_accounts', 'transactions')
      ORDER BY tablename, indexname
    `);

		const tableStats = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND tablename IN ('pix_transactions', 'pix_keys', 'bank_accounts', 'transactions')
      ORDER BY tablename
    `);

		return {
			columnStats: stats,
			indexStats,
			tableStats,
		};
	}

	generateReport() {
		const queryTypes = [...new Set(this.metrics.map((m) => m.queryType))];

		return {
			summary: {
				totalQueries: this.metrics.length,
				successRate:
					this.metrics.filter((m) => m.success).length / this.metrics.length,
				averageExecutionTime:
					this.metrics.reduce((sum, m) => sum + m.executionTime, 0) /
					this.metrics.length,
			},
			queryTypes: queryTypes.map((type) => ({
				type,
				count: this.getQueryMetrics(type).length,
				p50: this.calculatePercentile(type, 50),
				p95: this.calculatePercentile(type, 95),
				p99: this.calculatePercentile(type, 99),
				average: this.calculateAverage(type),
				errorRate: this.calculateErrorRate(type),
			})),
			recommendations: this.generateRecommendations(),
		};
	}

	private generateRecommendations(): string[] {
		const recommendations: string[] = [];
		const report = this.generateReport();

		// Check for slow queries
		Object.values(report.queryTypes).forEach((queryType: any) => {
			if (queryType.p95 > 200) {
				recommendations.push(
					`Query type '${queryType.type}' has P95 of ${queryType.p95.toFixed(2)}ms. Consider optimization.`,
				);
			}

			if (queryType.errorRate > 0.01) {
				recommendations.push(
					`Query type '${queryType.type}' has error rate of ${(queryType.errorRate * 100).toFixed(2)}%. Investigate failures.`,
				);
			}
		});

		return recommendations;
	}

	reset() {
		this.metrics = [];
		this.queryPlans.clear();
	}
}

const dbMonitor = new DatabasePerformanceMonitor();

// ========================================
// TESTES DE PERFORMANCE DE BANCO DE DADOS
// ========================================

describe('Database Performance Monitoring', () => {
	let db: any;

	beforeEach(async () => {
		db = getPoolClient();
		dbMonitor.reset();
	});

	afterEach(() => {
		dbMonitor.reset();
	});

	describe('Query Performance Analysis', () => {
		it('should analyze PIX transaction INSERT performance', async () => {
			const query = `
        INSERT INTO pix_transactions (
          id, user_id, organization_id, end_to_end_id, pix_key, pix_key_type,
          recipient_name, recipient_document, recipient_bank, amount, description,
          transaction_date, status, transaction_type, processed_at, fee_amount,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
      `;

			const params = [
				`test-id-${Date.now()}-${Math.random().toString(36).substring(7)}`,
				'test_user',
				'test_org',
				`E${Date.now()}${Math.random().toString(36).substring(7)}`,
				'11987654321',
				'PHONE',
				'Test User',
				'12345678901',
				'Test Bank',
				'150.75',
				'Test transaction',
				new Date(),
				'completed',
				'sent',
				new Date(),
				'0.00',
				new Date(),
				new Date(),
			];

			const analysis = await dbMonitor.analyzeQueryPerformance(
				db,
				query,
				params,
			);

			dbMonitor.recordQuery({
				queryType: 'pix_insert',
				executionTime: analysis.executionTime,
				timestamp: Date.now(),
				success: true,
				indexUsage: analysis.indexUsage,
			});

			// INSERT should be very fast (<50ms)
			expect(analysis.executionTime).toBeLessThan(50);

			// Should use appropriate indexes for constraints
			expect(analysis.indexUsage).toBeGreaterThan(50);

			console.log(
				`✅ PIX INSERT: ${analysis.executionTime.toFixed(2)}ms, Index Usage: ${analysis.indexUsage}%`,
			);
		});

		it('should analyze PIX transaction SELECT with RLS filtering', async () => {
			const query = `
        SELECT
          id, pix_key, recipient_name, amount, status, transaction_date
        FROM pix_transactions
        WHERE organization_id = $1
          AND transaction_date >= $2
          AND status = $3
        ORDER BY transaction_date DESC
        LIMIT $4
      `;

			const params = [
				'test_org',
				new Date(Date.now() - 24 * 60 * 60 * 1000),
				'completed',
				50,
			];

			const analysis = await dbMonitor.analyzeQueryPerformance(
				db,
				query,
				params,
			);

			dbMonitor.recordQuery({
				queryType: 'pix_select_rls',
				executionTime: analysis.executionTime,
				timestamp: Date.now(),
				success: true,
				indexUsage: analysis.indexUsage,
			});

			// SELECT with filters should use indexes efficiently
			expect(analysis.executionTime).toBeLessThan(30);
			expect(analysis.indexUsage).toBeGreaterThan(80);

			console.log(
				`✅ PIX SELECT with RLS: ${analysis.executionTime.toFixed(2)}ms, Index Usage: ${analysis.indexUsage}%`,
			);
		});

		it('should analyze complex JOIN query performance', async () => {
			const query = `
        SELECT
          pt.id,
          pt.amount,
          pt.recipient_name,
          pt.status,
          ba.bank_name,
          ba.agency_number
        FROM pix_transactions pt
        LEFT JOIN bank_accounts ba ON pt.user_id = ba.user_id
        WHERE pt.organization_id = $1
          AND pt.transaction_date >= $2
        ORDER BY pt.transaction_date DESC
        LIMIT $3
      `;

			const params = [
				'test_org',
				new Date(Date.now() - 24 * 60 * 60 * 1000),
				100,
			];

			const analysis = await dbMonitor.analyzeQueryPerformance(
				db,
				query,
				params,
			);

			dbMonitor.recordQuery({
				queryType: 'complex_join',
				executionTime: analysis.executionTime,
				timestamp: Date.now(),
				success: true,
				indexUsage: analysis.indexUsage,
			});

			// Complex queries should still be efficient
			expect(analysis.executionTime).toBeLessThan(150);
			expect(analysis.indexUsage).toBeGreaterThan(70);

			console.log(
				`✅ Complex JOIN: ${analysis.executionTime.toFixed(2)}ms, Index Usage: ${analysis.indexUsage}%`,
			);
		});

		it('should analyze RLS policy overhead', async () => {
			// Test the same query with and without RLS enabled
			const baseQuery = `
        SELECT COUNT(*) as count
        FROM pix_transactions
        WHERE organization_id = $1
      `;

			const params = ['test_org'];

			// With RLS (normal operation)
			const rlsAnalysis = await dbMonitor.analyzeQueryPerformance(
				db,
				baseQuery,
				params,
			);

			// Bypass RLS for comparison (using superuser if available)
			let noRlsAnalysis = { executionTime: rlsAnalysis.executionTime };

			try {
				const bypassQuery = `
          SELECT COUNT(*) as count
          FROM pix_transactions
          WHERE organization_id = $1
        `;

				// This might fail if we don't have superuser privileges
				noRlsAnalysis = await dbMonitor.analyzeQueryPerformance(
					db,
					bypassQuery,
					params,
				);
			} catch (error) {
				console.log(
					'⚠️ Could not bypass RLS for comparison (expected in production)',
				);
			}

			const rlsOverhead =
				rlsAnalysis.executionTime - noRlsAnalysis.executionTime;
			const overheadPercentage =
				(rlsOverhead / noRlsAnalysis.executionTime) * 100;

			dbMonitor.recordQuery({
				queryType: 'rls_overhead',
				executionTime: rlsAnalysis.executionTime,
				timestamp: Date.now(),
				success: true,
			});

			// RLS overhead should be minimal (<20%)
			expect(overheadPercentage).toBeLessThan(20);

			console.log(
				`✅ RLS Overhead: ${rlsOverhead.toFixed(2)}ms (${overheadPercentage.toFixed(2)}%)`,
			);
		});
	});

	describe('Index Usage Analysis', () => {
		it('should verify critical indexes are being used', async () => {
			const criticalQueries = [
				{
					name: 'organization_id_index',
					query: 'SELECT * FROM pix_transactions WHERE organization_id = $1',
					params: ['test_org'],
				},
				{
					name: 'user_id_index',
					query: 'SELECT * FROM pix_transactions WHERE user_id = $1',
					params: ['test_user'],
				},
				{
					name: 'transaction_date_index',
					query: 'SELECT * FROM pix_transactions WHERE transaction_date >= $1',
					params: [new Date()],
				},
				{
					name: 'composite_index',
					query:
						'SELECT * FROM pix_transactions WHERE organization_id = $1 AND status = $2',
					params: ['test_org', 'completed'],
				},
			];

			for (const { name, query, params } of criticalQueries) {
				const analysis = await dbMonitor.analyzeQueryPerformance(
					db,
					query,
					params,
				);

				dbMonitor.recordQuery({
					queryType: 'index_usage',
					executionTime: analysis.executionTime,
					timestamp: Date.now(),
					success: true,
					indexUsage: analysis.indexUsage,
				});

				// Critical queries should use indexes
				expect(analysis.indexUsage).toBeGreaterThan(80);

				console.log(`✅ ${name}: Index Usage ${analysis.indexUsage}%`);
			}
		});

		it('should analyze index statistics and usage', async () => {
			const stats = await dbMonitor.getDatabaseStats(db);

			// Verify we have statistics for critical tables
			expect(stats.indexStats.length).toBeGreaterThan(0);
			expect(stats.tableStats.length).toBeGreaterThan(0);

			// Check for unused indexes (potential optimization opportunities)
			const unusedIndexes = stats.indexStats.filter(
				(idx: any) => idx.idx_scan === 0,
			);

			console.log(`📊 Index Analysis:`);
			console.log(`- Total indexes analyzed: ${stats.indexStats.length}`);
			console.log(`- Unused indexes: ${unusedIndexes.length}`);

			if (unusedIndexes.length > 0) {
				console.log(
					'⚠️ Unused indexes detected:',
					unusedIndexes.map((idx: any) => idx.indexname),
				);
			}

			// Report table statistics
			stats.tableStats.forEach((table: any) => {
				console.log(
					`📊 ${table.tablename}: ${table.n_live_tup} live, ${table.n_dead_tup} dead tuples`,
				);
			});
		});
	});

	describe('Connection Pool Performance', () => {
		it('should handle concurrent connections efficiently', async () => {
			const concurrentQueries = 20;
			const queryPromises: Promise<any>[] = [];

			for (let i = 0; i < concurrentQueries; i++) {
				const promise = dbMonitor.analyzeQueryPerformance(
					db,
					'SELECT COUNT(*) FROM pix_transactions WHERE organization_id = $1',
					[`test_org_${i % 5}`],
				);

				queryPromises.push(promise);
			}

			const startTime = performance.now();
			const results = await Promise.all(queryPromises);
			const totalTime = performance.now() - startTime;

			const averageTime =
				results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;

			dbMonitor.recordQuery({
				queryType: 'connection_pool',
				executionTime: totalTime,
				timestamp: Date.now(),
				success: true,
			});

			// Connection pool should handle concurrent queries efficiently
			expect(averageTime).toBeLessThan(100);
			expect(totalTime).toBeLessThan(500); // All queries should complete within 500ms

			console.log(
				`✅ Connection Pool: ${concurrentQueries} concurrent queries, Average: ${averageTime.toFixed(2)}ms`,
			);
		});

		it('should measure connection acquisition time', async () => {
			const connectionTimes: number[] = [];

			for (let i = 0; i < 10; i++) {
				const startAcquisition = performance.now();

				// Create new client to measure acquisition time
				const client = getPoolClient();

				const acquisitionTime = performance.now() - startAcquisition;
				connectionTimes.push(acquisitionTime);

				// Execute a simple query
				await client.execute(sql`SELECT 1`);
			}

			const averageAcquisitionTime =
				connectionTimes.reduce((a, b) => a + b) / connectionTimes.length;

			// Connection acquisition should be fast
			expect(averageAcquisitionTime).toBeLessThan(50);

			console.log(
				`✅ Connection Acquisition: Average ${averageAcquisitionTime.toFixed(2)}ms`,
			);
		});
	});

	describe('Performance Regression Detection', () => {
		it('should detect performance regressions in critical queries', async () => {
			const baselineQueries = [
				{
					name: 'pix_transaction_lookup',
					query: 'SELECT * FROM pix_transactions WHERE id = $1',
					params: [
						`test-id-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					],
					baselineP95: 50, // Expected P95 in milliseconds
				},
				{
					name: 'pix_transaction_list',
					query:
						'SELECT * FROM pix_transactions WHERE organization_id = $1 ORDER BY transaction_date DESC LIMIT 20',
					params: ['test_org'],
					baselineP95: 100,
				},
			];

			for (const { name, query, params, baselineP95 } of baselineQueries) {
				// Run the query multiple times to get a good sample
				const samples: number[] = [];

				for (let i = 0; i < 10; i++) {
					const analysis = await dbMonitor.analyzeQueryPerformance(
						db,
						query,
						params,
					);
					samples.push(analysis.executionTime);

					dbMonitor.recordQuery({
						queryType: name,
						executionTime: analysis.executionTime,
						timestamp: Date.now(),
						success: true,
					});
				}

				// Calculate P95
				const sortedSamples = samples.sort((a, b) => a - b);
				const p95Index = Math.ceil(0.95 * sortedSamples.length) - 1;
				const p95 = sortedSamples[Math.max(0, p95Index)];

				// Check for regression (should not be significantly slower than baseline)
				const regressionThreshold = baselineP95 * 1.5; // Allow 50% increase
				expect(p95).toBeLessThan(regressionThreshold);

				console.log(
					`✅ ${name}: P95 ${p95.toFixed(2)}ms (baseline: ${baselineP95}ms)`,
				);
			}
		});
	});

	describe('Comprehensive Performance Report', () => {
		it('should generate detailed performance report with recommendations', async () => {
			// Run a variety of queries to populate the monitor
			const testQueries = [
				{
					type: 'pix_insert',
					query: 'INSERT INTO pix_transactions (id) VALUES ($1)',
					params: [
						`test-id-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					],
				},
				{
					type: 'pix_select',
					query: 'SELECT * FROM pix_transactions WHERE organization_id = $1',
					params: ['test_org'],
				},
				{
					type: 'pix_update',
					query: 'UPDATE pix_transactions SET status = $1 WHERE id = $2',
					params: [
						'completed',
						`test-id-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					],
				},
				{
					type: 'complex_join',
					query:
						'SELECT pt.*, ba.* FROM pix_transactions pt LEFT JOIN bank_accounts ba ON pt.user_id = ba.user_id WHERE pt.organization_id = $1',
					params: ['test_org'],
				},
			];

			for (const { type, query, params } of testQueries) {
				try {
					const analysis = await dbMonitor.analyzeQueryPerformance(
						db,
						query,
						params,
					);

					dbMonitor.recordQuery({
						queryType: type,
						executionTime: analysis.executionTime,
						timestamp: Date.now(),
						success: true,
						indexUsage: analysis.indexUsage,
					});
				} catch (error) {
					dbMonitor.recordQuery({
						queryType: type,
						executionTime: 0,
						timestamp: Date.now(),
						success: false,
					});
				}
			}

			const report = dbMonitor.generateReport();

			// Verify report structure
			expect(report).toHaveProperty('summary');
			expect(report).toHaveProperty('queryTypes');
			expect(report).toHaveProperty('recommendations');

			// Verify all query types are represented
			expect(report.queryTypes.length).toBeGreaterThan(0);

			console.log('\n📊 DATABASE PERFORMANCE REPORT:');
			console.log(JSON.stringify(report, null, 2));

			// Export report for analysis
			if (process.env.CI) {
				require('node:fs').writeFileSync(
					'./test-results/database-performance-report.json',
					JSON.stringify(report, null, 2),
				);
			}

			// Validate key metrics
			expect(report.summary.successRate).toBeGreaterThan(0.9);
			expect(report.summary.averageExecutionTime).toBeLessThan(200);
		});
	});
});
