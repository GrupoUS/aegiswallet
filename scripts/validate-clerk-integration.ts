#!/usr/bin/env tsx
/**
 * Clerk Integration Validation Script
 *
 * Comprehensive validation of Clerk + React (Vite) integration
 * Validates configuration, components, webhooks, and database setup
 */

import { createClerkClient } from '@clerk/backend';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
	name: string;
	status: 'pass' | 'fail' | 'warning';
	message: string;
	details?: string[];
}

const results: ValidationResult[] = [];

// Helper to add results
function addResult(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string[]) {
	results.push({ name, status, message, details });
}

// Helper to get environment variable
function getEnvVar(key: string): string | undefined {
	return process.env[key];
}

// Phase 1.1: Validate Environment Variables
function validateEnvironmentVariables() {
	console.log('\n📋 Phase 1.1: Validating Environment Variables\n');

	const publishableKey = getEnvVar('VITE_CLERK_PUBLISHABLE_KEY');
	const secretKey = getEnvVar('CLERK_SECRET_KEY');
	const webhookSecret = getEnvVar('CLERK_WEBHOOK_SECRET');

	// Validate VITE_CLERK_PUBLISHABLE_KEY
	if (!publishableKey) {
		addResult(
			'VITE_CLERK_PUBLISHABLE_KEY',
			'fail',
			'Missing VITE_CLERK_PUBLISHABLE_KEY environment variable',
			['Required for client-side Clerk authentication', 'Add to .env.local or .env file'],
		);
	} else if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
		addResult(
			'VITE_CLERK_PUBLISHABLE_KEY',
			'fail',
			'Invalid VITE_CLERK_PUBLISHABLE_KEY format',
			['Must start with pk_test_ or pk_live_', `Current value: ${publishableKey.slice(0, 10)}...`],
		);
	} else {
		addResult(
			'VITE_CLERK_PUBLISHABLE_KEY',
			'pass',
			`Valid publishable key (${publishableKey.startsWith('pk_test_') ? 'test' : 'live'} environment)`,
		);
	}

	// Validate CLERK_SECRET_KEY
	if (!secretKey) {
		addResult(
			'CLERK_SECRET_KEY',
			'fail',
			'Missing CLERK_SECRET_KEY environment variable',
			['Required for server-side Clerk operations', 'Add to .env.local or .env file (server-side only)'],
		);
	} else if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
		addResult(
			'CLERK_SECRET_KEY',
			'fail',
			'Invalid CLERK_SECRET_KEY format',
			['Must start with sk_test_ or sk_live_', `Current value: ${secretKey.slice(0, 10)}...`],
		);
	} else {
		addResult(
			'CLERK_SECRET_KEY',
			'pass',
			`Valid secret key (${secretKey.startsWith('sk_test_') ? 'test' : 'live'} environment)`,
		);
	}

	// Validate CLERK_WEBHOOK_SECRET (optional but recommended)
	if (!webhookSecret) {
		addResult(
			'CLERK_WEBHOOK_SECRET',
			'warning',
			'Missing CLERK_WEBHOOK_SECRET environment variable',
			['Required for webhook signature verification', 'Get from Clerk Dashboard > Webhooks'],
		);
	} else if (!webhookSecret.startsWith('whsec_')) {
		addResult(
			'CLERK_WEBHOOK_SECRET',
			'fail',
			'Invalid CLERK_WEBHOOK_SECRET format',
			['Must start with whsec_', `Current value: ${webhookSecret.slice(0, 10)}...`],
		);
	} else {
		addResult('CLERK_WEBHOOK_SECRET', 'pass', 'Valid webhook secret');
	}

	// Check .env.local exists
	const envLocalPath = join(process.cwd(), '.env.local');
	if (!existsSync(envLocalPath)) {
		addResult(
			'.env.local file',
			'warning',
			'.env.local file not found',
			['Recommended for local development', 'Copy from env.example and fill in values'],
		);
	} else {
		addResult('.env.local file', 'pass', '.env.local file exists');
	}
}

