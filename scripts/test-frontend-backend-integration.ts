/**
 * Frontend-Backend-Database Integration Test Script
 *
 * Validates the complete request flow from frontend through backend to database:
 * - Server startup verification
 * - Health endpoint testing
 * - CORS validation
 * - Vite proxy testing (if running)
 * - Database connectivity through API
 *
 * Usage: bun scripts/test-frontend-backend-integration.ts
 */

interface TestResult {
	name: string;
	status: 'pass' | 'fail' | 'skip';
	message: string;
	duration?: number;
	details?: Record<string, unknown>;
}

const results: TestResult[] = [];

function log(emoji: string, message: string) {
	console.log(`${emoji} ${message}`);
}

function addResult(
	name: string,
	status: 'pass' | 'fail' | 'skip',
	message: string,
	duration?: number,
	details?: Record<string, unknown>,
) {
	results.push({ name, status, message, duration, details });
	const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
	const durationStr = duration !== undefined ? ` (${duration}ms)` : '';
	log(emoji, `${name}: ${message}${durationStr}`);
	if (details) {
		Object.entries(details).forEach(([key, value]) => {
			console.log(`      ${key}: ${JSON.stringify(value)}`);
		});
	}
}

// ========================================
// Configuration
// ========================================
const BACKEND_PORT = Number.parseInt(process.env.PORT || '3000', 10);
const VITE_PORT = 8080;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;
const VITE_URL = `http://localhost:${VITE_PORT}`;
const TIMEOUT_MS = 5000;

// ========================================
// Helper Functions
// ========================================
async function fetchWithTimeout(
	url: string,
	options: RequestInit = {},
	timeout = TIMEOUT_MS,
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		return response;
	} finally {
		clearTimeout(timeoutId);
	}
}

async function isServerRunning(url: string): Promise<boolean> {
	try {
		await fetchWithTimeout(url, { method: 'GET' }, 2000);
		return true;
	} catch {
		return false;
	}
}

// ========================================
// Test Functions
// ========================================

