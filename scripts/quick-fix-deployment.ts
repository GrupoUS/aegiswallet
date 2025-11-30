#!/usr/bin/env bun

/**
 * Quick Deployment Fix Script
 * 
 * Applies the most common fixes for AegisWallet deployment issues
 * This should be run before deploying to production.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

console.log('🔧 Applying quick deployment fixes...\n');

// Fix 1: Update Vercel configuration
console.log('1️⃣ Updating Vercel configuration...');
const vercelPath = path.join(rootDir, 'vercel.json');
let vercelConfig: any = {};

if (existsSync(vercelPath)) {
	vercelConfig = JSON.parse(readFileSync(vercelPath, 'utf-8'));
}

// Ensure proper build command
if (!vercelConfig.buildCommand?.includes('build:api')) {
	vercelConfig.buildCommand = 'bun run routes:generate && bun run build && bun run build:api';
}

// Ensure proper API function configuration
if (!vercelConfig.functions) {
	vercelConfig.functions = {};
}
vercelConfig.functions['api/index.js'] = { maxDuration: 30 };

// Ensure proper API rewrite
const apiRewrite = vercelConfig.rewrites?.find((r: any) => r.source === '/api/(.*)');
if (apiRewrite) {
	apiRewrite.destination = '/api/index.js';
} else {
	if (!vercelConfig.rewrites) vercelConfig.rewrites = [];
	vercelConfig.rewrites.push({
		source: '/api/(.*)',
		destination: '/api/index.js'
	});
}

writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, '\t'));
console.log('✅ Vercel configuration updated');

// Fix 2: Build API
console.log('\n2️⃣ Building API...');
try {
	execSync('bun run build:api', { stdio: 'inherit' });
	console.log('✅ API built successfully');
} catch (error) {
	console.log('❌ API build failed - check logs above');
}

// Fix 3: Check environment variables
console.log('\n3️⃣ Checking environment configuration...');
const envPath = path.join(rootDir, '.env');
const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';

const requiredVars = ['VITE_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'DATABASE_URL'];
const missingVars = requiredVars.filter(varName => 
	!envContent.includes(varName) || envContent.includes(`${varName}=YOUR_`) || envContent.includes(`${varName}_HERE`)
);

if (missingVars.length > 0) {
	console.log('⚠️  Missing environment variables:');
	missingVars.forEach(varName => {
		console.log(`   - ${varName}`);
	});
	console.log('\n📝 To fix, run:');
	missingVars.forEach(varName => {
		console.log(`   vercel env add ${varName} production`);
	});
} else {
	console.log('✅ Environment variables configured');
}

// Fix 4: Validate critical files
console.log('\n4️⃣ Validating critical files...');
const criticalFiles = [
	'api/index.ts',
	'src/server/index.ts',
	'src/server/routes/v1/transactions.ts',
	'src/server/routes/v1/bank-accounts.ts',
	'src/server/routes/v1/users.ts',
];

const missingFiles = criticalFiles.filter(file => !existsSync(path.join(rootDir, file)));

if (missingFiles.length === 0) {
	console.log('✅ All critical files present');
} else {
	console.log('❌ Missing critical files:');
	missingFiles.forEach(file => console.log(`   - ${file}`));
}

console.log('\n🎉 Quick deployment fixes completed!');
console.log('\n📋 Next steps:');
console.log('1. Configure missing environment variables (if any)');
console.log('2. Run: vercel --prod');
console.log('3. Test the deployed application');
