/**
 * Diagnose Bank Accounts Error
 * 
 * Script para diagnosticar erros 500 na criação de contas bancárias
 * Verifica: usuários, organizações, contas bancárias, chaves estrangeiras
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';

async function diagnose() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error('❌ DATABASE_URL environment variable is not set');
		process.exit(1);
	}

	console.log('\n🔍 DIAGNÓSTICO: Erro de Criação de Contas Bancárias');
	console.log('==================================================\n');

	const sql = neon(databaseUrl);
	const db = drizzle(sql, { schema });

	// 1. Verificar tabelas existentes
	console.log('📋 1. Verificando tabelas do schema...');
	try {
		const tablesResult = await sql`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public' 
			ORDER BY table_name
		`;
		console.log('   ✅ Tabelas encontradas:', tablesResult.map((r: any) => r.table_name).join(', '));
	} catch (e: any) {
		console.log('   ❌ Erro ao listar tabelas:', e.message);
	}

	// 2. Verificar estrutura da tabela users
	console.log('\n📋 2. Verificando estrutura da tabela users...');
	try {
		const usersColumns = await sql`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns 
			WHERE table_name = 'users' AND table_schema = 'public'
			ORDER BY ordinal_position
		`;
		console.log('   ✅ Colunas da tabela users:');
		usersColumns.forEach((col: any) => {
			console.log(`      - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
		});
	} catch (e: any) {
		console.log('   ❌ Erro ao verificar estrutura:', e.message);
	}

	// 3. Verificar estrutura da tabela bank_accounts
	console.log('\n📋 3. Verificando estrutura da tabela bank_accounts...');
	try {
		const bankColumns = await sql`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns 
			WHERE table_name = 'bank_accounts' AND table_schema = 'public'
			ORDER BY ordinal_position
		`;
		console.log('   ✅ Colunas da tabela bank_accounts:');
		bankColumns.forEach((col: any) => {
			console.log(`      - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
		});
	} catch (e: any) {
		console.log('   ❌ Erro ao verificar estrutura:', e.message);
	}

	// 4. Verificar foreign keys
	console.log('\n📋 4. Verificando foreign keys...');
	try {
		const fks = await sql`
			SELECT
				tc.constraint_name,
				tc.table_name,
				kcu.column_name,
				ccu.table_name AS foreign_table_name,
				ccu.column_name AS foreign_column_name
			FROM information_schema.table_constraints AS tc
			JOIN information_schema.key_column_usage AS kcu
				ON tc.constraint_name = kcu.constraint_name
				AND tc.table_schema = kcu.table_schema
			JOIN information_schema.constraint_column_usage AS ccu
				ON ccu.constraint_name = tc.constraint_name
				AND ccu.table_schema = tc.table_schema
			WHERE tc.constraint_type = 'FOREIGN KEY'
			AND tc.table_name IN ('bank_accounts', 'transactions', 'organization_members')
		`;
		console.log('   ✅ Foreign keys encontradas:');
		fks.forEach((fk: any) => {
			console.log(`      - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
		});
	} catch (e: any) {
		console.log('   ❌ Erro ao verificar foreign keys:', e.message);
	}

	// 5. Contar registros
	console.log('\n📋 5. Contando registros...');
	try {
		const counts = await sql`
			SELECT 
				(SELECT COUNT(*) FROM users) as users_count,
				(SELECT COUNT(*) FROM organizations) as orgs_count,
				(SELECT COUNT(*) FROM bank_accounts) as accounts_count,
				(SELECT COUNT(*) FROM subscriptions) as subs_count
		`;
		console.log('   ✅ Registros:');
		console.log(`      - Usuários: ${counts[0].users_count}`);
		console.log(`      - Organizações: ${counts[0].orgs_count}`);
		console.log(`      - Contas Bancárias: ${counts[0].accounts_count}`);
		console.log(`      - Assinaturas: ${counts[0].subs_count}`);
	} catch (e: any) {
		console.log('   ❌ Erro ao contar registros:', e.message);
	}

	// 6. Listar usuários com detalhes
	console.log('\n📋 6. Listando usuários...');
	try {
		const users = await sql`
			SELECT id, email, full_name, organization_id, is_active, created_at
			FROM users
			ORDER BY created_at DESC
			LIMIT 10
		`;
		console.log('   ✅ Usuários encontrados:');
		users.forEach((u: any) => {
			console.log(`      - ${u.email} (ID: ${u.id.slice(0, 20)}..., Org: ${u.organization_id || 'NULL'})`);
		});
	} catch (e: any) {
		console.log('   ❌ Erro ao listar usuários:', e.message);
	}

	// 7. Verificar organizações
	console.log('\n📋 7. Verificando organizações...');
	try {
		const orgs = await sql`
			SELECT id, name, email, status, created_at
			FROM organizations
			ORDER BY created_at DESC
			LIMIT 10
		`;
		console.log('   ✅ Organizações encontradas:');
		orgs.forEach((o: any) => {
			console.log(`      - ${o.name} (ID: ${o.id.slice(0, 20)}..., Email: ${o.email})`);
		});
	} catch (e: any) {
		console.log('   ❌ Erro ao verificar organizações:', e.message);
	}

	// 8. Verificar contas bancárias
	console.log('\n📋 8. Verificando contas bancárias...');
	try {
		const accounts = await sql`
			SELECT id, user_id, institution_name, account_type, balance, sync_status, created_at
			FROM bank_accounts
			ORDER BY created_at DESC
			LIMIT 10
		`;
		console.log('   ✅ Contas bancárias encontradas:');
		if (accounts.length === 0) {
			console.log('      (nenhuma conta bancária encontrada)');
		} else {
			accounts.forEach((a: any) => {
				console.log(`      - ${a.institution_name} (User: ${a.user_id?.slice(0, 15)}..., Balance: ${a.balance})`);
			});
		}
	} catch (e: any) {
		console.log('   ❌ Erro ao verificar contas bancárias:', e.message);
	}

	// 9. Verificar usuários SEM organização
	console.log('\n📋 9. Verificando usuários sem organização válida...');
	try {
		const orphanUsers = await sql`
			SELECT u.id, u.email, u.organization_id
			FROM users u
			LEFT JOIN organizations o ON u.organization_id = o.id
			WHERE u.organization_id IS NULL 
			   OR u.organization_id = 'default'
			   OR o.id IS NULL
		`;
		if (orphanUsers.length > 0) {
			console.log('   ⚠️  Usuários sem organização válida:');
			orphanUsers.forEach((u: any) => {
				console.log(`      - ${u.email} (Org: ${u.organization_id || 'NULL'})`);
			});
		} else {
			console.log('   ✅ Todos os usuários têm organizações válidas');
		}
	} catch (e: any) {
		console.log('   ❌ Erro ao verificar:', e.message);
	}

	// 10. Verificar assinaturas
	console.log('\n📋 10. Verificando assinaturas...');
	try {
		const subs = await sql`
			SELECT id, user_id, stripe_customer_id, plan_id, status
			FROM subscriptions
			ORDER BY created_at DESC
			LIMIT 10
		`;
		console.log('   ✅ Assinaturas encontradas:');
		if (subs.length === 0) {
			console.log('      (nenhuma assinatura encontrada)');
		} else {
			subs.forEach((s: any) => {
				console.log(`      - User: ${s.user_id?.slice(0, 15)}... Plan: ${s.plan_id}, Status: ${s.status}`);
			});
		}
	} catch (e: any) {
		console.log('   ❌ Erro ao verificar assinaturas:', e.message);
	}

	// 11. Testar criação simulada
	console.log('\n📋 11. Simulando criação de conta bancária...');
	const testUserId = 'user_365eNZQx0xQcmSHO4Xi3ynlPmkc'; // Usar um usuário existente
	try {
		// Verificar se o usuário existe
		const userExists = await sql`SELECT id, email FROM users WHERE id = ${testUserId}`;
		if (userExists.length === 0) {
			console.log(`   ❌ Usuário ${testUserId} NÃO existe no banco!`);
			console.log('   📌 Este é provavelmente o motivo do erro 500!');
		} else {
			console.log(`   ✅ Usuário existe: ${userExists[0].email}`);
			
			// Verificar se podemos inserir (sem realmente inserir)
			console.log('   📌 Testando INSERT simulado...');
			const testId = crypto.randomUUID();
			try {
				// Tentar inserir e fazer rollback
				await sql`
					INSERT INTO bank_accounts (id, user_id, belvo_account_id, institution_id, institution_name, account_type, account_mask, balance, currency, sync_status)
					VALUES (${testId}, ${testUserId}, ${'manual_test_' + testId}, 'test_inst', 'Banco Teste', 'CHECKING', '**** 1234', '0', 'BRL', 'manual')
					RETURNING id
				`;
				console.log('   ✅ INSERT de teste bem sucedido!');
				// Limpar o registro de teste
				await sql`DELETE FROM bank_accounts WHERE id = ${testId}`;
				console.log('   ✅ Registro de teste removido');
			} catch (insertError: any) {
				console.log('   ❌ Erro no INSERT:', insertError.message);
				console.log('   📌 Detalhes:', insertError);
			}
		}
	} catch (e: any) {
		console.log('   ❌ Erro na simulação:', e.message);
	}

	// 12. Verificar environment variables
	console.log('\n📋 12. Verificando variáveis de ambiente...');
	const envVars = [
		'DATABASE_URL',
		'CLERK_SECRET_KEY',
		'STRIPE_SECRET_KEY',
		'VITE_CLERK_PUBLISHABLE_KEY',
	];
	envVars.forEach((varName) => {
		const value = process.env[varName];
		if (value) {
			console.log(`   ✅ ${varName}: configurada (${value.slice(0, 10)}...)`);
		} else {
			console.log(`   ❌ ${varName}: NÃO CONFIGURADA`);
		}
	});

	console.log('\n==================================================');
	console.log('🔍 DIAGNÓSTICO COMPLETO\n');
}

diagnose().catch(console.error);
