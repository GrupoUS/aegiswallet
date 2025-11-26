#!/usr/bin/env bun
/**
 * Supabase smoke test.
 *
 * Inserts a temporary bank account + transaction using the service role and then
 * cleans the records to keep the database pristine.
 */
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
function parseArgs() {
  const args = process.argv.slice(2);
  let userId = process.env.SUPABASE_QA_USER_ID?.trim() ?? '';
  let keepData = false;
  for (const arg of args) {
    if (arg.startsWith('--user=')) {
      userId = arg.replace('--user=', '').trim();
    } else if (arg === '--keep-data') {
      keepData = true;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }
  if (!userId) {
    console.error('❌ Missing QA user id. Pass --user=<uuid> or set SUPABASE_QA_USER_ID.');
    process.exit(1);
  }
  return { keepData, userId };
}
function printHelp() {
  console.log(`Supabase Smoke Test

Options:
  --user=<uuid>     Override the QA user id (defaults to SUPABASE_QA_USER_ID)
  --keep-data       Skip cleanup to inspect created rows
  --help            Show this message

Environment variables:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_QA_USER_ID (optional fallback for --user)
`);
}
async function main() {
  const { userId, keepData } = parseArgs();
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is not defined.');
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not defined.');
    process.exit(1);
  }
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const smokeSuffix = randomUUID();
  const belvoAccountId = `manual_smoke_${smokeSuffix}`;
  const institutionName = 'QA Smoke Bank';
  console.log('🚀 Starting Supabase smoke test...');
  console.log(`• Using user_id: ${userId}${process.env.SUPABASE_QA_USER_ID ? ' (from env)' : ''}`);
  const accountPayload = {
    account_holder_name: 'QA Smoke User',
    account_mask: '**** 5678',
    account_type: 'checking',
    available_balance: 123.45,
    balance: 123.45,
    belvo_account_id: belvoAccountId,
    currency: 'BRL',
    institution_id: 'qa_smoke_institution',
    institution_name: institutionName,
    is_active: true,
    is_primary: false,
    sync_status: 'manual',
    user_id: userId,
  };
  const { data: account, error: accountError } = await client
    .from('bank_accounts')
    .insert(accountPayload)
    .select('id')
    .single();
  if (accountError || !account) {
    console.error('❌ Failed to insert bank account:', accountError?.message);
    process.exit(1);
  }
  console.log(`✅ Bank account inserted: ${account.id}`);
  const transactionPayload = {
    account_id: account.id,
    amount: 42.5,
    currency: 'BRL',
    description: 'QA Smoke Transaction',
    is_manual_entry: true,
    status: 'posted',
    transaction_date: new Date().toISOString(),
    transaction_type: 'debit',
    user_id: userId,
  };
  const { data: transaction, error: transactionError } = await client
    .from('transactions')
    .insert(transactionPayload)
    .select('id')
    .single();
  if (transactionError || !transaction) {
    console.error('❌ Failed to insert transaction:', transactionError?.message);
    await client.from('bank_accounts').delete().eq('id', account.id);
    process.exit(1);
  }
  console.log(`✅ Transaction inserted: ${transaction.id}`);
  if (!keepData) {
    console.log('🧹 Cleaning up smoke data...');
    await client.from('transactions').delete().eq('id', transaction.id);
    await client.from('bank_accounts').delete().eq('id', account.id);
    console.log('✅ Smoke data cleaned up.');
  } else {
    console.log('⚠️ Keeping inserted data as requested (--keep-data).');
  }
  console.log('🎉 Smoke test completed successfully!');
}
main().catch((error) => {
  console.error('❌ Smoke test failed with unexpected error:', error);
  process.exit(1);
});
