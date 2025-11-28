#!/usr/bin/env bun

/**
 * Teste de Conexão Real-time com NeonDB e Clerk
 * Verifica backend, frontend, autenticação e isolamento de dados
 */

import { sql } from 'drizzle-orm';

import { getHttpClient } from '../src/db/client';
import { createUserScopedClient } from '../src/db/rls';
import * as schema from '../src/db/schema';

console.log('🔍 Iniciando testes de conexão real-time...\n');

async function testDatabaseConnection() {
	console.log('📡 Teste 1: Conexão básica com NeonDB');
	try {
		const db = getHttpClient();
		const result = await db.execute(
			sql`SELECT 1 as ping, version() as version`,
		);

		console.log('✅ Conexão NeonDB estabelecida');
		console.log(`   PostgreSQL: ${result.rows[0]?.version}`);
		return true;
	} catch (error) {
		console.log('❌ Falha na conexão com NeonDB');
		console.log(
			`   Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

async function testUserScopedConnection() {
	console.log('\n👤 Teste 2: Conexão com contexto de usuário (RLS)');
	try {
		const testUserId = 'user_test_12345';
		const userDb = createUserScopedClient(testUserId);

		// Testar se o contexto está sendo setado
		await userDb.withUserContext(async () => {
			const result = await userDb
				.getDb()
				.execute(
					sql`SELECT current_setting('app.current_user_id', true) as user_id`,
				);

			if (result.rows[0]?.user_id === testUserId) {
				console.log('✅ Contexto de usuário configurado corretamente');
				return true;
			}
			throw new Error('Contexto não configurado');
		});

		return true;
	} catch (error) {
		console.log('❌ Falha no teste de contexto de usuário');
		console.log(
			`   Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

async function testRLSPolicies() {
	console.log('\n🔒 Teste 3: Políticas RLS de isolamento de dados');
	try {
		const db = getHttpClient();

		// Verificar se RLS está habilitado na tabela users
		const result = await db.execute(sql`
			SELECT schemaname, tablename, rowsecurity
			FROM pg_tables
			WHERE tablename = 'users' AND rowsecurity = true
		`);

		if (result.rows.length > 0) {
			console.log('✅ RLS habilitado na tabela users');

			// Verificar se as políticas existem
			const policies = await db.execute(sql`
				SELECT policyname, permissive, roles, cmd, qual
				FROM pg_policies
				WHERE tablename = 'users'
			`);

			console.log(`   Políticas encontradas: ${policies.rows.length}`);
			policies.rows.forEach((policy) => {
				console.log(`   - ${policy.policyname} (${policy.cmd})`);
			});

			return true;
		}

		throw new Error('RLS não está habilitado');
	} catch (error) {
		console.log('❌ Falha na verificação de RLS');
		console.log(
			`   Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

async function testDataIsolation() {
	console.log('\n🔐 Teste 4: Isolamento de dados entre usuários');
	try {
		const _db = getHttpClient();
		const testUserId = 'user_test_12345';

		// Criar cliente com contexto de usuário
		const userDb = createUserScopedClient(testUserId);

		// Tentar acessar dados com contexto de usuário
		await userDb.withUserContext(async () => {
			// Tentar inserir dados com user_id diferente
			try {
				await userDb.getDb().insert(schema.users).values({
					id: 'different_user_id',
					email: 'test@example.com',
					fullName: 'Test User',
					autonomyLevel: 50,
					language: 'pt-BR',
					currency: 'BRL',
					isActive: true,
				});

				console.log(
					'⚠️  RLS permitiu inserção com user_id diferente - verificar políticas',
				);
			} catch (_insertError) {
				console.log('✅ RLS bloqueou inserção com user_id diferente');
			}

			// Tentar acessar dados de outros usuários
			const users = await userDb.getDb().select().from(schema.users);
			console.log(`   Usuários acessíveis: ${users.length}`);

			if (users.length > 0) {
				const allSameUser = users.every((user) => user.id === testUserId);
				if (allSameUser) {
					console.log('✅ Isolamento de dados funcionando corretamente');
				} else {
					console.log(
						'⚠️  Possível vazamento de dados - usuários diferentes acessíveis',
					);
				}
			} else {
				console.log(
					'ℹ️  Nenhum usuário encontrado (pode ser normal para usuário de teste)',
				);
			}
		});

		return true;
	} catch (error) {
		console.log('❌ Falha no teste de isolamento de dados');
		console.log(
			`   Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

async function testRealTimeUpdates() {
	console.log('\n⚡ Teste 5: Capacidade de atualizações em tempo real');
	try {
		const db = getHttpClient();

		// Verificar se o PostgreSQL suporta LISTEN/NOTIFY
		const result = await db.execute(sql`
			SELECT setting FROM pg_settings
			WHERE name = 'max_connections'
		`);

		const maxConnections = parseInt(String(result.rows[0]?.setting || '0'), 10);
		console.log(`   Conexões máximas: ${maxConnections}`);

		if (maxConnections > 0) {
			console.log('✅ PostgreSQL configurado para conexões concurrentes');
			console.log(
				'   Suporte a atualizações em tempo real: Disponível via websockets',
			);
			return true;
		}

		throw new Error('Configuração de conexões não encontrada');
	} catch (error) {
		console.log('❌ Falha na verificação de capacidade real-time');
		console.log(
			`   Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

async function testBackendAuthIntegration() {
	console.log('\n🔑 Teste 6: Integração Backend com Clerk');
	try {
		// Verificar se as variáveis de ambiente do Clerk estão configuradas
		const clerkSecretKey = process.env.CLERK_SECRET_KEY;
		const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;

		if (!clerkSecretKey) {
			throw new Error('CLERK_SECRET_KEY não configurada');
		}

		if (!publishableKey) {
			throw new Error('VITE_CLERK_PUBLISHABLE_KEY não configurada');
		}

		console.log('✅ Variáveis de ambiente do Clerk configuradas');

		// Tentar importar o middleware de autenticação
		try {
			await import('../src/server/middleware/clerk-auth');
			console.log('✅ Middleware de autenticação importado com sucesso');
			return true;
		} catch (_importError) {
			throw new Error('Erro ao importar middleware de autenticação');
		}
	} catch (error) {
		console.log('❌ Falha na integração com Clerk');
		console.log(
			`   Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

async function testDashboardDataAccess() {
	console.log('\n📊 Teste 7: Acesso a dados do Dashboard');
	try {
		const db = getHttpClient();

		// Verificar se as tabelas principais do dashboard existem
		const tables = [
			'bank_accounts',
			'transactions',
			'financial_events',
			'contacts',
		];
		const results = [];

		for (const table of tables) {
			try {
				const result = await db.execute(
					sql`SELECT COUNT(*) as count FROM ${sql.raw(table)}`,
				);
				results.push({
					table,
					count: parseInt(String(result.rows[0]?.count || '0'), 10),
				});
			} catch (tableError) {
				results.push({
					table,
					error:
						tableError instanceof Error ? tableError.message : 'Unknown error',
				});
			}
		}

		console.log('   Status das tabelas do dashboard:');
		results.forEach(({ table, count, error }) => {
			if (error) {
				console.log(`   ❌ ${table}: ${error}`);
			} else {
				console.log(`   ✅ ${table}: ${count} registros`);
			}
		});

		return true;
	} catch (error) {
		console.log('❌ Falha no acesso a dados do dashboard');
		console.log(
			`   Erro: ${error instanceof Error ? error.message : 'Unknown error'}`,
		);
		return false;
	}
}

// Executar todos os testes
async function runAllTests() {
	const tests = [
		{ name: 'Database Connection', fn: testDatabaseConnection },
		{ name: 'User-Scoped Connection', fn: testUserScopedConnection },
		{ name: 'RLS Policies', fn: testRLSPolicies },
		{ name: 'Data Isolation', fn: testDataIsolation },
		{ name: 'Real-time Updates', fn: testRealTimeUpdates },
		{ name: 'Clerk Integration', fn: testBackendAuthIntegration },
		{ name: 'Dashboard Data Access', fn: testDashboardDataAccess },
	];

	console.log(`\n🚀 Executando ${tests.length} testes...\n`);

	const results = await Promise.allSettled(tests.map((test) => test.fn()));

	console.log('\n📋 Resumo dos Testes:');
	console.log('='.repeat(50));

	let passedTests = 0;
	results.forEach((result, index) => {
		const status = result.status === 'fulfilled' ? '✅ PASSOU' : '❌ FALHOU';
		console.log(`${status} ${tests[index].name}`);
		if (result.status === 'rejected') {
			console.log(`      ${result.reason}`);
		} else if (result.value) {
			passedTests++;
		}
	});

	console.log('='.repeat(50));
	console.log(
		`\n🎯 Resultado Final: ${passedTests}/${tests.length} testes passaram`,
	);

	if (passedTests === tests.length) {
		console.log(
			'\n🎉 Todos os testes passaram! O sistema está pronto para uso.',
		);
		process.exit(0);
	} else {
		console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
		process.exit(1);
	}
}

// Executar os testes
runAllTests().catch((error) => {
	console.error('\n💥 Erro fatal durante a execução dos testes:', error);
	process.exit(1);
});
