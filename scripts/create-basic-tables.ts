// @ts-nocheck - Utility script with runtime-correct but type-incompatible Neon query access patterns
/**
 * Create Basic Database Tables
 *
 * Creates essential tables for the AegisWallet application
 * Run with: bun scripts/create-basic-tables.ts
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon
neonConfig.fetchConnectionCache = true;

async function createBasicTables() {
	console.log('🗄️  Creating basic database tables...');

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	const sqlClient = neon(databaseUrl);
	const db = drizzle(sqlClient);

	try {
		// Create users table
		console.log('   👥 Creating users table...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        phone TEXT,
        cpf TEXT UNIQUE,
        birth_date DATE,
        autonomy_level INTEGER DEFAULT 50,
        voice_command_enabled BOOLEAN DEFAULT true,
        language TEXT DEFAULT 'pt-BR',
        timezone TEXT DEFAULT 'America/Sao_Paulo',
        currency TEXT DEFAULT 'BRL',
        profile_image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create user_preferences table
		console.log('   ⚙️  Creating user_preferences table...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        theme TEXT DEFAULT 'system',
        notifications_email BOOLEAN DEFAULT true,
        notifications_push BOOLEAN DEFAULT true,
        notifications_sms BOOLEAN DEFAULT false,
        auto_categorize BOOLEAN DEFAULT true,
        budget_alerts BOOLEAN DEFAULT true,
        voice_feedback BOOLEAN DEFAULT true,
        accessibility_high_contrast BOOLEAN DEFAULT false,
        accessibility_large_text BOOLEAN DEFAULT false,
        accessibility_screen_reader BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create transaction_categories table
		console.log('   📊 Creating transaction_categories table...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transaction_categories (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        is_system BOOLEAN DEFAULT false,
        parent_id TEXT REFERENCES transaction_categories(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create transactions table
		console.log('   💰 Creating transactions table...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        account_id TEXT,
        category_id TEXT REFERENCES transaction_categories(id),
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        merchant_name TEXT,
        transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
        transaction_type TEXT NOT NULL,
        payment_method TEXT,
        status TEXT DEFAULT 'pending',
        is_recurring BOOLEAN DEFAULT false,
        tags TEXT[],
        confidence_score DECIMAL(3,2),
        is_manual_entry BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create bank_accounts table
		console.log('   🏦 Creating bank_accounts table...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        institution_id TEXT,
        institution_name TEXT,
        account_type TEXT,
        account_mask TEXT,
        balance DECIMAL(15,2),
        available_balance DECIMAL(15,2),
        currency TEXT DEFAULT 'BRL',
        is_active BOOLEAN DEFAULT true,
        is_primary BOOLEAN DEFAULT false,
        last_sync TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create pix_transactions table
		console.log('   🔄 Creating pix_transactions table...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pix_transactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        transaction_id TEXT REFERENCES transactions(id),
        qr_code_id TEXT,
        pix_key TEXT NOT NULL,
        pix_key_type TEXT NOT NULL,
        recipient_name TEXT,
        recipient_document TEXT,
        amount DECIMAL(15,2) NOT NULL,
        description TEXT,
        transaction_type TEXT DEFAULT 'sent',
        status TEXT DEFAULT 'pending',
        end_to_end_id TEXT,
        transaction_timestamp TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create notifications table
		console.log('   🔔 Creating notifications table...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        category TEXT,
        priority TEXT DEFAULT 'medium',
        is_read BOOLEAN DEFAULT false,
        action_url TEXT,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create voice_transcriptions table
		console.log('   🎤 Creating voice_transcriptions table...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS voice_transcriptions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        audio_storage_path TEXT NOT NULL,
        transcript TEXT NOT NULL,
        confidence_score DECIMAL(3,2),
        language TEXT NOT NULL,
        processing_time_ms INTEGER NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create audit_logs table (LGPD compliance)
		console.log('   📋 Creating audit_logs table (LGPD)...');
		await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

		// Create indexes for performance
		console.log('   📈 Creating indexes...');

		// Users indexes
		await db.execute(
			sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
		);
		await db.execute(
			sql`CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);`,
		);

		// Transactions indexes
		await db.execute(
			sql`CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);`,
		);
		await db.execute(
			sql`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);`,
		);

		// PIX transactions indexes
		await db.execute(
			sql`CREATE INDEX IF NOT EXISTS idx_pix_user_created ON pix_transactions(user_id, created_at DESC);`,
		);

		// Notifications indexes
		await db.execute(
			sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);`,
		);

		// Audit logs indexes
		await db.execute(
			sql`CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_logs(user_id, created_at DESC);`,
		);

		// Voice transcriptions indexes
		await db.execute(
			sql`CREATE INDEX IF NOT EXISTS idx_voice_user_created ON voice_transcriptions(user_id, created_at DESC);`,
		);

		// Insert basic transaction categories
		console.log('   📊 Inserting basic transaction categories...');
		const basicCategories = [
			{ name: 'Alimentação', color: '#EF4444', icon: 'utensils' },
			{ name: 'Transporte', color: '#F59E0B', icon: 'car' },
			{ name: 'Moradia', color: '#3B82F6', icon: 'home' },
			{ name: 'Saúde', color: '#10B981', icon: 'heart' },
			{ name: 'Educação', color: '#8B5CF6', icon: 'book' },
			{ name: 'Lazer', color: '#EC4899', icon: 'gamepad-2' },
			{ name: 'Compras', color: '#6366F1', icon: 'shopping-cart' },
			{ name: 'Serviços', color: '#14B8A6', icon: 'wrench' },
			{ name: 'Receitas', color: '#22C55E', icon: 'arrow-down-circle' },
			{ name: 'Outros', color: '#6B7280', icon: 'more-horizontal' },
		];

		for (const category of basicCategories) {
			await db.execute(sql`
        INSERT INTO transaction_categories (name, color, icon, is_system)
        VALUES (${category.name}, ${category.color}, ${category.icon}, true)
        ON CONFLICT (name) DO NOTHING;
      `);
		}

		console.log('✅ All basic tables created successfully!');

		// Verify tables were created
		const tableCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);

		console.log(`📊 Total tables created: ${tableCount[0]?.count}`);
	} catch (error) {
		console.error('❌ Error creating tables:', error);
		throw error;
	}
}

// Run if executed directly
if (import.meta.main) {
	createBasicTables()
		.then(() => {
			console.log('🎉 Database setup completed successfully!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 Database setup failed:', error);
			process.exit(1);
		});
}

export { createBasicTables };
