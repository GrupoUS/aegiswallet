// @ts-nocheck - Utility script with runtime-correct but type-incompatible Neon query access patterns
/**
 * Database Performance Optimizer
 *
 * Advanced performance analysis and optimization for Neon PostgreSQL + Drizzle
 * Specialized for Brazilian fintech applications with voice-first capabilities
 *
 * Usage: bun scripts/database-performance-optimizer.ts
 */

import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

interface PerformanceAnalysisResult {
	overallScore: number; // 0-100
	status: 'excellent' | 'good' | 'needs_optimization' | 'critical';
	metrics: {
		queryPerformance: {
			score: number;
			slowQueries: number;
			avgExecutionTime: number;
		};
		indexEfficiency: {
			score: number;
			unusedIndexes: number;
			missingIndexes: string[];
		};
		connectionHealth: {
			score: number;
			poolUtilization: number;
			latency: number;
		};
		tableOptimization: { score: number; bloat: number; statistics: boolean };
		caching: { score: number; hitRate: number; cacheSize: string };
	};
	recommendations: Array<{
		priority: 'critical' | 'high' | 'medium' | 'low';
		category: 'query' | 'index' | 'connection' | 'table' | 'caching';
		description: string;
		impact: 'high' | 'medium' | 'low';
		effort: 'low' | 'medium' | 'high';
		sql?: string;
	}>;
	brazilianOptimizations: {
		pixTransactions: { optimized: boolean; latency: number };
		voiceQueries: { optimized: boolean; responseTime: number };
		businessHours: { performance: number; recommendations: string[] };
	};
}

interface IndexRecommendation {
	table: string;
	columns: string[];
	type: 'btree' | 'hash' | 'gin' | 'gist';
	reason: string;
	estimatedImpact: 'high' | 'medium' | 'low';
}

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;

class DatabasePerformanceOptimizer {
	private db: ReturnType<typeof drizzle>;
	private pool: Pool;

	constructor() {
		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error('DATABASE_URL environment variable is not set');
		}