async function testBackendServer(): Promise<void> {
	console.log('\n📡 TEST 1: Backend Server Availability\n');

	const startTime = Date.now();
	try {
		const isRunning = await isServerRunning(BACKEND_URL);
		const duration = Date.now() - startTime;

		if (isRunning) {
			addResult('Backend Server', 'pass', `Running on port ${BACKEND_PORT}`, duration);
		} else {
			addResult('Backend Server', 'fail', `Not responding on port ${BACKEND_PORT}`, duration, {
				Recommendation: 'Start the backend server with: bun dev:server',
			});
		}
	} catch (error) {
		addResult(
			'Backend Server',
			'fail',
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function testHealthEndpoint(): Promise<void> {
	console.log('\n🏥 TEST 2: Health Endpoint (/api/health)\n');

	const startTime = Date.now();
	try {
		const response = await fetchWithTimeout(`${BACKEND_URL}/api/health`);
		const duration = Date.now() - startTime;

		if (response.ok) {
			const data = await response.json();
			addResult('Health Endpoint', 'pass', `Status ${response.status}`, duration, {
				'Server Status': data.status,
				'Database Status': data.database?.status || 'N/A',
				'Database Latency': data.database?.latency ? `${data.database.latency}ms` : 'N/A',
				Uptime: data.uptime ? `${Math.round(data.uptime)}s` : 'N/A',
			});

			// Check database connectivity in health response
			if (data.database?.status === 'connected') {
				addResult('DB via Health', 'pass', 'Database connected through health endpoint');
			} else if (data.database?.status === 'disconnected' || data.database?.status === 'error') {
				addResult('DB via Health', 'fail', `Database ${data.database.status}`, undefined, {
					Error: data.database.error || 'Unknown error',
				});
			}
		} else {
			addResult('Health Endpoint', 'fail', `Status ${response.status}`, duration);
		}
	} catch (error) {
		addResult(
			'Health Endpoint',
			'fail',
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function testV1HealthEndpoint(): Promise<void> {
	console.log('\n🔬 TEST 3: V1 Health Endpoint (/api/v1/health)\n');

	const startTime = Date.now();
	try {
		const response = await fetchWithTimeout(`${BACKEND_URL}/api/v1/health`);
		const duration = Date.now() - startTime;

		if (response.ok) {
			const data = await response.json();
			addResult('V1 Health Endpoint', 'pass', `Status ${response.status}`, duration, {
				'Overall Status': data.status,
				Database: data.services?.database || data.checks?.database?.status || 'N/A',
				API: data.services?.api || 'N/A',
				Version: data.version || 'N/A',
			});
		} else {
			const data = await response.json().catch(() => ({}));
			addResult('V1 Health Endpoint', 'fail', `Status ${response.status}`, duration, {
				Response: JSON.stringify(data).substring(0, 200),
			});
		}
	} catch (error) {
		addResult(
			'V1 Health Endpoint',
			'fail',
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function testCORS(): Promise<void> {
	console.log('\n🔐 TEST 4: CORS Configuration\n');

	const startTime = Date.now();
	try {
		// Test preflight OPTIONS request
		const preflightResponse = await fetchWithTimeout(`${BACKEND_URL}/api/health`, {
			method: 'OPTIONS',
			headers: {
				Origin: VITE_URL,
				'Access-Control-Request-Method': 'GET',
				'Access-Control-Request-Headers': 'Content-Type, Authorization',
			},
		});
		const duration = Date.now() - startTime;

		const allowOrigin = preflightResponse.headers.get('Access-Control-Allow-Origin');
		const allowCredentials = preflightResponse.headers.get('Access-Control-Allow-Credentials');
		const allowMethods = preflightResponse.headers.get('Access-Control-Allow-Methods');

		if (allowOrigin) {
			addResult('CORS Preflight', 'pass', 'Preflight request successful', duration, {
				'Allow-Origin': allowOrigin,
				'Allow-Credentials': allowCredentials || 'not set',
				'Allow-Methods': allowMethods || 'not set',
			});
		} else {
			addResult('CORS Preflight', 'fail', 'No Access-Control-Allow-Origin header', duration);
		}

		// Test actual request with Origin header
		const corsResponse = await fetchWithTimeout(`${BACKEND_URL}/api/health`, {
			method: 'GET',
			headers: {
				Origin: VITE_URL,
			},
		});

		const responseAllowOrigin = corsResponse.headers.get('Access-Control-Allow-Origin');
		if (responseAllowOrigin) {
			addResult('CORS Response', 'pass', 'CORS headers present in response', undefined, {
				'Allow-Origin': responseAllowOrigin,
			});
		} else {
			addResult('CORS Response', 'fail', 'No CORS headers in response');
		}
	} catch (error) {
		addResult(
			'CORS Test',
			'fail',
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function testViteProxy(): Promise<void> {
	console.log('\n🔄 TEST 5: Vite Dev Server & Proxy\n');

	// First check if Vite is running
	const viteRunning = await isServerRunning(VITE_URL);

	if (!viteRunning) {
		addResult(
			'Vite Server',
			'skip',
			`Not running on port ${VITE_PORT} (optional for this test)`,
			undefined,
			{
				Note: 'Start Vite with: bun dev:client',
			},
		);
		return;
	}

	addResult('Vite Server', 'pass', `Running on port ${VITE_PORT}`);

	// Test proxy to backend
	const startTime = Date.now();
	try {
		const response = await fetchWithTimeout(`${VITE_URL}/api/health`);
		const duration = Date.now() - startTime;

		if (response.ok) {
			const data = await response.json();
			addResult('Vite Proxy', 'pass', `Successfully proxied to backend`, duration, {
				'Proxied Status': data.status,
				Via: `${VITE_URL} → ${BACKEND_URL}`,
			});
		} else {
			addResult('Vite Proxy', 'fail', `Proxy returned status ${response.status}`, duration);
		}
	} catch (error) {
		addResult(
			'Vite Proxy',
			'fail',
			`Proxy error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

async function testDatabaseThroughAPI(): Promise<void> {
	console.log('\n🗄️ TEST 6: Database Connectivity Through API\n');

	// Use v1 health endpoint which has more detailed database info
	const startTime = Date.now();
	try {
		const response = await fetchWithTimeout(`${BACKEND_URL}/api/v1/health`);
		const duration = Date.now() - startTime;

		if (response.ok) {
			const data = await response.json();
			const dbStatus = data.services?.database || data.checks?.database?.status;
			const dbLatency = data.metrics?.databaseLatency;

			if (dbStatus === 'connected') {
				addResult('DB Through API', 'pass', 'Database accessible through API layer', duration, {
					'DB Latency': dbLatency ? `${dbLatency}ms` : 'N/A',
					'Total API Latency': `${duration}ms`,
				});
			} else {
				addResult('DB Through API', 'fail', `Database status: ${dbStatus}`, duration);
			}
		} else {
			addResult('DB Through API', 'fail', `API returned status ${response.status}`, duration);
		}
	} catch (error) {
		addResult(
			'DB Through API',
			'fail',
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

// ========================================
// Main Execution
// ========================================
async function main() {
	console.log('═'.repeat(60));
	console.log('🔗 FRONTEND-BACKEND-DATABASE INTEGRATION TEST');
	console.log('═'.repeat(60));
	console.log(`   Backend URL: ${BACKEND_URL}`);
	console.log(`   Vite URL: ${VITE_URL}`);
	console.log(`   Timestamp: ${new Date().toISOString()}`);

	// Run all tests
	await testBackendServer();

	// Only continue if backend is running
	const backendResult = results.find((r) => r.name === 'Backend Server');
	if (backendResult?.status === 'fail') {
		console.log('\n⚠️  Backend server not running. Skipping remaining tests.');
		console.log('   Start the server with: bun dev:server');
		console.log('   Or start full stack with: bun dev:full');
		printSummary();
		process.exit(1);
	}

	await testHealthEndpoint();
	await testV1HealthEndpoint();
	await testCORS();
	await testViteProxy();
	await testDatabaseThroughAPI();

	printSummary();
}

function printSummary() {
	// Summary
	console.log('\n' + '═'.repeat(60));
	console.log('📊 INTEGRATION TEST SUMMARY');
	console.log('═'.repeat(60));

	const passCount = results.filter((r) => r.status === 'pass').length;
	const failCount = results.filter((r) => r.status === 'fail').length;
	const skipCount = results.filter((r) => r.status === 'skip').length;

	console.log(`\n   ✅ Passed: ${passCount}`);
	console.log(`   ❌ Failed: ${failCount}`);
	console.log(`   ⏭️  Skipped: ${skipCount}`);

	if (failCount > 0) {
		console.log('\n❌ FAILED TESTS:');
		results
			.filter((r) => r.status === 'fail')
			.forEach((r) => {
				console.log(`   • ${r.name}: ${r.message}`);
				if (r.details?.Recommendation) {
					console.log(`     💡 ${r.details.Recommendation}`);
				}
			});
	}

	// Recommendations
	console.log('\n🚀 RECOMMENDATIONS:');
	if (failCount === 0) {
		console.log('   ✅ All integration tests passed!');
		console.log('   Your frontend-backend-database stack is properly connected.');
	} else {
		if (results.find((r) => r.name === 'Backend Server')?.status === 'fail') {
			console.log('   1. Start the backend server: bun dev:server');
		}
		if (results.find((r) => r.name.includes('DB'))?.status === 'fail') {
			console.log('   2. Verify database connection: bun run neon:verify');
		}
		if (results.find((r) => r.name === 'Vite Server')?.status === 'skip') {
			console.log('   3. Start Vite for full-stack: bun dev:full');
		}
	}

	console.log('\n' + '═'.repeat(60));

	process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
main().catch((error) => {
	console.error('\n❌ Integration test failed with error:', error);
	process.exit(1);
});
