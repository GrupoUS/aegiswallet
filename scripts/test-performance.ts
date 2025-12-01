#!/usr/bin/env bun
/**
 * Neon Database Performance Test
 * Tests latency and performance for sa-east-1 region
 */

const DATABASE_URL =
	'postgresql://neondb_owner:npg_jqbHF8Rt9LKl@ep-calm-unit-ac6cfbqc-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';
const DATABASE_URL_UNPOOLED =
	'postgresql://neondb_owner:npg_jqbHF8Rt9LKl@ep-calm-unit-ac6cfbqc.sa-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require';

interface PerformanceResult {
	queryTime: number;
	totalTime: number;
	success: boolean;
	error?: string;
}

async function measureQueryPerformance(
	url: string,
	label: string,
	iterations = 10,
): Promise<PerformanceResult[]> {
	console.log(`\n📊 Testing ${label} Performance (${iterations} iterations)...`);

	const results: PerformanceResult[] = [];

	try {
		const { neon } = await import('@neondatabase/serverless');
		const sql = neon(url);

		// Warm up connection
		await sql`SELECT 1`;

		for (let i = 0; i < iterations; i++) {
			const startTime = performance.now();

			try {
				const result = await sql`
          SELECT 
            now() as timestamp,
            version() as version,
            current_database() as database,
            current_user as user
        `;

				const queryTime = performance.now() - startTime;

				results.push({
					queryTime,
					totalTime: queryTime,
					success: true,
				});

				if (i === 0) {
					console.log(`   🌐 Server: ${result[0]?.database} @ ${result[0]?.timestamp}`);
					console.log(`   🗄️  PostgreSQL: ${result[0]?.version?.split(',')[0]}`);
				}

				process.stdout.write(`   Iteration ${i + 1}: ${queryTime.toFixed(2)}ms\n`);
			} catch (error) {
				const totalTime = performance.now() - startTime;
				results.push({
					queryTime: 0,
					totalTime,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				});

				process.stdout.write(`   Iteration ${i + 1}: ERROR\n`);
			}

			// Small delay between queries
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	} catch (error) {
		console.error(`   ❌ Connection setup failed: ${error}`);
		results.push({
			queryTime: 0,
			totalTime: 0,
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}

	return results;
}

function analyzeResults(results: PerformanceResult[], label: string) {
	const successfulResults = results.filter((r) => r.success);
	const failedResults = results.filter((r) => !r.success);

	if (successfulResults.length === 0) {
		console.log(`\n❌ ${label}: All queries failed`);
		return;
	}

	const queryTimes = successfulResults.map((r) => r.queryTime);
	const avgQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
	const minQueryTime = Math.min(...queryTimes);
	const maxQueryTime = Math.max(...queryTimes);

	// Calculate percentiles
	const sortedTimes = [...queryTimes].sort((a, b) => a - b);
	const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
	const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
	const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

	console.log(`\n📈 ${label} Performance Analysis:`);
	console.log(
		`   ✅ Success Rate: ${successfulResults.length}/${results.length} (${((successfulResults.length / results.length) * 100).toFixed(1)}%)`,
	);
	console.log(`   ⚡ Average Query Time: ${avgQueryTime.toFixed(2)}ms`);
	console.log(`   🏃 Fastest Query: ${minQueryTime.toFixed(2)}ms`);
	console.log(`   🐌 Slowest Query: ${maxQueryTime.toFixed(2)}ms`);
	console.log(`   📊 P50 Median: ${p50.toFixed(2)}ms`);
	console.log(`   📊 P95: ${p95.toFixed(2)}ms`);
	console.log(`   📊 P99: ${p99.toFixed(2)}ms`);

	if (failedResults.length > 0) {
		console.log(`   ❌ Failed Queries: ${failedResults.length}`);
		failedResults.forEach((result, index) => {
			console.log(`      ${index + 1}. ${result.error}`);
		});
	}

	// Performance classification
	console.log(`   🎯 Performance Classification:`);
	if (avgQueryTime < 100) {
		console.log(`      🟢 Excellent (< 100ms) - Optimized for production`);
	} else if (avgQueryTime < 200) {
		console.log(`      🟡 Good (100-200ms) - Suitable for most applications`);
	} else if (avgQueryTime < 500) {
		console.log(`      🟠 Fair (200-500ms) - May need optimization`);
	} else {
		console.log(`      🔴 Poor (> 500ms) - Requires optimization`);
	}

	return {
		avgQueryTime,
		p95,
		successRate: successfulResults.length / results.length,
	};
}

async function main() {
	console.log('🚀 Neon Database Performance Test Suite');
	console.log('========================================');
	console.log(
		`📍 Testing from: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
	);
	console.log(`🌍 Target Region: sa-east-1 (São Paulo, Brazil)`);

	// Test pooled connection performance
	const pooledResults = await measureQueryPerformance(DATABASE_URL, 'Pooled Connection', 15);
	const pooledStats = analyzeResults(pooledResults, 'Pooled Connection');

	// Test direct connection performance
	const directResults = await measureQueryPerformance(
		DATABASE_URL_UNPOOLED,
		'Direct Connection',
		15,
	);
	const directStats = analyzeResults(directResults, 'Direct Connection');

	// Compare results
	console.log('\n🔄 Performance Comparison:');
	if (pooledStats && directStats) {
		console.log(
			`   📊 Avg Query Time: Pooled ${pooledStats.avgQueryTime.toFixed(2)}ms vs Direct ${directStats.avgQueryTime.toFixed(2)}ms`,
		);
		console.log(
			`   📈 P95 Latency: Pooled ${pooledStats.p95.toFixed(2)}ms vs Direct ${directStats.p95.toFixed(2)}ms`,
		);
		console.log(
			`   ✅ Success Rate: Pooled ${(pooledStats.successRate * 100).toFixed(1)}% vs Direct ${(directStats.successRate * 100).toFixed(1)}%`,
		);

		const fasterBy =
			((directStats.avgQueryTime - pooledStats.avgQueryTime) / directStats.avgQueryTime) * 100;
		if (fasterBy > 0) {
			console.log(`   🏆 Pooled connection is ${fasterBy.toFixed(1)}% faster on average`);
		} else {
			console.log(`   🏆 Direct connection is ${Math.abs(fasterBy).toFixed(1)}% faster on average`);
		}
	}

	// Regional optimization check
	console.log('\n🇧🇷 Brazilian Market Optimization:');
	if (pooledStats && pooledStats.avgQueryTime < 200) {
		console.log('   ✅ Excellent latency for Brazilian users');
		console.log('   ✅ Suitable for real-time financial operations');
		console.log('   ✅ Meets BCB/PIX transaction timing requirements');
	} else if (pooledStats && pooledStats.avgQueryTime < 500) {
		console.log('   ⚠️  Acceptable latency for Brazilian users');
		console.log('   ⚠️  May need optimization for high-frequency trading');
	} else {
		console.log('   ❌ High latency - consider edge caching or CDN');
	}

	console.log('\n🎯 Recommendations:');
	console.log('   - Use pooled connections for API endpoints (high concurrency)');
	console.log('   - Use direct connections for migrations and admin operations');
	console.log('   - Implement connection pooling with proper timeout handling');
	console.log('   - Consider Redis caching for frequently accessed data');
	console.log('   - Monitor connection pool usage in production');

	console.log('\n✅ Performance testing completed!');
}

main().catch(console.error);