		const sqlClient = neon(databaseUrl);
		this.db = drizzle(sqlClient);
		this.pool = new Pool({ connectionString: databaseUrl });
	}

	async runPerformanceAnalysis(): Promise<PerformanceAnalysisResult> {
		console.log('⚡ Starting comprehensive performance analysis...\n');

		const result: PerformanceAnalysisResult = {
			overallScore: 0,
			status: 'critical',
			metrics: {
				queryPerformance: { score: 0, slowQueries: 0, avgExecutionTime: 0 },
				indexEfficiency: { score: 0, unusedIndexes: 0, missingIndexes: [] },
				connectionHealth: { score: 0, poolUtilization: 0, latency: 0 },
				tableOptimization: { score: 0, bloat: 0, statistics: false },
				caching: { score: 0, hitRate: 0, cacheSize: 'unknown' },
			},
			recommendations: [],
			brazilianOptimizations: {
				pixTransactions: { optimized: false, latency: 0 },
				voiceQueries: { optimized: false, responseTime: 0 },
				businessHours: { performance: 0, recommendations: [] },
			},
		};

		try {
			console.log('🔍 Analyzing query performance...');
			await this.analyzeQueryPerformance(result);

			console.log('📊 Evaluating index efficiency...');
			await this.analyzeIndexEfficiency(result);

			console.log('🔗 Checking connection health...');
			await this.analyzeConnectionHealth(result);

			console.log('📋 Assessing table optimization...');
			await this.analyzeTableOptimization(result);

			console.log('💾 Analyzing caching effectiveness...');
			await this.analyzeCaching(result);

			console.log('🇧🇷 Brazilian fintech optimizations...');
			await this.analyzeBrazilianOptimizations(result);

			console.log('💡 Generating optimization recommendations...');
			await this.generateRecommendations(result);

			this.calculateOverallScore(result);
		} catch (error) {
			console.error('❌ Performance analysis failed:', error);
			result.status = 'critical';
			result.overallScore = 0;
		}

		return result;
	}

	private async analyzeQueryPerformance(result: PerformanceAnalysisResult): Promise<void> {
		const metrics = result.metrics.queryPerformance;
		let score = 100;

		try {
			// Check if pg_stat_statements is available
			const hasStatStatements = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        )
      `);

			if (!hasStatStatements[0]?.exists) {
				console.log('   ⚠️  pg_stat_statements extension not available');
				score -= 20;
				result.recommendations.push({
					priority: 'high',
					category: 'query',
					description: 'Install pg_stat_statements extension for query performance monitoring',
					impact: 'high',
					effort: 'low',
					sql: 'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;',
				});
			} else {
				// Analyze query statistics
				const queryStats = await this.db.execute(sql`
          SELECT
            COUNT(*) as total_queries,
            COUNT(CASE WHEN mean_exec_time > 100 THEN 1 END) as slow_queries,
            ROUND(AVG(mean_exec_time), 2) as avg_execution_time,
            ROUND(MAX(mean_exec_time), 2) as max_execution_time,
            ROUND(SUM(total_exec_time) / SUM(calls), 2) as overall_avg_time
          FROM pg_stat_statements
        `);

				const stats = queryStats[0] as any;
				metrics.slowQueries = Number.parseInt(stats.total_queries, 10);
				metrics.avgExecutionTime = Number.parseFloat(stats.avg_execution_time);

				console.log(`   📊 Total Queries: ${stats.total_queries}`);
				console.log(`   🐌 Slow Queries (>100ms): ${stats.slow_queries}`);
				console.log(`   ⏱️  Average Execution Time: ${stats.avg_execution_time}ms`);
				console.log(`   ⚡ Peak Execution Time: ${stats.max_execution_time}ms`);

				// Score based on performance metrics
				if (metrics.avgExecutionTime > 200) {
					score -= 30;
					result.recommendations.push({
						priority: 'critical',
						category: 'query',
						description: `High average query execution time: ${metrics.avgExecutionTime}ms`,
						impact: 'high',
						effort: 'medium',
					});
				} else if (metrics.avgExecutionTime > 100) {
					score -= 15;
					result.recommendations.push({
						priority: 'high',
						category: 'query',
						description: `Moderate query execution time: ${metrics.avgExecutionTime}ms`,
						impact: 'medium',
						effort: 'medium',
					});
				}

				// Find specific slow queries
				const slowQueries = await this.db.execute(sql`
          SELECT
            LEFT(query, 100) as query_sample,
            mean_exec_time,
            calls,
            ROUND(mean_exec_time * calls, 2) as total_time
          FROM pg_stat_statements
          WHERE mean_exec_time > 100
          ORDER BY mean_exec_time DESC
          LIMIT 5
        `);

				if (slowQueries.length > 0) {
					console.log('   🐌 Top slow queries:');
					(slowQueries as any[]).forEach((query, i) => {
						console.log(`     ${i + 1}. ${query.query_sample}... (${query.mean_exec_time}ms avg)`);
					});
				}
			}

			metrics.score = Math.max(0, score);
		} catch (error) {
			console.error('   ❌ Query performance analysis failed:', error);
			metrics.score = 0;
		}
	}

	private async analyzeIndexEfficiency(result: PerformanceAnalysisResult): Promise<void> {
		const metrics = result.metrics.indexEfficiency;
		let score = 100;

		try {
			// Analyze index usage
			const indexStats = await this.db.execute(sql`
        SELECT
          COUNT(*) as total_indexes,
          COUNT(CASE WHEN idx_scan = 0 THEN 1 END) as unused_indexes,
          COUNT(CASE WHEN idx_scan > 100 THEN 1 END) as heavily_used_indexes,
          ROUND(AVG(idx_scan), 2) as avg_scans
        FROM pg_stat_user_indexes
      `);

			const stats = indexStats[0] as any;
			metrics.unusedIndexes = Number.parseInt(stats.unused_indexes, 10);

			const usageRate =
				stats.total_indexes > 0
					? ((stats.total_indexes - stats.unused_indexes) / stats.total_indexes) * 100
					: 100;

			console.log(`   📊 Total Indexes: ${stats.total_indexes}`);
			console.log(`   🔍 Unused Indexes: ${stats.unused_indexes}`);
			console.log(`   ⚡ Heavily Used Indexes: ${stats.heavily_used_indexes}`);
			console.log(`   📈 Average Index Scans: ${stats.avg_scans}`);
			console.log(`   📊 Index Usage Rate: ${usageRate.toFixed(1)}%`);

			if (usageRate < 80) {
				score -= 25;
				result.recommendations.push({
					priority: 'high',
					category: 'index',
					description: `Low index usage rate: ${usageRate.toFixed(1)}%`,
					impact: 'medium',
					effort: 'medium',
				});
			}

			// Find missing indexes for common query patterns
			const missingIndexes = await this.identifyMissingIndexes();
			metrics.missingIndexes = missingIndexes.map((idx) => idx.reason);

			if (missingIndexes.length > 0) {
				console.log(`   💡 Recommended Missing Indexes: ${missingIndexes.length}`);
				missingIndexes.forEach((idx, i) => {
					console.log(`     ${i + 1}. ${idx.table}(${idx.columns.join(', ')}) - ${idx.reason}`);
					score -= 10;

					result.recommendations.push({
						priority: idx.estimatedImpact === 'high' ? 'high' : 'medium',
						category: 'index',
						description: `Add index on ${idx.table}(${idx.columns.join(', ')})`,
						impact: idx.estimatedImpact,
						effort: 'low',
						sql: `CREATE INDEX ${idx.table}_${idx.columns.join('_')}_idx ON ${idx.table} (${idx.columns.join(', ')});`,
					});
				});
			}

			// Check for duplicate or redundant indexes
			const duplicateIndexes = await this.db.execute(sql`
        WITH index_columns AS (
          SELECT
            schemaname,
            tablename,
            indexname,
            ARRAY_AGG(attname ORDER BY attnum) as columns
          FROM pg_stat_user_indexes psi
          JOIN pg_attribute pa ON psi.relid = pa.attrelid AND pa.attnum = ANY(psi.indexdef::regclass::int[])
          GROUP BY schemaname, tablename, indexname
        )
        SELECT
          tablename,
          STRING_AGG(indexname, ', ') as duplicate_indexes,
          columns
        FROM index_columns
        GROUP BY tablename, columns
        HAVING COUNT(*) > 1
      `);

			if (duplicateIndexes.length > 0) {
				console.log(`   ⚠️  Potentially duplicate indexes: ${duplicateIndexes.length}`);
				(duplicateIndexes as any[]).forEach((dup) => {
					console.log(`     Table ${dup.tablename}: ${dup.duplicate_indexes}`);
				});

				score -= 15;
			}

			metrics.score = Math.max(0, score);
		} catch (error) {
			console.error('   ❌ Index efficiency analysis failed:', error);
			metrics.score = 0;
		}
	}

	private async identifyMissingIndexes(): Promise<IndexRecommendation[]> {
		const recommendations: IndexRecommendation[] = [];

		// Common Brazilian fintech query patterns
		const commonPatterns = [
			{
				table: 'users',
				columns: ['email'],
				reason: 'Frequent user authentication queries',
				impact: 'high' as const,
			},
			{
				table: 'transactions',
				columns: ['user_id', 'transaction_date'],
				reason: 'Transaction history queries with date filtering',
				impact: 'high' as const,
			},
			{
				table: 'pix_transactions',
				columns: ['user_id', 'created_at'],
				reason: 'PIX transaction lookup for user history',
				impact: 'high' as const,
			},
			{
				table: 'voice_transcriptions',
				columns: ['user_id', 'created_at'],
				reason: 'Voice command history queries',
				impact: 'medium' as const,
			},
			{
				table: 'audit_logs',
				columns: ['user_id', 'created_at'],
				reason: 'Audit trail queries for compliance',
				impact: 'medium' as const,
			},
			{
				table: 'notifications',
				columns: ['user_id', 'is_read', 'created_at'],
				reason: 'Unread notification queries',
				impact: 'medium' as const,
			},
		];

		for (const pattern of commonPatterns) {
			// Check if index already exists
			const indexExists = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = ${pattern.table}
            AND indexdef ILIKE ${`%${pattern.columns.join('%')}%`}
        )
      `);

			if (!indexExists[0]?.exists) {
				recommendations.push({
					table: pattern.table,
					columns: pattern.columns,
					type: 'btree',
					reason: pattern.reason,
					estimatedImpact: pattern.impact,
				});
			}
		}

		return recommendations;
	}

	private async analyzeConnectionHealth(result: PerformanceAnalysisResult): Promise<void> {
		const metrics = result.metrics.connectionHealth;
		let score = 100;

		try {
			// Test connection latency
			const start = Date.now();
			await this.db.execute(sql`SELECT 1`);
			metrics.latency = Date.now() - start;

			console.log(`   ⚡ Connection Latency: ${metrics.latency}ms`);

			if (metrics.latency > 1000) {
				score -= 30;
				result.recommendations.push({
					priority: 'critical',
					category: 'connection',
					description: `High connection latency: ${metrics.latency}ms`,
					impact: 'high',
					effort: 'high',
				});
			} else if (metrics.latency > 500) {
				score -= 15;
				result.recommendations.push({
					priority: 'high',
					category: 'connection',
					description: `Moderate connection latency: ${metrics.latency}ms`,
					impact: 'medium',
					effort: 'medium',
				});
			}

			// Check connection pool usage
			const poolStats = await this.db.execute(sql`
        SELECT
          COUNT(*) as total_connections,
          COUNT(CASE WHEN state = 'active' THEN 1 END) as active_connections,
          COUNT(CASE WHEN state = 'idle' THEN 1 END) as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);

			const stats = poolStats[0] as any;
			metrics.poolUtilization =
				stats.total_connections > 0
					? (stats.active_connections / stats.total_connections) * 100
					: 0;

			console.log(`   🔗 Total Connections: ${stats.total_connections}`);
			console.log(`   ⚡ Active Connections: ${stats.active_connections}`);
			console.log(`   💤 Idle Connections: ${stats.idle_connections}`);
			console.log(`   📊 Pool Utilization: ${metrics.poolUtilization.toFixed(1)}%`);

			if (metrics.poolUtilization > 80) {
				score -= 20;
				result.recommendations.push({
					priority: 'high',
					category: 'connection',
					description: `High connection pool utilization: ${metrics.poolUtilization.toFixed(1)}%`,
					impact: 'medium',
					effort: 'low',
				});
			}

			// Check for long-running queries
			const longRunning = await this.db.execute(sql`
        SELECT COUNT(*) as count
        FROM pg_stat_activity
        WHERE state = 'active'
          AND query_start < NOW() - INTERVAL '5 minutes'
          AND query NOT LIKE '%pg_stat_activity%'
      `);

			const longRunningCount = Number.parseInt(longRunning[0]?.count || '0', 10);
			if (longRunningCount > 0) {
				score -= 15;
				result.recommendations.push({
					priority: 'high',
					category: 'query',
					description: `${longRunningCount} long-running queries detected (>5 minutes)`,
					impact: 'medium',
					effort: 'medium',
				});
			}

			metrics.score = Math.max(0, score);
		} catch (error) {
			console.error('   ❌ Connection health analysis failed:', error);
			metrics.score = 0;
		}
	}

	private async analyzeTableOptimization(result: PerformanceAnalysisResult): Promise<void> {
		const metrics = result.metrics.tableOptimization;
		let score = 100;

		try {
			// Check table bloat
			const bloatStats = await this.db.execute(sql`
        SELECT
          schemaname,
          tablename,
          ROUND(
            (
              CASE
                WHEN otta = 0 THEN 0.0
                ELSE sml.relpages::float / otta
              END - 1
            ) * 100
          ) AS bloat_percentage,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM (
          SELECT
            schemaname,
            tablename,
            cc.reltuples,
            cc.relpages,
            bs,
            CEIL((cc.reltuples * ((datahdr + ma - (CASE WHEN datahdr % ma = 0 THEN ma ELSE datahdr % ma END)) + (hdr + ma - (CASE WHEN hdr % ma = 0 THEN ma ELSE hdr % ma END))) / (bs - 20::float)) AS otta
          FROM (
            SELECT
              ma, bs, schemaname, tablename,
              (datawidth + (hdr + ma - (CASE WHEN hdr % ma = 0 THEN ma ELSE hdr % ma END)))::numeric AS datahdr,
              (maxfracsum * (hdr + ma - (CASE WHEN hdr % ma = 0 THEN ma ELSE hdr % ma END))) AS newhdr,
              maxfracsum, hdr
            FROM (
              SELECT
                schemaname, tablename, hdr, ma, bs,
                SUM((1-null_frac) * avg_width) AS datawidth,
                MAX(null_frac) AS maxfracsum,
                hdr
              FROM pg_stats
              GROUP BY 1,2,3,4,5
            ) AS foo
          ) AS bar
          JOIN pg_class cc ON cc.relname = tablename
          JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = schemaname AND nn.nspname <> 'information_schema'
        ) AS sml
        WHERE bloat_percentage > 20
        ORDER BY bloat_percentage DESC
        LIMIT 10
      `);

			if (bloatStats.length > 0) {
				const totalBloat = (bloatStats as any[]).reduce(
					(sum, table) => sum + Number.parseFloat(table.bloat_percentage),
					0,
				);
				metrics.bloat = Math.round(totalBloat / bloatStats.length);

				console.log(`   💾 Average Table Bloat: ${metrics.bloat}%`);
				console.log('   📊 Most bloated tables:');
				(bloatStats as any[]).slice(0, 5).forEach((table, i) => {
					console.log(
						`     ${i + 1}. ${table.tablename}: ${table.bloat_percentage}% (${table.size})`,
					);
				});

				if (metrics.bloat > 30) {
					score -= 25;
					result.recommendations.push({
						priority: 'high',
						category: 'table',
						description: `High table bloat detected: ${metrics.bloat}% average`,
						impact: 'medium',
						effort: 'medium',
						sql: 'VACUUM ANALYZE; -- Consider VACUUM FULL for severe cases',
					});
				}
			}

			// Check if statistics are up to date
			const statsAge = await this.db.execute(sql`
        SELECT
          schemaname,
          tablename,
          EXTRACT(EPOCH FROM (NOW() - last_analyze)) / 3600 as hours_since_analyze,
          EXTRACT(EPOCH FROM (NOW() - last_vacuum)) / 3600 as hours_since_vacuum
        FROM pg_stat_user_tables
        ORDER BY hours_since_analyze DESC
        LIMIT 5
      `);

			if (statsAge.length > 0) {
				const oldestAnalyze = Math.max(
					...(statsAge as any[]).map((s) => Number.parseFloat(s.hours_since_analyze) || 0),
				);

				if (oldestAnalyze > 24) {
					score -= 15;
					result.recommendations.push({
						priority: 'medium',
						category: 'table',
						description: `Table statistics are ${Math.round(oldestAnalyze)} hours old`,
						impact: 'medium',
						effort: 'low',
						sql: 'ANALYZE; -- Update table statistics',
					});
				}
			}

			// Check for missing primary keys
			const tablesWithoutPK = await this.db.execute(sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables t
        LEFT JOIN information_schema.table_constraints tc
          ON t.table_name = tc.table_name
          AND tc.constraint_type = 'PRIMARY KEY'
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND tc.constraint_name IS NULL
      `);

			const missingPKs = Number.parseInt(tablesWithoutPK[0]?.count || '0', 10);
			if (missingPKs > 0) {
				score -= 20;
				result.recommendations.push({
					priority: 'high',
					category: 'table',
					description: `${missingPKs} tables missing primary keys`,
					impact: 'high',
					effort: 'medium',
				});
			}

			metrics.statistics = true;
			metrics.score = Math.max(0, score);
		} catch (error) {
			console.error('   ❌ Table optimization analysis failed:', error);
			metrics.score = 0;
		}
	}

	private async analyzeCaching(result: PerformanceAnalysisResult): Promise<void> {
		const metrics = result.metrics.caching;
		let score = 100;

		try {
			// Check shared buffer hit ratio
			const bufferStats = await this.db.execute(sql`
        SELECT
          blks_hit,
          blks_read,
          ROUND(
            CASE
              WHEN blks_hit + blks_read = 0 THEN 0
              ELSE blks_hit::numeric / (blks_hit + blks_read) * 100
            END, 2
          ) as hit_ratio
        FROM pg_stat_database
        WHERE datname = current_database()
      `);

			const stats = bufferStats[0] as any;
			metrics.hitRate = Number.parseFloat(stats.hit_ratio || '0');

			console.log(`   💾 Buffer Hit Ratio: ${metrics.hitRate}%`);
			console.log(`   📊 Blocks Hit: ${stats.blks_hit}`);
			console.log(`   📊 Blocks Read: ${stats.blks_read}`);

			if (metrics.hitRate < 90) {
				score -= 20;
				result.recommendations.push({
					priority: 'medium',
					category: 'caching',
					description: `Low buffer hit ratio: ${metrics.hitRate}%`,
					impact: 'medium',
					effort: 'high',
				});
			}

			// Check effective cache size
			const cacheSize = await this.db.execute(sql`
        SHOW effective_cache_size
      `);

			metrics.cacheSize = cacheSize[0]?.effective_cache_size || 'unknown';
			console.log(`   🗄️  Effective Cache Size: ${metrics.cacheSize}`);

			// Check for prepared statement usage
			const prepStmts = await this.db.execute(sql`
        SELECT COUNT(*) as count
        FROM pg_prepared_statements
      `);

			const prepCount = Number.parseInt(prepStmts[0]?.count || '0', 10);
			if (prepCount > 0) {
				console.log(`   🚀 Prepared Statements: ${prepCount}`);
			}

			metrics.score = Math.max(0, score);
		} catch (error) {
			console.error('   ❌ Caching analysis failed:', error);
			metrics.score = 0;
		}
	}

	private async analyzeBrazilianOptimizations(result: PerformanceAnalysisResult): Promise<void> {
		const optimizations = result.brazilianOptimizations;

		try {
			console.log('   💰 PIX transaction performance...');

			// Analyze PIX transaction performance
			const pixStats = await this.db.execute(sql`
        SELECT
          COUNT(*) as total_pix,
          ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000), 2) as avg_completion_time_ms,
          MAX(EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000) as max_completion_time_ms
        FROM pix_transactions
        WHERE created_at > NOW() - INTERVAL '7 days'
          AND status = 'completed'
      `);

			if (pixStats.length > 0) {
				const stats = pixStats[0] as any;
				optimizations.pixTransactions.latency = Number.parseFloat(
					stats.avg_completion_time_ms || '0',
				);
				optimizations.pixTransactions.optimized = optimizations.pixTransactions.latency < 150;

				console.log(`     📊 PIX Transactions (7 days): ${stats.total_pix}`);
				console.log(`     ⚡ Average Completion: ${stats.avg_completion_time_ms}ms`);
				console.log(`     🚀 Peak Completion: ${stats.max_completion_time_ms}ms`);

				if (!optimizations.pixTransactions.optimized) {
					result.recommendations.push({
						priority: 'critical',
						category: 'query',
						description: `PIX transactions exceeding 150ms target: ${stats.avg_completion_time_ms}ms average`,
						impact: 'high',
						effort: 'high',
					});
				}
			}

			console.log('   🎤 Voice query performance...');

			// Analyze voice transcription query performance
			const voiceStats = await this.db.execute(sql`
        SELECT
          COUNT(*) as total_voice,
          ROUND(AVG(EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000), 2) as avg_processing_time_ms
        FROM voice_transcriptions
        WHERE created_at > NOW() - INTERVAL '7 days'
      `);

			if (voiceStats.length > 0) {
				const stats = voiceStats[0] as any;
				optimizations.voiceQueries.responseTime = Number.parseFloat(
					stats.avg_processing_time_ms || '0',
				);
				optimizations.voiceQueries.optimized = optimizations.voiceQueries.responseTime < 100;

				console.log(`     🎤 Voice Transcriptions (7 days): ${stats.total_voice}`);
				console.log(`     ⚡ Average Processing: ${stats.avg_processing_time_ms}ms`);

				if (!optimizations.voiceQueries.optimized) {
					result.recommendations.push({
						priority: 'high',
						category: 'query',
						description: `Voice processing exceeding 100ms target: ${stats.avg_processing_time_ms}ms average`,
						impact: 'medium',
						effort: 'medium',
					});
				}
			}

			console.log('   🏢 Brazilian business hours performance...');

			// Analyze performance during Brazilian business hours (9 AM - 6 PM BRT)
			const businessHourStats = await this.db.execute(sql`
        SELECT
          COUNT(*) as business_hour_transactions,
          ROUND(AVG(EXTRACT(EPOCH FROM (created_at))), 2) as avg_timestamp
        FROM transactions
        WHERE created_at > NOW() - INTERVAL '7 days'
          AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo') BETWEEN 9 AND 18
      `);

			if (businessHourStats.length > 0) {
				const stats = businessHourStats[0] as any;
				const totalBusiness = Number.parseInt(stats.business_hour_transactions || '0', 10);

				if (totalBusiness > 0) {
					optimizations.businessHours.performance = Math.min(100, 100 - totalBusiness / 100);

					if (optimizations.businessHours.performance < 80) {
						optimizations.businessHours.recommendations.push(
							'Consider read replicas for business hour load',
						);
						optimizations.businessHours.recommendations.push(
							'Implement query result caching for frequent operations',
						);
					}

					console.log(`     💼 Business Hours Transactions: ${totalBusiness}`);
					console.log(
						`     📊 Business Hours Performance Score: ${optimizations.businessHours.performance.toFixed(1)}/100`,
					);
				}
			}
		} catch (error) {
			console.error('   ❌ Brazilian optimizations analysis failed:', error);
		}
	}

	private async generateRecommendations(result: PerformanceAnalysisResult): Promise<void> {
		// Additional recommendations based on combined analysis

		// Connection pooling optimization
		if (result.metrics.connectionHealth.poolUtilization > 70) {
			result.recommendations.push({
				priority: 'medium',
				category: 'connection',
				description: 'Optimize connection pool size for better resource utilization',
				impact: 'medium',
				effort: 'low',
			});
		}

		// Read replica recommendation for high read workloads
		const readWriteRatio = await this.db.execute(sql`
      SELECT
        SUM(CASE WHEN command = 'SELECT' THEN 1 ELSE 0 END) as reads,
        SUM(CASE WHEN command IN ('INSERT', 'UPDATE', 'DELETE') THEN 1 ELSE 0 END) as writes
      FROM pg_stat_statements
    `);

		if (readWriteRatio.length > 0) {
			const stats = readWriteRatio[0] as any;
			const reads = Number.parseInt(stats.reads || '0', 10);
			const writes = Number.parseInt(stats.writes || '0', 10);

			if (reads > 0 && writes > 0) {
				const ratio = reads / writes;
				if (ratio > 5) {
					result.recommendations.push({
						priority: 'high',
						category: 'connection',
						description: `High read/write ratio (${ratio.toFixed(1)}:1) - consider read replicas`,
						impact: 'high',
						effort: 'high',
					});
				}
			}
		}

		// Sort recommendations by priority and impact
		result.recommendations.sort((a, b) => {
			const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
			const impactOrder = { high: 0, medium: 1, low: 2 };

			const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
			if (priorityDiff !== 0) return priorityDiff;

			return impactOrder[a.impact] - impactOrder[b.impact];
		});
	}

	private calculateOverallScore(result: PerformanceAnalysisResult): void {
		const scores = [
			result.metrics.queryPerformance.score,
			result.metrics.indexEfficiency.score,
			result.metrics.connectionHealth.score,
			result.metrics.tableOptimization.score,
			result.metrics.caching.score,
		];

		result.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

		if (result.overallScore >= 90) {
			result.status = 'excellent';
		} else if (result.overallScore >= 75) {
			result.status = 'good';
		} else if (result.overallScore >= 60) {
			result.status = 'needs_optimization';
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
	const optimizer = new DatabasePerformanceOptimizer();

	try {
		const result = await optimizer.runPerformanceAnalysis();

		console.log(`\n${'='.repeat(80)}`);
		console.log('⚡ DATABASE PERFORMANCE ANALYSIS REPORT');
		console.log('='.repeat(80));

		console.log(`\n📊 Overall Performance Score: ${result.overallScore}/100`);
		console.log(`📋 Status: ${result.status.toUpperCase().replace('_', ' ')}`);

		console.log('\n📈 PERFORMANCE METRICS:');
		Object.entries(result.metrics).forEach(([key, metric]) => {
			const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
			const score = (metric as any).score || 'N/A';
			console.log(`   ${name}: ${score}/100`);
		});

		console.log('\n🇧🇷 BRAZILIAN FINTECH OPTIMIZATIONS:');
		console.log(
			`   💰 PIX Transactions: ${result.brazilianOptimizations.pixTransactions.optimized ? '✅' : '⚠️'} ${result.brazilianOptimizations.pixTransactions.latency}ms avg`,
		);
		console.log(
			`   🎤 Voice Queries: ${result.brazilianOptimizations.voiceQueries.optimized ? '✅' : '⚠️'} ${result.brazilianOptimizations.voiceQueries.responseTime}ms avg`,
		);
		console.log(
			`   💼 Business Hours: ${result.brazilianOptimizations.businessHours.performance.toFixed(1)}/100`,
		);

		if (result.recommendations.length > 0) {
			console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
			result.recommendations.slice(0, 10).forEach((rec, i) => {
				const icon =
					rec.priority === 'critical'
						? '🚨'
						: rec.priority === 'high'
							? '⚠️'
							: rec.priority === 'medium'
								? '💡'
								: '💭';

				console.log(`${i + 1}. ${icon} [${rec.priority.toUpperCase()}] ${rec.category}`);
				console.log(`   📝 ${rec.description}`);
				console.log(`   📊 Impact: ${rec.impact} | Effort: ${rec.effort}`);

				if (rec.sql) {
					console.log(`   💾 SQL: ${rec.sql}`);
				}
				console.log('');
			});
		} else {
			console.log('\n✅ No optimization recommendations - Database is well-tuned!');
		}

		console.log('\n🚀 NEXT STEPS:');
		if (result.status === 'excellent') {
			console.log('   ✅ Maintain current performance monitoring');
			console.log('   📊 Monitor growth trends and scale accordingly');
			console.log('   🔍 Continue regular performance reviews');
		} else if (result.status === 'good') {
			console.log('   🔧 Implement high-impact optimizations');
			console.log('   📊 Monitor performance after changes');
			console.log('   💾 Consider read replicas for read-heavy workloads');
		} else {
			console.log('   🚨 Address critical performance issues immediately');
			console.log('   🔧 Implement high-priority recommendations');
			console.log('   📊 Consider infrastructure scaling');
		}
	} catch (error) {
		console.error('❌ Performance analysis failed:', error);
		process.exit(1);
	} finally {
		await optimizer.cleanup();
	}
}

// Run if executed directly
if (import.meta.main) {
	main().catch(console.error);
}

export { DatabasePerformanceOptimizer, type PerformanceAnalysisResult };
