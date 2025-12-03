#!/usr/bin/env tsx
/**
 * Clerk Webhook Setup Script
 *
 * Configures Clerk webhook endpoint for user lifecycle events
 * Provides both automated setup (via API) and manual instructions
 */

import { createClerkClient } from '@clerk/backend';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL || process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}/api/v1/webhooks/clerk`
	: 'http://localhost:3000/api/v1/webhooks/clerk';

const REQUIRED_EVENTS = ['user.created', 'user.updated', 'user.deleted'];

interface ClerkWebhook {
	id: string;
	url: string;
	events: string[];
	secret?: string;
}

/**
 * Get Clerk API base URL
 */
function getClerkApiUrl(): string {
	const secretKey = CLERK_SECRET_KEY || '';

	// Extract instance ID from secret key (format: sk_test_xxx or sk_live_xxx)
	const instanceMatch = secretKey.match(/sk_(test|live)_(.+)/);
	if (!instanceMatch) {
		throw new Error('Invalid CLERK_SECRET_KEY format');
	}

	const instanceId = instanceMatch[2].split('_')[0];
	const environment = instanceMatch[1];

	return `https://api.clerk.${environment === 'live' ? 'com' : 'dev'}/v1`;
}

/**
 * List existing webhooks via Clerk API
 */
