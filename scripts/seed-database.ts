/**
 * Database Seed Script
 *
 * Populates the NeonDB database with test data for development
 * Run: bun scripts/seed-database.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from '../src/db/schema';

// ========================================
// CONFIGURATION
// ========================================

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL environment variable is not set');
	process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

// ========================================
// SEED DATA
// ========================================

const TEST_USER_ID = 'user_test_aegiswallet_dev';
const TEST_USER_EMAIL = 'teste@aegiswallet.dev';

async function seedDatabase() {
	console.log('🌱 Starting database seed...\n');

	try {
		// 1. Create test user
		console.log('👤 Creating test user...');
		await db
			.insert(schema.users)
			.values({
				id: TEST_USER_ID,
				email: TEST_USER_EMAIL,
				fullName: 'Usuário Teste AegisWallet',
				phone: '+5511999999999',
				cpf: '12345678900',
				autonomyLevel: 75,
				voiceCommandEnabled: true,
				language: 'pt-BR',
				timezone: 'America/Sao_Paulo',
				currency: 'BRL',
				isActive: true,
			})
			.onConflictDoNothing();
		console.log('   ✅ Test user created');

		// 2. Create user preferences
		console.log('⚙️ Creating user preferences...');
		await db
			.insert(schema.userPreferences)
			.values({
				userId: TEST_USER_ID,
				theme: 'dark',
				notificationsEmail: true,
				notificationsPush: true,
				notificationsSms: false,
				autoCategorize: true,
				budgetAlerts: true,
				voiceFeedback: true,
				accessibilityHighContrast: false,
				accessibilityLargeText: false,
				accessibilityScreenReader: false,
			})
			.onConflictDoNothing();
		console.log('   ✅ User preferences created');

		// 3. Create transaction categories (global + user-specific)
		console.log('📁 Creating transaction categories...');
		const categories = [
			{
				name: 'Alimentação',
				type: 'expense',
				icon: '🍽️',
				color: '#FF6B6B',
				isDefault: true,
				userId: null,
			},
			{
				name: 'Transporte',
				type: 'expense',
				icon: '🚗',
				color: '#4ECDC4',
				isDefault: true,
				userId: null,
			},
			{
				name: 'Moradia',
				type: 'expense',
				icon: '🏠',
				color: '#45B7D1',
				isDefault: true,
				userId: null,
			},
			{
				name: 'Saúde',
				type: 'expense',
				icon: '🏥',
				color: '#96CEB4',
				isDefault: true,
				userId: null,
			},
			{
				name: 'Educação',
				type: 'expense',
				icon: '📚',
				color: '#FFEAA7',
				isDefault: true,
				userId: null,
			},
			{
				name: 'Lazer',
				type: 'expense',
				icon: '🎮',
				color: '#DDA0DD',
				isDefault: true,
				userId: null,
			},
			{
				name: 'Salário',
				type: 'income',
				icon: '💰',
				color: '#2ECC71',
				isDefault: true,
				userId: null,
			},
			{
				name: 'Freelance',
				type: 'income',
				icon: '💼',
				color: '#3498DB',
				isDefault: true,
				userId: null,
			},
			{
				name: 'Investimentos',
				type: 'income',
				icon: '📈',
				color: '#9B59B6',
				isDefault: true,
				userId: null,
			},
			{
				name: 'PIX Recebido',
				type: 'income',
				icon: '💸',
				color: '#00D4AA',
				isDefault: true,
				userId: null,
			},
		];

		for (const category of categories) {
			await db
				.insert(schema.transactionCategories)
				.values(category)
				.onConflictDoNothing();
		}
		console.log(`   ✅ ${categories.length} categories created`);

		// 4. Create bank accounts
		console.log('🏦 Creating bank accounts...');
		const accountId = crypto.randomUUID();
		await db
			.insert(schema.bankAccounts)
			.values({
				id: accountId,
				userId: TEST_USER_ID,
				belvoAccountId: `belvo_${crypto.randomUUID()}`,
				institutionId: 'nubank',
				institutionName: 'Nubank',
				accountType: 'checking',
				accountMask: '****1234',
				accountHolderName: 'Usuário Teste',
				balance: '5000.00',
				availableBalance: '4500.00',
				currency: 'BRL',
				isActive: true,
				isPrimary: true,
				syncStatus: 'synced',
			})
			.onConflictDoNothing();
		console.log('   ✅ Bank account created');

		// 5. Create PIX keys
		console.log('🔑 Creating PIX keys...');
		await db
			.insert(schema.pixKeys)
			.values({
				userId: TEST_USER_ID,
				keyType: 'CPF',
				keyValue: '12345678900',
				keyName: 'Chave CPF Principal',
				bankName: 'Nubank',
				isActive: true,
				isFavorite: true,
			})
			.onConflictDoNothing();

		await db
			.insert(schema.pixKeys)
			.values({
				userId: TEST_USER_ID,
				keyType: 'EMAIL',
				keyValue: TEST_USER_EMAIL,
				keyName: 'Chave Email',
				bankName: 'Nubank',
				isActive: true,
				isFavorite: false,
			})
			.onConflictDoNothing();
		console.log('   ✅ PIX keys created');

		// 6. Create sample transactions
		console.log('💳 Creating sample transactions...');
		const transactions = [
			{
				description: 'Salário Janeiro',
				amount: '8500.00',
				type: 'income',
				paymentMethod: 'transfer',
			},
			{
				description: 'Aluguel',
				amount: '-2500.00',
				type: 'expense',
				paymentMethod: 'pix',
			},
			{
				description: 'Supermercado Extra',
				amount: '-450.00',
				type: 'expense',
				paymentMethod: 'debit',
			},
			{
				description: 'Uber',
				amount: '-35.50',
				type: 'expense',
				paymentMethod: 'credit',
			},
			{
				description: 'Netflix',
				amount: '-55.90',
				type: 'expense',
				paymentMethod: 'credit',
			},
			{
				description: 'PIX Recebido - João',
				amount: '200.00',
				type: 'income',
				paymentMethod: 'pix',
			},
			{
				description: 'iFood',
				amount: '-89.00',
				type: 'expense',
				paymentMethod: 'credit',
			},
			{
				description: 'Farmácia',
				amount: '-120.00',
				type: 'expense',
				paymentMethod: 'debit',
			},
			{
				description: 'Energia Elétrica',
				amount: '-180.00',
				type: 'expense',
				paymentMethod: 'boleto',
			},
			{
				description: 'Internet',
				amount: '-99.90',
				type: 'expense',
				paymentMethod: 'boleto',
			},
		];

		for (const tx of transactions) {
			await db
				.insert(schema.transactions)
				.values({
					userId: TEST_USER_ID,
					accountId,
					description: tx.description,
					amount: tx.amount,
					transactionType: tx.type,
					paymentMethod: tx.paymentMethod,
					status: 'completed',
					transactionDate: new Date(),
					currency: 'BRL',
				})
				.onConflictDoNothing();
		}
		console.log(`   ✅ ${transactions.length} transactions created`);

		// 7. Create contacts
		console.log('👥 Creating contacts...');
		const contacts = [
			{
				name: 'João Silva',
				email: 'joao@email.com',
				phone: '+5511888888888',
				pixKey: '12345678901',
				pixKeyType: 'CPF',
			},
			{
				name: 'Maria Santos',
				email: 'maria@email.com',
				phone: '+5511777777777',
				pixKey: 'maria@pix.com',
				pixKeyType: 'EMAIL',
			},
			{
				name: 'Pedro Oliveira',
				email: 'pedro@email.com',
				phone: '+5511666666666',
				pixKey: '+5511666666666',
				pixKeyType: 'PHONE',
			},
		];

		for (const contact of contacts) {
			await db
				.insert(schema.contacts)
				.values({
					userId: TEST_USER_ID,
					name: contact.name,
					email: contact.email,
					phone: contact.phone,
					isFavorite: false,
				})
				.onConflictDoNothing();
		}
		console.log(`   ✅ ${contacts.length} contacts created`);

		// 8. Create LGPD consents
		console.log('📋 Creating LGPD consents...');
		const consents = [
			{ type: 'data_processing' as const, granted: true },
			{ type: 'analytics' as const, granted: true },
			{ type: 'voice_recording' as const, granted: true },
			{ type: 'financial_data' as const, granted: true },
			{ type: 'marketing' as const, granted: false },
		];

		for (const consent of consents) {
			await db
				.insert(schema.lgpdConsents)
				.values({
					userId: TEST_USER_ID,
					consentType: consent.type,
					granted: consent.granted,
					consentVersion: '1.0',
					legalBasis: 'consent',
					collectionMethod: 'signup',
					grantedAt: consent.granted ? new Date() : null,
					purpose: `Autorização para ${consent.type.replace('_', ' ')}`,
				})
				.onConflictDoNothing();
		}
		console.log(`   ✅ ${consents.length} LGPD consents created`);

		// 9. Create transaction limits (Brazilian PIX limits)
		console.log('⚠️ Creating transaction limits...');
		const limits = [
			{
				type: 'pix_daytime' as const,
				dailyLimit: '20000.00',
				transactionLimit: '5000.00',
			},
			{
				type: 'pix_nighttime' as const,
				dailyLimit: '1000.00',
				transactionLimit: '1000.00',
			},
			{
				type: 'ted_daily' as const,
				dailyLimit: '50000.00',
				transactionLimit: '50000.00',
			},
		];

		for (const limit of limits) {
			await db
				.insert(schema.transactionLimits)
				.values({
					userId: TEST_USER_ID,
					limitType: limit.type,
					dailyLimit: limit.dailyLimit,
					transactionLimit: limit.transactionLimit,
					currentDailyUsed: '0.00',
					currentMonthlyUsed: '0.00',
					isActive: true,
				})
				.onConflictDoNothing();
		}
		console.log(`   ✅ ${limits.length} transaction limits created`);

		// 10. Create audit log entry
		console.log('📝 Creating audit log...');
		await db
			.insert(schema.auditLogs)
			.values({
				userId: TEST_USER_ID,
				action: 'database_seeded',
				resourceType: 'system',
				success: true,
			})
			.onConflictDoNothing();
		console.log('   ✅ Audit log created');

		console.log('\n✅ Database seed completed successfully!');
		console.log(`\n📊 Summary:`);
		console.log(`   - Test User: ${TEST_USER_EMAIL}`);
		console.log(`   - User ID: ${TEST_USER_ID}`);
		console.log(`   - Categories: ${categories.length}`);
		console.log(`   - Transactions: ${transactions.length}`);
		console.log(`   - Contacts: ${contacts.length}`);
		console.log(`   - LGPD Consents: ${consents.length}`);
		console.log(`   - Transaction Limits: ${limits.length}`);
	} catch (error) {
		console.error('❌ Seed failed:', error);
		process.exit(1);
	}
}

// Run seed
seedDatabase();
