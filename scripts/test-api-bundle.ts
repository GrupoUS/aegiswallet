/**
 * Test API Bundle
 * Loads and tests the API bundle to verify it works correctly
 */

async function testBundle() {
	console.log('🔍 Testing API bundle...\n');

	try {
		// Dynamic import of the bundle
		const apiModule = await import('../api/index.mjs');
		console.log('✅ Bundle loaded successfully');
		console.log('   Exports:', Object.keys(apiModule));

		// Check if default export exists
		if (apiModule.default) {
			console.log('✅ Default export (Hono app) found');

			// Check if it's a Hono app
			const app = apiModule.default;
			if (typeof app.fetch === 'function') {
				console.log('✅ Hono fetch function available');

				// Test a simple request
				const testRequest = new Request('http://localhost/api/v1/ping', {
					method: 'GET',
				});

				console.log('\n📡 Testing /api/v1/ping endpoint...');
				const response = await app.fetch(testRequest);
				const data = await response.json();
				console.log('   Status:', response.status);
				console.log('   Response:', JSON.stringify(data, null, 2));

				if (response.status === 200) {
					console.log('\n✅ API bundle is working correctly!');
				} else {
					console.log('\n⚠️ API responded but with unexpected status');
				}
			} else {
				console.log('❌ No fetch function found on default export');
			}
		} else {
			console.log('❌ No default export found');
		}
	} catch (error) {
		console.error('❌ Error loading bundle:', error);
		if (error instanceof Error) {
			console.error('   Message:', error.message);
			console.error('   Stack:', error.stack);
		}
	}
}

void testBundle();
