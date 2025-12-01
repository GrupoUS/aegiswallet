#!/usr/bin/env bun
/**
 * Pre-Deployment Verification Script
 * Final check before deploying to production
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🚀 Pre-Deployment Verification');
console.log('==============================');

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const checks: CheckResult[] = [];

async function runChecks() {
  console.log('Running pre-deployment checks...\n');

  // 1. Check TypeScript compilation
  try {
    execSync('bun run type-check', { stdio: 'pipe' });
    checks.push({
      name: 'TypeScript Compilation',
      status: 'pass',
      message: 'No TypeScript errors found'
    });
  } catch (error) {
    checks.push({
      name: 'TypeScript Compilation',
      status: 'fail',
      message: 'TypeScript compilation failed'
    });
  }

  // 2. Check build
  try {
    execSync('bun run build', { stdio: 'pipe' });
    checks.push({
      name: 'Application Build',
      status: 'pass',
      message: 'Client and API build successful'
    });
  } catch (error) {
    checks.push({
      name: 'Application Build',
      status: 'fail',
      message: 'Build failed'
    });
  }

  // 3. Check environment variables
  try {
    const envContent = readFileSync('.env', 'utf8');
    const requiredVars = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'];
    const missingVars = requiredVars.filter(varName => !envContent.includes(`${varName}=`));
    
    if (missingVars.length === 0) {
      checks.push({
        name: 'Environment Variables',
        status: 'pass',
        message: 'All required variables present'
      });
    } else {
      checks.push({
        name: 'Environment Variables',
        status: 'fail',
        message: `Missing variables: ${missingVars.join(', ')}`
      });
    }
  } catch (error) {
    checks.push({
      name: 'Environment Variables',
      status: 'fail',
      message: 'Could not read .env file'
    });
  }

  // 4. Check Neon Database configuration
  try {
    const envContent = readFileSync('.env', 'utf8');
    const hasSSL = envContent.includes('sslmode=verify-full');
    const hasChannelBinding = envContent.includes('channel_binding=require');
    const hasBrazilRegion = envContent.includes('sa-east-1');
    
    if (hasSSL && hasChannelBinding && hasBrazilRegion) {
      checks.push({
        name: 'Neon Database Configuration',
        status: 'pass',
        message: 'SSL, channel binding, and Brazil region configured'
      });
    } else {
      const issues = [];
      if (!hasSSL) issues.push('SSL mode');
      if (!hasChannelBinding) issues.push('Channel binding');
      if (!hasBrazilRegion) issues.push('Brazil region');
      
      checks.push({
        name: 'Neon Database Configuration',
        status: 'warn',
        message: `Issues detected: ${issues.join(', ')}`
      });
    }
  } catch (error) {
    checks.push({
      name: 'Neon Database Configuration',
      status: 'fail',
      message: 'Could not validate database configuration'
    });
  }

  // 5. Check package.json versions
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const aiVersion = packageJson.dependencies?.ai;
    
    if (aiVersion && !aiVersion.startsWith('^5.')) {
      checks.push({
        name: 'AI Package Version',
        status: 'pass',
        message: `AI package version ${aiVersion} is compatible`
      });
    } else {
      checks.push({
        name: 'AI Package Version',
        status: 'warn',
        message: `AI package version ${aiVersion} may have compatibility issues`
      });
    }
  } catch (error) {
    checks.push({
      name: 'AI Package Version',
      status: 'fail',
      message: 'Could not check package versions'
    });
  }

  // 6. Check Vercel configuration
  try {
    const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const hasFunctions = vercelConfig.functions;
    const hasRewrites = vercelConfig.rewrites;
    
    if (hasFunctions && hasRewrites) {
      checks.push({
        name: 'Vercel Configuration',
        status: 'pass',
        message: 'Functions and rewrites configured'
      });
    } else {
      checks.push({
        name: 'Vercel Configuration',
        status: 'warn',
        message: 'Vercel configuration may be incomplete'
      });
    }
  } catch (error) {
    checks.push({
      name: 'Vercel Configuration',
      status: 'fail',
      message: 'Could not read vercel.json'
    });
  }
}

function displayResults() {
  console.log('\n📊 Check Results:');
  console.log('================');
  
  let passedCount = 0;
  let failedCount = 0;
  let warnCount = 0;

  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${check.name}: ${check.message}`);
    
    if (check.status === 'pass') passedCount++;
    else if (check.status === 'fail') failedCount++;
    else warnCount++;
  });

  console.log(`\n📈 Summary: ${passedCount} passed, ${warnCount} warnings, ${failedCount} failed`);

  // Overall assessment
  if (failedCount === 0) {
    if (warnCount === 0) {
      console.log('\n🎉 ALL CHECKS PASSED! Ready for production deployment.');
      return true;
    } else {
      console.log('\n⚠️  Ready for deployment with some warnings. Review warnings above.');
      return true;
    }
  } else {
    console.log('\n❌ DEPLOYMENT BLOCKED! Fix failed checks before deploying.');
    return false;
  }
}

async function main() {
  await runChecks();
  const isReady = displayResults();
  
  if (isReady) {
    console.log('\n🚀 Ready to deploy! Use:');
    console.log('   vercel deploy --prod    (for production)');
    console.log('   vercel deploy           (for preview)');
  }
  
  process.exit(isReady ? 0 : 1);
}

main().catch(console.error);
