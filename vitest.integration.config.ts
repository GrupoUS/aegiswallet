import * as path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// biome-ignore lint/suspicious/noExplicitAny: React plugin type mismatch between vite and vitest versions
	plugins: [react() as any],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],

		// Configuração específica para testes de integração
		environmentOptions: {
			jsdom: {
				pretendToBeVisual: true,
				resources: 'usable',
				runScripts: 'dangerously',
			},
		},

		// Testes de integração podem rodar em paralelo
		sequence: {
			concurrent: true,
			shuffle: false,
		},

		// Coverage para integração com thresholds específicos
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/test/',
				'**/*.d.ts',
				'**/*.config.js',
				'**/*.config.ts',
				'src/mocks/',
				'docs/',
				'scripts/',
				'coverage/',
				'dist/',
			],
			thresholds: {
				global: {
					branches: 80,
					functions: 80,
					lines: 80,
					statements: 80,
				},
			},
			clean: true,
			cleanOnRerun: true,
		},

		// Foco em arquivos de integração
		include: [
			'src/test/integration/**/*.test.{ts,tsx}',
			'src/**/*integration*.test.{ts,tsx}',
			'src/**/*integration*.spec.{ts,tsx}',
		],

		exclude: [
			'node_modules/',
			'dist/',
			'build/',
			'coverage/',
			'**/*.unit.*',
			'**/*.e2e.*',
		],

		// Timeout maior para operações de integração
		testTimeout: 15000,
		hookTimeout: 15000,

		// Melhor reporting para integração
		reporters: ['default', 'verbose'],

		// Isolar testes de integração
		isolate: true,

		// Pool configuration para integração (poolOptions deprecated in Vitest 4.x)
		pool: 'threads',
	},

	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},

	// Otimizações específicas para integração
	optimizeDeps: {
		include: ['@testing-library/react', '@testing-library/jest-dom'],
	},
});