// Phase 1.2: Validate ClerkProvider Setup
function validateClerkProvider() {
	console.log('\n📋 Phase 1.2: Validating ClerkProvider Setup\n');

	const mainTsxPath = join(process.cwd(), 'src/main.tsx');
	const providerPath = join(process.cwd(), 'src/integrations/clerk/provider.tsx');

	// Check main.tsx
	if (!existsSync(mainTsxPath)) {
		addResult('main.tsx', 'fail', 'src/main.tsx not found');
		return;
	}

	const mainContent = readFileSync(mainTsxPath, 'utf-8');

	// Check ClerkProvider is imported
	if (!mainContent.includes('ClerkProvider')) {
		addResult('main.tsx ClerkProvider', 'fail', 'ClerkProvider not found in main.tsx');
	} else {
		addResult('main.tsx ClerkProvider', 'pass', 'ClerkProvider found in main.tsx');
	}

	// Check ClerkProvider wraps the app
	if (!mainContent.includes('<ClerkProvider>') && !mainContent.includes('<ClerkProvider ')) {
		addResult('main.tsx wrapper', 'fail', 'ClerkProvider does not wrap the app');
	} else {
		addResult('main.tsx wrapper', 'pass', 'ClerkProvider wraps the app');
	}

	// Check provider.tsx
	if (!existsSync(providerPath)) {
		addResult('provider.tsx', 'fail', 'src/integrations/clerk/provider.tsx not found');
		return;
	}

	const providerContent = readFileSync(providerPath, 'utf-8');

	// Check uses publishableKey (not frontendApi)
	if (providerContent.includes('frontendApi')) {
		addResult('provider.tsx publishableKey', 'fail', 'Using deprecated frontendApi prop', [
			'Should use publishableKey instead',
			'frontendApi is deprecated in newer Clerk versions',
		]);
	} else if (providerContent.includes('publishableKey')) {
		addResult('provider.tsx publishableKey', 'pass', 'Using correct publishableKey prop');
	} else {
		addResult('provider.tsx publishableKey', 'warning', 'publishableKey prop not found');
	}

	// Check afterSignOutUrl or afterSignOutFallbackRedirectUrl
	if (
		providerContent.includes('afterSignOutUrl') ||
		providerContent.includes('afterSignOutFallbackRedirectUrl')
	) {
		addResult('provider.tsx afterSignOut', 'pass', 'afterSignOut redirect configured');
	} else {
		addResult('provider.tsx afterSignOut', 'warning', 'afterSignOut redirect not configured');
	}

	// Check localization (PT-BR)
	if (providerContent.includes('ptBR') || providerContent.includes('pt-BR')) {
		addResult('provider.tsx localization', 'pass', 'PT-BR localization configured');
	} else {
		addResult('provider.tsx localization', 'warning', 'PT-BR localization not configured');
	}
}

// Phase 1.3: Validate Clerk Components
function validateClerkComponents() {
	console.log('\n📋 Phase 1.3: Validating Clerk Components\n');

	const rootRoutePath = join(process.cwd(), 'src/routes/__root.tsx');

	if (!existsSync(rootRoutePath)) {
		addResult('__root.tsx', 'fail', 'src/routes/__root.tsx not found');
		return;
	}

	const rootContent = readFileSync(rootRoutePath, 'utf-8');

	// Check for SignedIn component
	if (rootContent.includes('<SignedIn>') || rootContent.includes('SignedIn')) {
		addResult('SignedIn component', 'pass', 'SignedIn component used');
	} else {
		addResult('SignedIn component', 'fail', 'SignedIn component not found');
	}

	// Check for SignedOut component
	if (rootContent.includes('<SignedOut>') || rootContent.includes('SignedOut')) {
		addResult('SignedOut component', 'pass', 'SignedOut component used');
	} else {
		addResult('SignedOut component', 'fail', 'SignedOut component not found');
	}

	// Check for RedirectToSignIn
	if (rootContent.includes('RedirectToSignIn')) {
		addResult('RedirectToSignIn', 'pass', 'RedirectToSignIn component used');
	} else {
		addResult('RedirectToSignIn', 'warning', 'RedirectToSignIn component not found');
	}

	// Check imports from @clerk/clerk-react
	if (rootContent.includes("@clerk/clerk-react")) {
		addResult('@clerk/clerk-react imports', 'pass', 'Using @clerk/clerk-react package');
	} else {
		addResult('@clerk/clerk-react imports', 'fail', 'Not importing from @clerk/clerk-react');
	}
}

// Phase 2.1: Validate Clerk Configuration via API
async function validateClerkAPI() {
	console.log('\n📋 Phase 2.1: Validating Clerk API Configuration\n');

	const secretKey = getEnvVar('CLERK_SECRET_KEY');
	if (!secretKey) {
		addResult('Clerk API test', 'fail', 'Cannot test Clerk API without CLERK_SECRET_KEY');
		return;
	}

	try {
		const clerkClient = createClerkClient({ secretKey });
		const userList = await clerkClient.users.getUserList({ limit: 1 });

		addResult('Clerk API connection', 'pass', 'Successfully connected to Clerk API', [
			`Total users: ${userList.totalCount}`,
		]);
	} catch (error) {
		addResult('Clerk API connection', 'fail', 'Failed to connect to Clerk API', [
			error instanceof Error ? error.message : 'Unknown error',
		]);
	}
}

