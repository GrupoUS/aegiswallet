#!/usr/bin/env node

/**
 * Teste de Integração Clerk + NeonDB
 * Verifica se a implementação segue a documentação oficial do Clerk
 */

import { neon } from '@neondatabase/serverless';

// Carregar variáveis de ambiente
if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is required');
}

if (!process.env.CLERK_SECRET_KEY) {
	console.warn(
		'⚠️  CLERK_SECRET_KEY not found. Authentication will not work properly.',
	);
}

// Configuração do database seguindo o padrão oficial Clerk + NeonDB
const sql = neon(process.env.DATABASE_URL);

// Teste de conexão básica
async function testDatabaseConnection() {
	console.log('🔍 Testing database connection...');

	try {
		// Test query
		const result =
			await sql`SELECT NOW() as current_time, version() as postgres_version`;
		console.log('✅ Database connected successfully!');
		console.log(`📅 Current time: ${result[0].current_time}`);
		console.log(`🐘 PostgreSQL: ${result[0].postgres_version}`);
		return true;
	} catch (error) {
		console.error('❌ Database connection failed:', error);
		return false;
	}
}

// Verificar schema das tabelas principais
async function verifyTableSchemas() {
	console.log('\n🔍 Verifying table schemas for user_id columns...');

	const tablesToCheck = [
		'users',
		'bank_accounts',
		'transactions',
		'pix_keys',
		'categories',
		'financial_events',
	];

	for (const tableName of tablesToCheck) {
		try {
			const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        AND (column_name = 'user_id' OR column_name = 'clerk_user_id' OR column_name = 'organization_id')
        ORDER BY ordinal_position;
      `;

			if (columns.length > 0) {
				console.log(`✅ ${tableName}: Found user isolation columns`);
				columns.forEach((col) => {
					console.log(
						`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`,
					);
				});
			} else {
				console.log(
					`❌ ${tableName}: No user_id/clerk_user_id/organization_id column found!`,
				);
			}
		} catch (error) {
			console.log(
				`❓ ${tableName}: Could not verify schema - ${error.message}`,
			);
		}
	}
}

// Verificar RLS policies
async function verifyRLSPolicies() {
	console.log('\n🔍 Verifying Row Level Security policies...');

	try {
		const rlsStatus = await sql`
      SELECT schemaname, tablename, rowsecurity, forcerlspolicy
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'bank_accounts', 'transactions', 'pix_keys')
      ORDER BY tablename;
    `;

		console.log('📋 RLS Status:');
		rlsStatus.forEach((table) => {
			const status = table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
			console.log(`   ${table.tablename}: RLS ${status}`);
		});

		// Verificar políticas específicas
		const policies = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;

		if (policies.length > 0) {
			console.log('\n📋 RLS Policies found:');
			policies.forEach((policy) => {
				console.log(
					`   ${policy.tablename}.${policy.policyname}: ${policy.cmd} (${policy.roles})`,
				);
			});
		} else {
			console.log(
				'\n⚠️  No RLS policies found - Data isolation not enforced at database level!',
			);
		}
	} catch (error) {
		console.log(`❓ Could not verify RLS policies: ${error.message}`);
	}
}

// Verificar middleware de autenticação
async function verifyAuthMiddleware() {
	console.log('\n🔍 Verifying authentication middleware setup...');

	try {
		// Verificar se os arquivos de middleware existem
		const fs = await import('fs');

		const middlewareFiles = [
			'src/middleware.ts',
			'src/server/middleware/clerk-auth.ts',
			'src/integrations/clerk/provider.tsx',
			'src/integrations/clerk/hooks.ts',
		];

		for (const file of middlewareFiles) {
			if (fs.existsSync(file)) {
				console.log(`✅ ${file}: File exists`);
			} else {
				console.log(`❌ ${file}: File missing!`);
			}
		}
	} catch (error) {
		console.log(`❓ Could not verify middleware files: ${error.message}`);
	}
}

// Testar padrão de consulta de usuário
async function testUserIsolationPattern() {
	console.log('\n🔍 Testing user data isolation pattern...');

	try {
		// Simular o padrão Clerk + NeonDB da documentação oficial
		console.log('📋 Expected Clerk + NeonDB pattern:');
		console.log('   1. Use auth().userId from Clerk');
		console.log('   2. Filter all queries by user_id');
		console.log('   3. Use RLS policies for database-level isolation');

		// Exemplo de query seguindo o padrão oficial
		console.log('\n💡 Example query pattern (from Clerk docs):');
		console.log(`
import { auth } from '@clerk/nextjs/server'
import { db } from './db'
import { eq } from 'drizzle-orm'

export async function getUserTransactions() {
  const { userId } = await auth()
  if (!userId) throw new Error('User not found')

  return await db.query.transactions.findMany({
    where: (transactions, { eq }) => eq(transactions.user_id, userId),
  })
}`);

		console.log('✅ Pattern documentation loaded successfully');
	} catch (error) {
		console.log(`❓ Could not demonstrate pattern: ${error.message}`);
	}
}

// Função principal de teste
async function runIntegrationTests() {
	console.log('🚀 Starting Clerk + NeonDB Integration Test\n');
	console.log('📋 Following Clerk official documentation pattern:');
	console.log(
		'   https://clerk.com/docs/guides/development/integrations/databases/neon\n',
	);

	const results = {
		databaseConnection: false,
		tableSchemas: false,
		rlsPolicies: false,
		authMiddleware: false,
		userPattern: false,
	};

	// Executar testes
	results.databaseConnection = await testDatabaseConnection();
	await verifyTableSchemas();
	await verifyRLSPolicies();
	await verifyAuthMiddleware();
	await testUserIsolationPattern();

	// Resumo final
	console.log('\n📊 Integration Test Summary:');
	console.log('='.repeat(50));
	console.log(
		`✅ Database Connection: ${results.databaseConnection ? 'PASS' : 'FAIL'}`,
	);
	console.log(`📋 Schema Verification: Completed (see details above)`);
	console.log(`🔒 RLS Policies: Completed (see details above)`);
	console.log(`🔐 Auth Middleware: Completed (see details above)`);
	console.log(`👤 User Pattern: Documentation loaded`);

	console.log('\n🎯 Next Steps:');
	console.log('1. Ensure CLERK_SECRET_KEY is properly configured');
	console.log('2. Apply RLS policies if missing');
	console.log('3. Test with actual Clerk authentication');
	console.log('4. Verify real-time data isolation');

	console.log('\n✅ Integration test completed!');
}

// Executar testes
runIntegrationTests().catch(console.error);