async function listWebhooks(): Promise<ClerkWebhook[]> {
	if (!CLERK_SECRET_KEY) {
		throw new Error('CLERK_SECRET_KEY environment variable is not set');
	}

	const apiUrl = getClerkApiUrl();

	try {
		const response = await fetch(`${apiUrl}/webhooks`, {
			headers: {
				'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			if (response.status === 404) {
				// API endpoint might not be available, return empty array
				return [];
			}
			throw new Error(`Failed to list webhooks: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return Array.isArray(data) ? data : [];
	} catch (error) {
		console.log('⚠️  Could not list webhooks via API (this is normal if using Clerk Dashboard)');
		console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		return [];
	}
}

/**
 * Create webhook via Clerk API
 */
async function createWebhook(url: string, events: string[]): Promise<ClerkWebhook | null> {
	if (!CLERK_SECRET_KEY) {
		throw new Error('CLERK_SECRET_KEY environment variable is not set');
	}

	const apiUrl = getClerkApiUrl();

	try {
		const response = await fetch(`${apiUrl}/webhooks`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				url,
				events,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to create webhook: ${response.status} ${response.statusText} - ${errorText}`);
		}

		const webhook = await response.json();
		return webhook;
	} catch (error) {
		console.log('⚠️  Could not create webhook via API');
		console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		console.log('   You will need to create it manually in the Clerk Dashboard');
		return null;
	}
}

/**
 * Update webhook via Clerk API
 */
async function updateWebhook(webhookId: string, url: string, events: string[]): Promise<ClerkWebhook | null> {
	if (!CLERK_SECRET_KEY) {
		throw new Error('CLERK_SECRET_KEY environment variable is not set');
	}

	const apiUrl = getClerkApiUrl();

	try {
		const response = await fetch(`${apiUrl}/webhooks/${webhookId}`, {
			method: 'PATCH',
			headers: {
				'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				url,
				events,
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to update webhook: ${response.status} ${response.statusText}`);
		}

		const webhook = await response.json();
		return webhook;
	} catch (error) {
		console.log('⚠️  Could not update webhook via API');
		console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		return null;
	}
}

/**
 * Get webhook signing secret
 */
async function getWebhookSecret(webhookId: string): Promise<string | null> {
	if (!CLERK_SECRET_KEY) {
		throw new Error('CLERK_SECRET_KEY environment variable is not set');
	}

	const apiUrl = getClerkApiUrl();

	try {
		const response = await fetch(`${apiUrl}/webhooks/${webhookId}/signing_secret`, {
			headers: {
				'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to get webhook secret: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data.secret || null;
	} catch (error) {
		console.log('⚠️  Could not get webhook secret via API');
		console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
		return null;
	}
}

/**
 * Update .env file with webhook secret
 */
function updateEnvFile(webhookSecret: string) {
	const envPath = join(process.cwd(), '.env');
	const envExamplePath = join(process.cwd(), 'env.example');

	try {
		let envContent = '';
		try {
			envContent = readFileSync(envPath, 'utf-8');
		} catch {
			// .env doesn't exist, create it
			envContent = '';
		}

		// Update or add CLERK_WEBHOOK_SECRET
		if (envContent.includes('CLERK_WEBHOOK_SECRET=')) {
			envContent = envContent.replace(
				/CLERK_WEBHOOK_SECRET=.*/,
				`CLERK_WEBHOOK_SECRET=${webhookSecret}`,
			);
		} else {
			envContent += `\nCLERK_WEBHOOK_SECRET=${webhookSecret}\n`;
		}

		writeFileSync(envPath, envContent);
		console.log(`✅ Updated ${envPath} with webhook secret`);
	} catch (error) {
		console.log(`⚠️  Could not update .env file: ${error instanceof Error ? error.message : 'Unknown error'}`);
		console.log(`   Please manually add: CLERK_WEBHOOK_SECRET=${webhookSecret}`);
	}
}

/**
 * Print manual setup instructions
 */
function printManualInstructions(webhookUrl: string) {
	console.log('\n📋 MANUAL SETUP INSTRUCTIONS:');
	console.log('='.repeat(60));
	console.log('\n1. Go to Clerk Dashboard:');
	console.log('   https://dashboard.clerk.com/apps/[YOUR_APP]/webhooks');
	console.log('\n2. Click "Add Endpoint"');
	console.log('\n3. Configure webhook:');
	console.log(`   URL: ${webhookUrl}`);
	console.log('   Events:');
	REQUIRED_EVENTS.forEach(event => {
		console.log(`     - ${event}`);
	});
	console.log('\n4. Copy the webhook signing secret');
	console.log('   It will look like: whsec_xxxxxxxxxxxxx');
	console.log('\n5. Add to your .env file:');
	console.log('   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx');
	console.log('\n6. Restart your server');
	console.log('='.repeat(60));
}

/**
 * Main setup function
 */
async function setupWebhook() {
	console.log('🚀 Clerk Webhook Setup\n');
	console.log('='.repeat(60));

	// Validate environment
	if (!CLERK_SECRET_KEY) {
		console.log('❌ CLERK_SECRET_KEY environment variable is not set');
		console.log('\nPlease set it in your .env file or environment');
		process.exit(1);
	}

	console.log(`\n📡 Webhook URL: ${WEBHOOK_URL}`);
	console.log(`📋 Required Events: ${REQUIRED_EVENTS.join(', ')}`);

	// Try to use Clerk API
	console.log('\n🔍 Checking existing webhooks...');
	const existingWebhooks = await listWebhooks();

	// Find webhook with matching URL
	const matchingWebhook = existingWebhooks.find(wh => wh.url === WEBHOOK_URL);

	if (matchingWebhook) {
		console.log(`\n✅ Found existing webhook: ${matchingWebhook.id}`);

		// Check if events match
		const missingEvents = REQUIRED_EVENTS.filter(e => !matchingWebhook.events.includes(e));
		if (missingEvents.length > 0) {
			console.log(`⚠️  Webhook is missing events: ${missingEvents.join(', ')}`);
			console.log('   Attempting to update...');

			const updated = await updateWebhook(matchingWebhook.id, WEBHOOK_URL, [
				...matchingWebhook.events,
				...missingEvents,
			]);

			if (updated) {
				console.log('✅ Webhook updated successfully');
			} else {
				console.log('⚠️  Could not update via API, please update manually');
			}
		} else {
			console.log('✅ Webhook is properly configured');
		}

		// Get webhook secret
		console.log('\n🔑 Retrieving webhook signing secret...');
		const secret = await getWebhookSecret(matchingWebhook.id);

		if (secret) {
			console.log('✅ Webhook secret retrieved');
			updateEnvFile(secret);
		} else {
			console.log('⚠️  Could not retrieve secret via API');
			console.log('   Please copy it from the Clerk Dashboard');
		}
	} else {
		console.log('\n📝 No existing webhook found, creating new one...');

		const webhook = await createWebhook(WEBHOOK_URL, REQUIRED_EVENTS);

		if (webhook) {
			console.log(`✅ Webhook created: ${webhook.id}`);

			// Get webhook secret
			console.log('\n🔑 Retrieving webhook signing secret...');
			const secret = await getWebhookSecret(webhook.id);

			if (secret) {
				console.log('✅ Webhook secret retrieved');
				updateEnvFile(secret);
			} else {
				console.log('⚠️  Could not retrieve secret via API');
				console.log('   Please copy it from the Clerk Dashboard');
			}
		} else {
			console.log('\n⚠️  Could not create webhook via API');
			printManualInstructions(WEBHOOK_URL);
		}
	}

	// Validate Clerk client
	console.log('\n🔐 Validating Clerk client...');
	try {
		const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
		const userList = await clerkClient.users.getUserList({ limit: 1 });
		console.log(`✅ Clerk client validated (${userList.totalCount} users in total)`);
	} catch (error) {
		console.log(`❌ Clerk client validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	console.log('\n✅ Setup complete!');
	console.log('\n📌 NEXT STEPS:');
	console.log('1. Ensure CLERK_WEBHOOK_SECRET is set in your .env file');
	console.log('2. Restart your server');
	console.log('3. Test webhook: bun scripts/test-clerk-webhook.ts');
}

// Run if executed directly
if (import.meta.main || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
	setupWebhook().catch(error => {
		console.error('💥 Setup failed:', error);
		process.exit(1);
	});
}

export { setupWebhook, listWebhooks, createWebhook, updateWebhook };