// Phase 3.1: Validate Webhook Handler
function validateWebhookHandler() {
	console.log('\n📋 Phase 3.1: Validating Webhook Handler\n');

	const webhookPath = join(process.cwd(), 'src/server/webhooks/clerk.ts');

	if (!existsSync(webhookPath)) {
		addResult('webhook handler', 'fail', 'src/server/webhooks/clerk.ts not found');
		return;
	}

	const webhookContent = readFileSync(webhookPath, 'utf-8');

	// Check for required imports
	const requiredImports = ['@clerk/backend', 'svix', 'CLERK_WEBHOOK_SECRET'];
	const missingImports: string[] = [];

	for (const imp of requiredImports) {
		if (!webhookContent.includes(imp)) {
			missingImports.push(imp);
		}
	}

	if (missingImports.length > 0) {
		addResult('webhook imports', 'fail', 'Missing required imports', missingImports);
	} else {
		addResult('webhook imports', 'pass', 'All required imports present');
	}

	// Check for webhook events
	const requiredEvents = ['user.created', 'user.updated', 'user.deleted'];
	const missingEvents: string[] = [];

	for (const event of requiredEvents) {
		if (!webhookContent.includes(event)) {
			missingEvents.push(event);
		}
	}

	if (missingEvents.length > 0) {
		addResult('webhook events', 'fail', 'Missing webhook event handlers', missingEvents);
	} else {
		addResult('webhook events', 'pass', 'All required webhook events handled');
	}

	// Check for signature verification
	if (webhookContent.includes('Webhook') && webhookContent.includes('verify')) {
		addResult('webhook verification', 'pass', 'Webhook signature verification implemented');
	} else {
		addResult('webhook verification', 'fail', 'Webhook signature verification not found');
	}
}

// Phase 4.1: Validate Route Guards
function validateRouteGuards() {
	console.log('\n📋 Phase 4.1: Validating Route Guards\n');

	const rootRoutePath = join(process.cwd(), 'src/routes/__root.tsx');
	const routeGuardPath = join(process.cwd(), 'src/lib/auth/route-guard.tsx');

	// Check __root.tsx protection
	if (existsSync(rootRoutePath)) {
		const rootContent = readFileSync(rootRoutePath, 'utf-8');

		// Check for public pages array
		if (rootContent.includes('PUBLIC_PAGES') || rootContent.includes('public')) {
			addResult('public pages', 'pass', 'Public pages defined');
		} else {
			addResult('public pages', 'warning', 'Public pages not explicitly defined');
		}

		// Check for route protection logic
		if (rootContent.includes('isPublicPage') || rootContent.includes('SignedIn')) {
			addResult('route protection', 'pass', 'Route protection logic found');
		} else {
			addResult('route protection', 'warning', 'Route protection logic not found');
		}
	}

	// Check route-guard.tsx
	if (existsSync(routeGuardPath)) {
		const guardContent = readFileSync(routeGuardPath, 'utf-8');

		if (guardContent.includes('useAuth') && guardContent.includes('Navigate')) {
			addResult('RouteGuard component', 'pass', 'RouteGuard component implemented');
		} else {
			addResult('RouteGuard component', 'warning', 'RouteGuard component incomplete');
		}
	} else {
		addResult('RouteGuard component', 'warning', 'RouteGuard component not found');
	}
}

// Phase 4.2: Validate Auth Context
function validateAuthContext() {
	console.log('\n📋 Phase 4.2: Validating Auth Context\n');

	const authContextPath = join(process.cwd(), 'src/contexts/AuthContext.tsx');
	const hooksPath = join(process.cwd(), 'src/integrations/clerk/hooks.ts');

	// Check AuthContext
	if (existsSync(authContextPath)) {
		const authContent = readFileSync(authContextPath, 'utf-8');

		if (authContent.includes('useAuth') || authContent.includes('useUser')) {
			addResult('AuthContext hooks', 'pass', 'AuthContext uses Clerk hooks');
		} else {
			addResult('AuthContext hooks', 'warning', 'AuthContext may not use Clerk hooks');
		}
	} else {
		addResult('AuthContext', 'warning', 'AuthContext not found');
	}

	// Check hooks.ts
	if (existsSync(hooksPath)) {
		const hooksContent = readFileSync(hooksPath, 'utf-8');

		if (hooksContent.includes('@clerk/clerk-react')) {
			addResult('custom hooks', 'pass', 'Custom hooks use @clerk/clerk-react');
		} else {
			addResult('custom hooks', 'fail', 'Custom hooks do not use @clerk/clerk-react');
		}

		// Check for re-exports
		if (hooksContent.includes('export') && hooksContent.includes('useAuth')) {
			addResult('hooks re-exports', 'pass', 'Clerk hooks re-exported');
		}
	} else {
		addResult('custom hooks', 'warning', 'Custom hooks file not found');
	}
}

