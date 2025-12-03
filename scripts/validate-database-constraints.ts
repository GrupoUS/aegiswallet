#!/usr/bin/env bun

/**
 * Database Constraints Validation Script
 * 
 * Validates foreign key constraints and identifies orphaned data
 * in user-related tables to ensure data integrity.
 */

import { db } from '@/db/client';
import { users, userPreferences, userSecurity, transactions, bankAccounts, transactionCategories } from '@/db/schema';

console.log('🔍 Database Constraints Validation');
console.log('=================================\n');

async function validateConstraints() {
  const results = {
    orphanedPreferences: 0,
    orphanedSecurity: 0,
    orphanedTransactions: 0,
    orphanedBankAccounts: 0,
    orphanedTransactionCategories: 0,
    nullUserIds: 0,
    totalIssues: 0,
  };

  try {
    // Test 1: Check for orphaned user_preferences
    console.log('📋 Test 1: User Preferences Orphanage');
    const orphanedPreferences = await db
      .select()
      .from(userPreferences)
      .where(
        // Users without corresponding user_id in users table
        // This is a simplified check - in production you'd use NOT EXISTS
        true
      );
    
    // Get all user_preferences and check manually
    const allPreferences = await db.select().from(userPreferences);
    const allUsers = await db.select().from(users);
    const userIds = new Set(allUsers.map(u => u.id));
    
    const orphanedPrefs = allPreferences.filter(pref => !userIds.has(pref.userId));
    console.log(`   ✅ User Preferences: ${allPreferences.length} total, ${orphanedPrefs.length} orphaned`);
    results.orphanedPreferences = orphanedPrefs.length;

    // Test 2: Check for orphaned user_security
    console.log('\n🔐 Test 2: User Security Orphanage');
    const allSecurity = await db.select().from(userSecurity);
    const orphanedSec = allSecurity.filter(sec => !userIds.has(sec.userId));
    console.log(`   ✅ User Security: ${allSecurity.length} total, ${orphanedSec.length} orphaned`);
    results.orphanedSecurity = orphanedSec.length;

    // Test 3: Check for null user_ids in critical tables
    console.log('\n❌ Test 3: NULL User ID Detection');
    
    // Check transactions with NULL user_id
    const transactionsWithNullUserId = await db
      .select()
      .from(transactions)
      .where(transactions.userId.isNull());
    console.log(`   ✅ Transactions with NULL user_id: ${transactionsWithNullUserId.length}`);
    results.nullUserIds += transactionsWithNullUserId.length;

    // Check bank_accounts with NULL user_id  
    const bankAccountsWithNullUserId = await db
      .select()
      .from(bankAccounts)
      .where(bankAccounts.userId.isNull());
    console.log(`   ✅ Bank Accounts with NULL user_id: ${bankAccountsWithNullUserId.length}`);
    results.nullUserIds += bankAccountsWithNullUserId.length;

    // Test 4: Check for orphaned transactions
    console.log('\n💳 Test 4: Transaction Orphanage');
    const allTransactions = await db.select().from(transactions);
    const orphanedTx = allTransactions.filter(tx => !userIds.has(tx.userId));
    console.log(`   ✅ Transactions: ${allTransactions.length} total, ${orphanedTx.length} orphaned`);
    results.orphanedTransactions = orphanedTx.length;

    // Test 5: Check for orphaned bank accounts
    console.log('\n🏦 Test 5: Bank Account Orphanage');
    const allBankAccounts = await db.select().from(bankAccounts);
    const orphanedBa = allBankAccounts.filter(ba => !userIds.has(ba.userId));
    console.log(`   ✅ Bank Accounts: ${allBankAccounts.length} total, ${orphanedBa.length} orphaned`);
    results.orphanedBankAccounts = orphanedBa.length;

    // Test 6: Check for orphaned transaction categories
    console.log('\n📊 Test 6: Transaction Category Orphanage');
    const allCategories = await db.select().from(transactionCategories);
    const orphanedCat = allCategories.filter(cat => !userIds.has(cat.userId));
    console.log(`   ✅ Transaction Categories: ${allCategories.length} total, ${orphanedCat.length} orphaned`);
    results.orphanedTransactionCategories = orphanedCat.length;

    // Calculate total issues
    results.totalIssues = 
      results.orphanedPreferences + 
      results.orphanedSecurity + 
      results.orphanedTransactions + 
      results.orphanedBankAccounts + 
      results.orphanedTransactionCategories + 
      results.nullUserIds;

    // Summary
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================');
    console.log(`Orphaned User Preferences: ${results.orphanedPreferences}`);
    console.log(`Orphaned User Security: ${results.orphanedSecurity}`);
    console.log(`Orphaned Transactions: ${results.orphanedTransactions}`);
    console.log(`Orphaned Bank Accounts: ${results.orphanedBankAccounts}`);
    console.log(`Orphaned Transaction Categories: ${results.orphanedTransactionCategories}`);
    console.log(`NULL User IDs: ${results.nullUserIds}`);
    console.log('------------------------------');
    console.log(`Total Issues Found: ${results.totalIssues}`);

    if (results.totalIssues === 0) {
      console.log('\n✅ All database constraints are valid!');
    } else {
      console.log('\n⚠️  Issues found that need to be addressed.');
      console.log('🔧 Run cleanup script to fix orphaned data.');
    }

    return results;

  } catch (error) {
    console.error('❌ Error during validation:', error);
    throw error;
  }
}

// Run validation if called directly
if (import.meta.main) {
  validateConstraints()
    .then((results) => {
      process.exit(results.totalIssues > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export { validateConstraints };
