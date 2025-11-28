#!/usr/bin/env bun

/**
 * Apply RLS Policies for Clerk + NeonDB Integration
 *
 * This script applies the Row Level Security policies
 * to ensure complete user data isolation following the
 * official Clerk + NeonDB documentation pattern
 */

import { neon } from '@neondatabase/serverless';

// ========================================
// CONFIGURATION
// ========================================

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('❌ DATABASE_URL environment variable is not set');
	process.exit(1);
}

console.log('🔒 Applying RLS policies for Clerk + NeonDB integration...');

// ========================================
// DATABASE CONNECTION
// ========================================

const sql = neon(databaseUrl);

// ========================================
// RLS POLICY SQL
// ========================================

const rlsPoliciesSQL = `
-- Enable RLS on all user tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE boleto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS user_preferences_own ON user_preferences;
DROP POLICY IF EXISTS user_security_own ON user_security;
DROP POLICY IF EXISTS bank_accounts_own ON bank_accounts;
DROP POLICY IF EXISTS transactions_own ON transactions;
DROP POLICY IF EXISTS transaction_categories_own ON transaction_categories;
DROP POLICY IF EXISTS transaction_schedules_own ON transaction_schedules;
DROP POLICY IF EXISTS pix_keys_own ON pix_keys;
DROP POLICY IF EXISTS pix_qr_codes_own ON pix_qr_codes;
DROP POLICY IF EXISTS pix_transactions_own ON pix_transactions;
DROP POLICY IF EXISTS boletos_own ON boletos;
DROP POLICY IF EXISTS boleto_payments_own ON boleto_payments;
DROP POLICY IF EXISTS contacts_own ON contacts;
DROP POLICY IF EXISTS contact_payment_methods_own ON contact_payment_methods;
DROP POLICY IF EXISTS financial_events_own ON financial_events;
DROP POLICY IF EXISTS event_reminders_own ON event_reminders;
DROP POLICY IF EXISTS event_types_own ON event_types;
DROP POLICY IF EXISTS notifications_own ON notifications;
DROP POLICY IF EXISTS notification_logs_own ON notification_logs;
DROP POLICY IF EXISTS alert_rules_own ON alert_rules;
DROP POLICY IF EXISTS chat_sessions_own ON chat_sessions;
DROP POLICY IF EXISTS chat_messages_own ON chat_messages;
DROP POLICY IF EXISTS voice_commands_own ON voice_commands;
DROP POLICY IF EXISTS ai_insights_own ON ai_insights;

-- Create RLS policies
CREATE POLICY user_preferences_own ON user_preferences
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY user_security_own ON user_security
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY bank_accounts_own ON bank_accounts
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY transactions_own ON transactions
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY transaction_categories_own ON transaction_categories
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY transaction_schedules_own ON transaction_schedules
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY pix_keys_own ON pix_keys
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY pix_qr_codes_own ON pix_qr_codes
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY pix_transactions_own ON pix_transactions
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY boletos_own ON boletos
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY boleto_payments_own ON boleto_payments
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY contacts_own ON contacts
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY contact_payment_methods_own ON contact_payment_methods
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY financial_events_own ON financial_events
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY event_reminders_own ON event_reminders
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY event_types_own ON event_types
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY notifications_own ON notifications
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY notification_logs_own ON notification_logs
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY alert_rules_own ON alert_rules
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY chat_sessions_own ON chat_sessions
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY chat_messages_own ON chat_messages
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY voice_commands_own ON voice_commands
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY ai_insights_own ON ai_insights
  FOR ALL TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_pix_transactions_user_id ON pix_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_boletos_user_id ON boletos(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
`;

// ========================================
// APPLY RLS POLICIES
// ========================================

async function applyRlsPolicies() {
	try {
		console.log('📋 Applying RLS policies...');

		// Execute the RLS policies SQL
		const result = await sql(rlsPoliciesSQL);

		console.log('✅ RLS policies applied successfully!');
		console.log('🔐 User data isolation is now enforced at the database level');
		console.log('📊 All user tables now require proper authentication context');

		return result;
	} catch (error) {
		console.error('❌ Error applying RLS policies:', error);
		throw error;
	}
}

// ========================================
// VERIFICATION
// ========================================

async function verifyRlsPolicies() {
	try {
		console.log('🔍 Verifying RLS policies...');

		// Check if RLS is enabled on key tables
		const tables = [
			'user_preferences',
			'bank_accounts',
			'transactions',
			'pix_transactions',
			'chat_sessions',
		];

		for (const table of tables) {
			const [result] = await sql`
				SELECT rowsecurity 
				FROM pg_tables 
				WHERE tablename = ${table}
			`;

			if (result?.rowsecurity) {
				console.log(`✅ RLS enabled on ${table}`);
			} else {
				console.log(`⚠️  RLS not enabled on ${table}`);
			}
		}

		// Check if helper function exists
		const [funcResult] = await sql`
			SELECT 1 FROM pg_proc 
			WHERE proname = 'get_current_user_id'
		`;

		if (funcResult) {
			console.log('✅ get_current_user_id() function exists');
		} else {
			console.log('❌ get_current_user_id() function missing');
		}

		console.log('✅ RLS policy verification completed');
	} catch (error) {
		console.error('❌ Error verifying RLS policies:', error);
		throw error;
	}
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
	try {
		await applyRlsPolicies();
		await verifyRlsPolicies();

		console.log('\n🎉 Clerk + NeonDB integration setup completed!');
		console.log('📝 Next steps:');
		console.log('   1. Restart your application server');
		console.log('   2. Test authentication with Clerk');
		console.log('   3. Verify data isolation between users');
		console.log('   4. Update server actions to use createServerActionDb()');
	} catch (error) {
		console.error('❌ Setup failed:', error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main) {
	main();
}