// Print summary
function printSummary() {
	console.log('\n' + '='.repeat(60));
	console.log('📊 VALIDATION SUMMARY');
	console.log('='.repeat(60) + '\n');

	const passed = results.filter((r) => r.status === 'pass').length;
	const failed = results.filter((r) => r.status === 'fail').length;
	const warnings = results.filter((r) => r.status === 'warning').length;

	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	console.log(`⚠️  Warnings: ${warnings}\n`);

	// Group by phase
	const phases = [
		{ name: 'Phase 1.1: Environment Variables', prefix: 'VITE_CLERK_PUBLISHABLE_KEY' },
		{ name: 'Phase 1.2: ClerkProvider Setup', prefix: 'main.tsx' },
		{ name: 'Phase 1.3: Clerk Components', prefix: 'SignedIn' },
		{ name: 'Phase 2.1: Clerk API', prefix: 'Clerk API' },
		{ name: 'Phase 3.1: Webhook Handler', prefix: 'webhook' },
		{ name: 'Phase 4.1: Route Guards', prefix: 'route' },
		{ name: 'Phase 4.2: Auth Context', prefix: 'AuthContext' },
	];

	for (const phase of phases) {
		const phaseResults = results.filter((r) => r.name.includes(phase.prefix));
		if (phaseResults.length > 0) {
			console.log(`\n${phase.name}:`);
			for (const result of phaseResults) {
				const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
				console.log(`  ${icon} ${result.name}: ${result.message}`);
				if (result.details && result.details.length > 0) {
					for (const detail of result.details) {
						console.log(`     • ${detail}`);
					}
				}
			}
		}
	}

	// Show failures and warnings
	if (failed > 0 || warnings > 0) {
		console.log('\n' + '='.repeat(60));
		console.log('🔧 RECOMMENDATIONS');
		console.log('='.repeat(60) + '\n');

		const failures = results.filter((r) => r.status === 'fail');
		if (failures.length > 0) {
			console.log('❌ Critical Issues (must fix):');
			for (const failure of failures) {
				console.log(`  • ${failure.name}: ${failure.message}`);
				if (failure.details) {
					for (const detail of failure.details) {
						console.log(`    - ${detail}`);
					}
				}
			}
		}

		const warningsList = results.filter((r) => r.status === 'warning');
		if (warningsList.length > 0) {
			console.log('\n⚠️  Warnings (recommended to fix):');
			for (const warning of warningsList) {
				console.log(`  • ${warning.name}: ${warning.message}`);
				if (warning.details) {
					for (const detail of warning.details) {
						console.log(`    - ${detail}`);
					}
				}
			}
		}
	}

	console.log('\n' + '='.repeat(60));
	if (failed === 0) {
		console.log('🎉 All critical validations passed!');
		if (warnings > 0) {
			console.log(`⚠️  ${warnings} warning(s) found - review recommendations above`);
		}
	} else {
		console.log(`💥 ${failed} critical issue(s) found - please fix before proceeding`);
		process.exit(1);
	}
	console.log('='.repeat(60) + '\n');
}

// Main execution
async function main() {
	console.log('🚀 Clerk Integration Validation');
	console.log('='.repeat(60));
	console.log('Validating Clerk + React (Vite) integration');
	console.log('Using TanStack Router (not React Router)');
	console.log('='.repeat(60));

	// Phase 1: Configuration Validation
	validateEnvironmentVariables();
	validateClerkProvider();
	validateClerkComponents();

	// Phase 2: CLI/API Validation
	await validateClerkAPI();

	// Phase 3: Webhook Validation
	validateWebhookHandler();

	// Phase 4: Integration Validation
	validateRouteGuards();
	validateAuthContext();

	// Print summary
	printSummary();
}

// Run if executed directly
if (import.meta.main || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
	main().catch((error) => {
		console.error('💥 Validation failed:', error);
		process.exit(1);
	});
}

export { main as validateClerkIntegration };

