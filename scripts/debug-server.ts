import { environment } from '../src/server/config/environment';
import app from '../src/server/index';

console.log('Environment PORT:', environment.PORT);
console.log('Process PORT:', process.env.PORT);

const testPort = 3005;

console.log(`Starting test server on port ${testPort}...`);

const server = Bun.serve({
	fetch: app.fetch,
	port: testPort,
});

console.log(`Test server running on http://localhost:${testPort}`);

async function testRoute(path: string) {
	console.log(`Testing ${path}...`);
	try {
		const res = await fetch(`http://localhost:${testPort}${path}`);
		console.log(`Response status: ${res.status}`);
		if (res.status === 404) {
			console.error('❌ Route not found');
			const json = await res.json();
			console.log('Error body:', json);
		} else if (res.status === 401) {
			console.log('✅ Route found (401 Auth Required)');
		} else {
			console.log(`✅ Route found (${res.status})`);
		}
	} catch (err) {
		console.error('Request failed:', err);
	}
}

async function runTests() {
	await testRoute('/api/health');
	await testRoute('/api/v1/bank-accounts');
	await testRoute('/api/v1/transactions');
	await testRoute('/api/v1/users/me/financial-summary');

	server.stop();
	process.exit(0);
}

// Execute tests
void (async () => {
	await runTests();
})();
