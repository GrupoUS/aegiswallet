#!/usr/bin/env bun

/**
 * Comprehensive Deployment Fix Script
 *
 * This script validates and fixes common deployment issues for AegisWallet
 * including API routing, Clerk configuration, and database connections.
 *
 * Usage:
 *   bun scripts/deployment-fix.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface ValidationResult {
	success: boolean;
	issues: string[];
	fixes: string[];
}

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..');

class DeploymentValidator {
	private issues: string[] = [];
	private fixes: string[] = [];

	/**
	 * Check if file exists
	 */
	private fileExists(filePath: string): boolean {
		return existsSync(path.join(rootDir, filePath));
	}

	/**
	 * Read file content safely
	 */
	private readFile(filePath: string): string | null {
		try {
			return readFileSync(path.join(rootDir, filePath), 'utf-8');
		} catch {
			return null;
		}
	}

	/**
	 * Log issue and potential fix
	 */
	private addIssue(issue: string, fix: string) {
		this.issues.push(issue);
		this.fixes.push(fix);
	}

	/**
	 * Validate API structure
	 */
	validateApiStructure(): void {
		console.log('🔍 Validating API structure...');

		const requiredFiles = [
			'api/index.ts',
			'src/server/index.ts',
			'src/server/vercel.ts',
			'src/server/routes/v1/index.ts',
			'src/server/routes/v1/transactions.ts',
			'src/server/routes/v1/bank-accounts.ts',
			'src/server/routes/v1/users.ts',
		];

		for (const file of requiredFiles) {
			if (!this.fileExists(file)) {
				this.addIssue(
					`Missing required API file: ${file}`,
					`Ensure ${file} exists and is properly configured`,
				);
			}
		}

		// Check API index file
		const apiIndex = this.readFile('api/index.ts');
		if (apiIndex && !apiIndex.includes('handle(app)')) {
			this.addIssue(
				'API index file missing Hono handler export',
				'Ensure api/index.ts exports default handle(app)',
			);
		}

		console.log('✅ API structure validation completed');
	}

	/**
	 * Validate Vercel configuration
	 */
	validateVercelConfig(): void {
		console.log('🔍 Validating Vercel configuration...');

		const vercelConfig = this.readFile('vercel.json');
		if (!vercelConfig) {
			this.addIssue('vercel.json not found', 'Create vercel.json with proper configuration');
			return;
		}

		try {
			const config = JSON.parse(vercelConfig);

			// Check build command
			if (!config.buildCommand?.includes('build:api')) {
				this.addIssue(
					'Build command missing build:api step',
					'Add "bun run build:api" to buildCommand',
				);
			}

			// Check functions configuration
			if (!config.functions?.['api/index.js']) {
				this.addIssue(
					'API function not properly configured',
					'Ensure api/index.js is configured in functions',
				);
			}

			// Check rewrites for API routing
			const apiRewrite = config.rewrites?.find((r: any) => r.source === '/api/(.*)');
			if (!apiRewrite?.destination.includes('api/index.js')) {
				this.addIssue(
					'API rewrite route incorrect',
					'Set destination to "/api/dist/index" for /api/(.*)',
				);
			}
		} catch {
			this.addIssue('Invalid JSON in vercel.json', 'Fix JSON syntax errors');
		}

		console.log('✅ Vercel configuration validation completed');
	}

	/**
	 * Validate Clerk configuration
	 */
	validateClerkConfig(): void {
		console.log('🔍 Validating Clerk configuration...');

		const envFile = this.readFile('.env');
		if (!envFile) {
			this.addIssue('.env file not found', 'Create .env file with required environment variables');
			return;
		}

		// Check for required Clerk variables
		const requiredClerkVars = ['VITE_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'];

		for (const varName of requiredClerkVars) {
			if (!envFile.includes(`${varName}=`) || envFile.includes(`${varName}=YOUR_`)) {
				this.addIssue(
					`Missing or incomplete ${varName}`,
					`Configure proper ${varName} in environment variables`,
				);
			}
		}

		// Check Clerk provider configuration
		const clerkProvider = this.readFile('src/integrations/clerk/provider.tsx');
		if (clerkProvider?.includes('afterSignInUrl')) {
			this.addIssue(
				'Using deprecated Clerk prop: afterSignInUrl',
				'Replace with fallbackRedirectUrl or forceRedirectUrl',
			);
		}

		console.log('✅ Clerk configuration validation completed');
	}

	/**
	 * Validate database configuration
	 */
	validateDatabaseConfig(): void {
		console.log('🔍 Validating database configuration...');

		const envFile = this.readFile('.env');
		if (!envFile) {
			this.addIssue('Environment file not found', 'Create .env with database configuration');
			return;
		}

		// Check for database URL
		if (!envFile.includes('DATABASE_URL=')) {
			this.addIssue(
				'DATABASE_URL not configured',
				'Set DATABASE_URL with Neon PostgreSQL connection string',
			);
		}

		// Check schema files
		const schemaFile = this.readFile('src/db/schema/index.ts');
		if (!schemaFile) {
			this.addIssue(
				'Database schema not found',
				'Ensure src/db/schema/index.ts exists with table definitions',
			);
		}

		console.log('✅ Database configuration validation completed');
	}

	/**
	 * Build API for deployment
	 */
	buildApi(): void {
		console.log('🔨 Building API for deployment...');

		try {
			execSync('bun run build:api', { cwd: rootDir, stdio: 'inherit' });
			console.log('✅ API built successfully');
		} catch {
			this.addIssue('API build failed', 'Check build logs and fix build errors');
		}
	}

	/**
	 * Generate deployment fixes report
	 */
	generateReport(): ValidationResult {
		return {
			success: this.issues.length === 0,
			issues: this.issues,
			fixes: this.fixes,
		};
	}

	/**
	 * Run complete validation
	 */
	run(): ValidationResult {
		console.log('🚀 Starting comprehensive deployment validation...\n');

		this.validateApiStructure();
		this.validateVercelConfig();
		this.validateClerkConfig();
		this.validateDatabaseConfig();

		if (this.issues.length === 0) {
			this.buildApi();
		}

		const report = this.generateReport();

		// Print results
		console.log(`\n${'='.repeat(60)}`);
		console.log('📊 DEPLOYMENT VALIDATION REPORT');
		console.log('='.repeat(60));

		if (report.success) {
			console.log('✅ All validations passed! Ready for deployment.');
		} else {
			console.log(`❌ Found ${report.issues.length} issue(s):\n`);

			report.issues.forEach((issue, index) => {
				console.log(`${index + 1}. ${issue}`);
				console.log(`   💡 Fix: ${report.fixes[index]}\n`);
			});

			console.log('🔧 QUICK FIX COMMANDS:');
			console.log('1. Configure Clerk keys in Vercel dashboard:');
			console.log('   vercel env add VITE_CLERK_PUBLISHABLE_KEY production');
			console.log('   vercel env add CLERK_SECRET_KEY production');
			console.log('\n2. Deploy with latest changes:');
			console.log('   vercel --prod');
		}

		return report;
	}
}

// Run validation if this script is executed directly
if (import.meta.main) {
	const validator = new DeploymentValidator();
	const report = validator.run();

	// Exit with error code if validation failed
	process.exit(report.success ? 0 : 1);
}

export { DeploymentValidator };
