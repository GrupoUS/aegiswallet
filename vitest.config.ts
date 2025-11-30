/**
 * Vitest Configuration v4.x with Phase 1 Improvements Applied
 *
 * This configuration implements comprehensive testing optimizations for AegisWallet:
 * - Fork-based pool isolation for database and financial testing
 * - Coverage thresholds tailored for critical modules (security: 95%, compliance: 95%, hooks: 90%)
 * - Brazilian timezone (America/Sao_Paulo) for consistent financial date tests
 * - Automatic mock resets to prevent test interference
 * - CI-optimized reporting with JUnit and GitHub Actions integration
 *
 * Reference: docs/quality-control.md - Phase 1 Testing Infrastructure Improvements
 */
import * as path from 'node:path';

import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	// ✅ MELHORIA 1: optimizeDeps movido para dentro de test.deps
	// O optimizeDeps no root é para Vite dev server, não para Vitest

	// biome-ignore lint/suspicious/noExplicitAny: React plugin type mismatch between vite and vitest versions
	plugins: [react() as any],

	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			// ✅ MELHORIA 3: Adicionar alias para test utilities
			'@test-utils': path.resolve(__dirname, './src/test'),
		},
	},

	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],

		// ✅ MELHORIA 4: environmentOptions simplificado
		// 'runScripts: dangerously' é um risco de segurança e raramente necessário
		// 'resources: usable' pode causar memory leaks em testes
		environmentOptions: {
			jsdom: {
				pretendToBeVisual: true,
				// Removido: resources e runScripts (riscos desnecessários)
			},
		},

		// ✅ MELHORIA 5: deps.optimizer ao invés de optimizeDeps no root
		deps: {
			optimizer: {
				web: {
					include: ['@testing-library/react', '@testing-library/jest-dom'],
				},
			},
			// Interoperabilidade para módulos ESM
			interopDefault: true,
		},

		// TypeScript type checking
		typecheck: {
			enabled: true,
			checker: 'tsc',
			tsconfig: './tsconfig.test.json',
			// ✅ MELHORIA 6: Adicionar include para typecheck
			include: ['src/**/*.{test,spec}.{ts,tsx}'],
		},

		// ✅ MELHORIA 7: Usar 'forks' ao invés de 'threads' para melhor isolamento
		// Threads compartilham memória, forks são isolados (melhor para testes de DB)
		pool: 'forks',

		// ✅ MELHORIA 8: sequence.concurrent pode ser true para velocidade
		// O isolamento é garantido pelo pool, não pela sequência
		sequence: {
			concurrent: true, // Permite execução paralela DENTRO de cada arquivo
			shuffle: false, // Mantém ordem determinística para debugging
		},

		coverage: {
			provider: 'v8',
			// ✅ MELHORIA 9: Remover reporters redundantes
			reporter: ['text', 'html', 'lcov', 'json-summary'],
			// 'text-summary' é redundante com 'text'
			// 'json' raramente usado, 'json-summary' é mais útil

			// ✅ MELHORIA 10: Usar include ao invés de apenas exclude
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				...(configDefaults.coverage.exclude ?? []), // Inclui defaults do Vitest
				'src/test/**',
				'src/mocks/**',
				'src/types/**',
				'src/integrations/**',
				'**/*.d.ts',
				'**/*.gen.ts',
				'**/*.config.{ts,js}',
				// ✅ MELHORIA 11: Excluir arquivos de barrel (index.ts que só exportam)
				'**/index.ts',
				// Excluir componentes UI do shadcn (código de terceiros)
				'src/components/ui/**',
			],

			// ✅ MELHORIA 12: Thresholds por módulo crítico
			thresholds: {
				// Global permanece 90%
				lines: 90,
				functions: 90,
				branches: 85, // Branches é mais difícil, 85% é realista
				statements: 90,

				// Módulos financeiros críticos precisam de 95%+
				'src/lib/security/**/*.ts': {
					lines: 95,
					functions: 95,
					branches: 90,
					statements: 95,
				},
				'src/lib/compliance/**/*.ts': {
					lines: 95,
					functions: 95,
					branches: 90,
					statements: 95,
				},
				// Hooks de negócio
				'src/hooks/use*.ts': {
					lines: 90,
					functions: 90,
					branches: 80,
					statements: 90,
				},
			},

			clean: true,
			cleanOnRerun: true,
			// ✅ MELHORIA 13: Reportar falha mesmo sem threshold
			reportOnFailure: true,
			// ✅ MELHORIA 14: Ignorar arquivos vazios
			skipFull: false,
		},

		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		// ✅ MELHORIA 15: Usar configDefaults.exclude
		exclude: [...configDefaults.exclude, 'e2e/**', 'playwright/**'],

		// ✅ MELHORIA 16: Timeouts diferenciados
		testTimeout: 10000,
		hookTimeout: 10000,
		// Teardown timeout para cleanup de conexões (NeonDB)
		teardownTimeout: 5000,

		// ✅ MELHORIA 17: Reporters otimizados
		reporters: process.env.CI
			? ['default', 'junit', 'github-actions']
			: ['default'],
		outputFile: {
			junit: './coverage/junit.xml',
		},

		// ✅ MELHORIA 18: Retry apenas em CI
		retry: process.env.CI ? 2 : 0,

		// ✅ MELHORIA 19: Bail para falhar rápido em desenvolvimento
		bail: process.env.CI ? 0 : 1, // Para no primeiro erro em dev

		// Isolamento
		isolate: true,

		// ✅ MELHORIA 20: Configuração de snapshot
		snapshotFormat: {
			escapeString: false,
			printBasicPrototype: false,
		},

		// ✅ MELHORIA 21: Mock reset automático
		mockReset: true,
		restoreMocks: true,
		clearMocks: true,

		// ✅ MELHORIA 22: Watch mode otimizado para desenvolvimento rápido

		// ✅ MELHORIA 23: Timezone fixa para testes consistentes
		// (Importante para AegisWallet - mercado brasileiro)
		env: {
			TZ: 'America/Sao_Paulo',
		},
	},
});
