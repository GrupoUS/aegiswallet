#!/usr/bin/env bun

/**
 * Database Health Monitor
 * 
 * Comprehensive database health monitoring and validation
 * for production use with LGPD compliance and performance metrics.
 */

import { db } from '@/db/client';
import { 
  users, 
  userPreferences, 
  userSecurity, 
  transactions, 
  bankAccounts, 
  transactionCategories,
  auditLogs 
} from '@/db/schema';
import { isNull } from 'drizzle-orm';

interface HealthReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  scores: {
    connectivity: number;
    integrity: number;
    performance: number;
    compliance: number;
  };
  metrics: {
    totalUsers: number;
    totalTransactions: number;
    totalBankAccounts: number;
    orphanedRecords: number;
    nullConstraints: number;
  };
  issues: string[];
  recommendations: string[];
}

async function generateHealthReport(): Promise<HealthReport> {
  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    scores: {
      connectivity: 0,
      integrity: 0,
      performance: 0,
      compliance: 0,
    },
    metrics: {
      totalUsers: 0,
      totalTransactions: 0,
      totalBankAccounts: 0,
      orphanedRecords: 0,
      nullConstraints: 0,
    },
    issues: [],
    recommendations: [],
  };

  try {
    console.log('🏥 Database Health Monitor');
    console.log('==========================\n');

    // Test 1: Connectivity
    console.log('🔌 Testing database connectivity...');
    try {
      await db.execute('SELECT 1 as ping');
      report.scores.connectivity = 100;
      console.log('   ✅ Database connectivity: OK');
    } catch (error) {
      report.scores.connectivity = 0;
      report.issues.push(`Database connectivity failed: ${error}`);
      report.status = 'critical';
      console.log(`   ❌ Database connectivity failed: ${error}`);
    }

    // Test 2: Data Integrity
    console.log('\n🔒 Testing data integrity...');
    try {
      const [userCount, prefCount, securityCount] = await Promise.all([
        db.select().from(users),
        db.select().from(userPreferences),
        db.select().from(userSecurity),
      ]);

      report.metrics.totalUsers = userCount.length;

      // Check for orphaned records
      const userIds = new Set(userCount.map(u => u.id));
      const orphanedPrefs = prefCount.filter(p => !userIds.has(p.userId));
      const orphanedSec = securityCount.filter(s => !userIds.has(s.userId));
      
      report.metrics.orphanedRecords = orphanedPrefs.length + orphanedSec.length;
      
      if (report.metrics.orphanedRecords === 0) {
        report.scores.integrity = 100;
        console.log('   ✅ Data integrity: OK (no orphaned records)');
      } else {
        report.scores.integrity = Math.max(0, 100 - (report.metrics.orphanedRecords * 10));
        report.issues.push(`Found ${orphanedPrefs.length} orphaned preferences and ${orphanedSec.length} orphaned security records`);
        report.recommendations.push('Run cleanup-orphaned-data.ts script to fix orphaned records');
        console.log(`   ⚠️  Data integrity: ${report.metrics.orphanedRecords} orphaned records found`);
      }
    } catch (error) {
      report.scores.integrity = 0;
      report.issues.push(`Data integrity check failed: ${error}`);
      if (report.status !== 'critical') report.status = 'warning';
      console.log(`   ❌ Data integrity check failed: ${error}`);
    }

    // Test 3: Performance Metrics
    console.log('\n⚡ Testing performance metrics...');
    try {
      const startTime = Date.now();
      
      const [txCount, baCount, catCount] = await Promise.all([
        db.select().from(transactions).limit(1), // Just test table access
        db.select().from(bankAccounts).limit(1),
        db.select().from(transactionCategories).limit(1),
      ]);
      
      const queryTime = Date.now() - startTime;
      
      // Get actual counts for metrics
      const [actualTxCount, actualBaCount] = await Promise.all([
        db.select({ count: transactions.id }).from(transactions),
        db.select({ count: bankAccounts.id }).from(bankAccounts),
      ]);

      report.metrics.totalTransactions = actualTxCount.length;
      report.metrics.totalBankAccounts = actualBaCount.length;
      
      // Score based on query performance (<100ms = 100, <500ms = 80, <1000ms = 60, else 40)
      if (queryTime < 100) {
        report.scores.performance = 100;
      } else if (queryTime < 500) {
        report.scores.performance = 80;
      } else if (queryTime < 1000) {
        report.scores.performance = 60;
      } else {
        report.scores.performance = 40;
      }
      
      console.log(`   ✅ Performance: ${queryTime}ms (${report.scores.performance}/100)`);
    } catch (error) {
      report.scores.performance = 0;
      report.issues.push(`Performance test failed: ${error}`);
      if (report.status !== 'critical') report.status = 'warning';
      console.log(`   ❌ Performance test failed: ${error}`);
    }

    // Test 4: LGPD Compliance
    console.log('\n🛡️  Testing LGPD compliance...');
    try {
      // Check audit logs exist and are being created
      const auditLogCount = await db.select().from(auditLogs).limit(1);
      
      // Check for NULL constraints in critical fields
      const nullUserIds = await db
        .select()
        .from(transactions)
        .where(isNull(transactions.userId))
        .limit(5);
      
      report.metrics.nullConstraints = nullUserIds.length;
      
      if (auditLogCount.length > 0 && report.metrics.nullConstraints === 0) {
        report.scores.compliance = 100;
        console.log('   ✅ LGPD compliance: OK (audit logs active, no NULL constraints)');
      } else {
        report.scores.compliance = Math.max(0, 100 - (report.metrics.nullConstraints * 20));
        if (report.metrics.nullConstraints > 0) {
          report.issues.push(`Found ${report.metrics.nullConstraints} records with NULL user_id constraints`);
          report.recommendations.push('Run fix-database-schema.ts to enforce NOT NULL constraints');
        }
        if (auditLogCount.length === 0) {
          report.issues.push('No audit logs found - LGPD compliance issue');
          report.recommendations.push('Ensure audit logging is enabled for all user data operations');
        }
        console.log(`   ⚠️  LGPD compliance: Issues detected (${report.scores.compliance}/100)`);
      }
    } catch (error) {
      report.scores.compliance = 0;
      report.issues.push(`LGPD compliance check failed: ${error}`);
      if (report.status !== 'critical') report.status = 'warning';
      console.log(`   ❌ LGPD compliance check failed: ${error}`);
    }

    // Calculate overall status
    const avgScore = (report.scores.connectivity + report.scores.integrity + 
                     report.scores.performance + report.scores.compliance) / 4;
    
    if (avgScore >= 90) {
      report.status = 'healthy';
    } else if (avgScore >= 70) {
      report.status = 'warning';
    } else {
      report.status = 'critical';
    }

    // Generate report
    console.log('\n📊 HEALTH REPORT SUMMARY');
    console.log('========================');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Overall Status: ${report.status.toUpperCase()}`);
    console.log(`Average Score: ${avgScore.toFixed(1)}/100`);
    console.log('\n📈 Scores:');
    console.log(`  Connectivity: ${report.scores.connectivity}/100`);
    console.log(`  Integrity: ${report.scores.integrity}/100`);
    console.log(`  Performance: ${report.scores.performance}/100`);
    console.log(`  Compliance: ${report.scores.compliance}/100`);
    console.log('\n📊 Metrics:');
    console.log(`  Total Users: ${report.metrics.totalUsers}`);
    console.log(`  Total Transactions: ${report.metrics.totalTransactions}`);
    console.log(`  Total Bank Accounts: ${report.metrics.totalBankAccounts}`);
    console.log(`  Orphaned Records: ${report.metrics.orphanedRecords}`);
    console.log(`  NULL Constraints: ${report.metrics.nullConstraints}`);
    
    if (report.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      report.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    return report;

  } catch (error) {
    console.error('❌ Critical error during health check:', error);
    report.status = 'critical';
    report.issues.push(`Critical error: ${error}`);
    return report;
  }
}

// Run health monitor if called directly
if (import.meta.main) {
  generateHealthReport()
    .then((report) => {
      const success = report.status !== 'critical';
      console.log(`\n🎯 Health check completed: ${report.status.toUpperCase()}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Health check failed:', error);
      process.exit(1);
    });
}

export { generateHealthReport };
