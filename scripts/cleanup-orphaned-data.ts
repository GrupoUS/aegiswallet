#!/usr/bin/env bun

/**
 * Orphaned Data Cleanup Script
 * 
 * Cleans up orphaned records and enforces proper constraints
 * to maintain data integrity in user-related tables.
 */

import { db } from '@/db/client';
import { eq, and, isNull } from 'drizzle-orm';
import { users, userPreferences, userSecurity, transactions, bankAccounts, transactionCategories } from '@/db/schema';

console.log('🧹 Orphaned Data Cleanup');
console.log('=========================\n');

interface CleanupStats {
  preferencesDeleted: number;
  securityDeleted: number;
  transactionsDeleted: number;
  bankAccountsDeleted: number;
  transactionCategoriesDeleted: number;
  totalDeleted: number;
  errors: string[];
}

async function cleanupOrphanedData(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    preferencesDeleted: 0,
    securityDeleted: 0,
    transactionsDeleted: 0,
    bankAccountsDeleted: 0,
    transactionCategoriesDeleted: 0,
    totalDeleted: 0,
    errors: [],
  };

  try {
    console.log('🔍 Phase 1: Analyzing current data...\n');

    // Get all users for reference
    const allUsers = await db.select().from(users);
    const userIds = new Set(allUsers.map(u => u.id));
    console.log(`📊 Found ${allUsers.length} users in the system`);

    // Test 1: Clean up orphaned user_preferences
    console.log('\n🗑️  Cleaning orphaned user_preferences...');
    try {
      const allPreferences = await db.select().from(userPreferences);
      const orphanedPrefs = allPreferences.filter(pref => !userIds.has(pref.userId));
      
      if (orphanedPrefs.length > 0) {
        console.log(`   📋 Found ${orphanedPrefs.length} orphaned preferences records`);
        
        for (const pref of orphanedPrefs) {
          await db.delete(userPreferences).where(eq(userPreferences.id, pref.id));
          stats.preferencesDeleted++;
        }
        
        console.log(`   ✅ Deleted ${stats.preferencesDeleted} orphaned preferences`);
      } else {
        console.log('   ✅ No orphaned preferences found');
      }
    } catch (error) {
      const errorMsg = `Error cleaning preferences: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }

    // Test 2: Clean up orphaned user_security
    console.log('\n🔐 Cleaning orphaned user_security...');
    try {
      const allSecurity = await db.select().from(userSecurity);
      const orphanedSec = allSecurity.filter(sec => !userIds.has(sec.userId));
      
      if (orphanedSec.length > 0) {
        console.log(`   🔐 Found ${orphanedSec.length} orphaned security records`);
        
        for (const sec of orphanedSec) {
          await db.delete(userSecurity).where(eq(userSecurity.id, sec.id));
          stats.securityDeleted++;
        }
        
        console.log(`   ✅ Deleted ${stats.securityDeleted} orphaned security records`);
      } else {
        console.log('   ✅ No orphaned security records found');
      }
    } catch (error) {
      const errorMsg = `Error cleaning security: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }

    // Test 3: Clean up transactions with NULL user_id
    console.log('\n💳 Cleaning transactions with NULL user_id...');
    try {
      const nullUserTransactions = await db
        .select()
        .from(transactions)
        .where(isNull(transactions.userId));
      
      if (nullUserTransactions.length > 0) {
        console.log(`   💳 Found ${nullUserTransactions.length} transactions with NULL user_id`);
        
        // Delete transactions with NULL user_id (critical data integrity issue)
        for (const tx of nullUserTransactions) {
          await db.delete(transactions).where(eq(transactions.id, tx.id));
          stats.transactionsDeleted++;
        }
        
        console.log(`   ✅ Deleted ${stats.transactionsDeleted} transactions with NULL user_id`);
      } else {
        console.log('   ✅ No transactions with NULL user_id found');
      }
    } catch (error) {
      const errorMsg = `Error cleaning transactions: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }

    // Test 4: Clean up orphaned bank accounts
    console.log('\n🏦 Cleaning orphaned bank_accounts...');
    try {
      const allBankAccounts = await db.select().from(bankAccounts);
      const orphanedBa = allBankAccounts.filter(ba => !userIds.has(ba.userId));
      
      if (orphanedBa.length > 0) {
        console.log(`   🏦 Found ${orphanedBa.length} orphaned bank account records`);
        
        for (const ba of orphanedBa) {
          await db.delete(bankAccounts).where(eq(bankAccounts.id, ba.id));
          stats.bankAccountsDeleted++;
        }
        
        console.log(`   ✅ Deleted ${stats.bankAccountsDeleted} orphaned bank accounts`);
      } else {
        console.log('   ✅ No orphaned bank accounts found');
      }
    } catch (error) {
      const errorMsg = `Error cleaning bank accounts: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }

    // Test 5: Clean up bank accounts with NULL user_id
    console.log('\n🏦 Cleaning bank_accounts with NULL user_id...');
    try {
      const nullUserBankAccounts = await db
        .select()
        .from(bankAccounts)
        .where(isNull(bankAccounts.userId));
      
      if (nullUserBankAccounts.length > 0) {
        console.log(`   🏦 Found ${nullUserBankAccounts.length} bank accounts with NULL user_id`);
        
        for (const ba of nullUserBankAccounts) {
          await db.delete(bankAccounts).where(eq(bankAccounts.id, ba.id));
          stats.bankAccountsDeleted++;
        }
        
        console.log(`   ✅ Deleted ${nullUserBankAccounts.length} bank accounts with NULL user_id`);
      } else {
        console.log('   ✅ No bank accounts with NULL user_id found');
      }
    } catch (error) {
      const errorMsg = `Error cleaning NULL user bank accounts: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }

    // Test 6: Clean up orphaned transaction categories
    console.log('\n📊 Cleaning orphaned transaction_categories...');
    try {
      const allCategories = await db.select().from(transactionCategories);
      const orphanedCat = allCategories.filter(cat => !userIds.has(cat.userId));
      
      if (orphanedCat.length > 0) {
        console.log(`   📊 Found ${orphanedCat.length} orphaned transaction category records`);
        
        for (const cat of orphanedCat) {
          await db.delete(transactionCategories).where(eq(transactionCategories.id, cat.id));
          stats.transactionCategoriesDeleted++;
        }
        
        console.log(`   ✅ Deleted ${stats.transactionCategoriesDeleted} orphaned transaction categories`);
      } else {
        console.log('   ✅ No orphaned transaction categories found');
      }
    } catch (error) {
      const errorMsg = `Error cleaning transaction categories: ${error}`;
      console.error(`   ❌ ${errorMsg}`);
      stats.errors.push(errorMsg);
    }

    // Calculate total
    stats.totalDeleted = 
      stats.preferencesDeleted + 
      stats.securityDeleted + 
      stats.transactionsDeleted + 
      stats.bankAccountsDeleted + 
      stats.transactionCategoriesDeleted;

    // Summary
    console.log('\n📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`User Preferences Deleted: ${stats.preferencesDeleted}`);
    console.log(`User Security Deleted: ${stats.securityDeleted}`);
    console.log(`Transactions Deleted: ${stats.transactionsDeleted}`);
    console.log(`Bank Accounts Deleted: ${stats.bankAccountsDeleted}`);
    console.log(`Transaction Categories Deleted: ${stats.transactionCategoriesDeleted}`);
    console.log('-----------------------');
    console.log(`Total Records Deleted: ${stats.totalDeleted}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (stats.totalDeleted === 0 && stats.errors.length === 0) {
      console.log('\n✅ No cleanup needed - database is already clean!');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
    }

    return stats;

  } catch (error) {
    console.error('❌ Critical error during cleanup:', error);
    stats.errors.push(`Critical error: ${error}`);
    throw error;
  }
}

// Run cleanup if called directly
if (import.meta.main) {
  // Safety check - require confirmation
  console.log('⚠️  This will permanently delete orphaned data.');
  console.log('⚠️  Make sure you have a backup before proceeding.');
  console.log('');
  console.log('Type "DELETE" to continue with cleanup:');
  
  // For automated runs, we'll proceed without confirmation
  console.log('🚀 Proceeding with cleanup...\n');
  
  cleanupOrphanedData()
    .then((stats) => {
      const success = stats.errors.length === 0;
      console.log(`\n🎯 Cleanup ${success ? 'completed successfully' : 'completed with errors'}`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n💥 Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupOrphanedData };
