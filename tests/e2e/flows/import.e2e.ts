/**
 * @file import.e2e.ts
 * @description E2E tests for bank statement import flow
 *
 * Tests the complete import flow from file upload to transaction creation.
 * Uses Playwright for API testing and fixture files for realistic scenarios.
 *
 * Run: bun test:e2e -- tests/e2e/flows/import.e2e.ts
 */

/* biome-ignore-all lint/style/useNamingConvention: HTTP headers use standard naming (Authorization, Content-Type) */

import { expect, test } from '@playwright/test';

// Test configuration
const API_BASE = process.env.PLAYWRIGHT_API_BASE || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;

// Sample CSV content for Brazilian bank formats
const NUBANK_CSV_CONTENT = `Data,Descrição,Valor,Saldo
01/12/2024,PIX Recebido - JOAO SILVA,150.00,1150.00
02/12/2024,Pagamento Boleto - LUZ,-89.50,1060.50
03/12/2024,Transferência Recebida,500.00,1560.50`;

const ITAU_CSV_CONTENT = `Data Mov;Histórico;Valor (R$);Saldo (R$)
01/12/2024;TED Recebida;1000,00;5000,00
02/12/2024;PAGTO TITULO;-250,00;4750,00
03/12/2024;PIX Enviado;-100,00;4650,00`;

// Invalid/malformed content for error testing
const INVALID_CSV_CONTENT = 'This is not valid CSV content\nNo headers or structure';

const EMPTY_CSV_CONTENT = '';

test.describe('Import Flow - E2E Tests', () => {
	test.setTimeout(TEST_TIMEOUT);

	test.describe('File Upload', () => {
		test('should reject upload without authentication', async ({ request }) => {
			const csvBuffer = Buffer.from(NUBANK_CSV_CONTENT, 'utf-8');

			const response = await request.post(`${API_BASE}/api/v1/import/upload`, {
				multipart: {
					file: {
						name: 'extrato.csv',
						mimeType: 'text/csv',
						buffer: csvBuffer,
					},
				},
			});

			// Should return 401 Unauthorized
			expect(response.status()).toBe(401);
		});

		test('should reject invalid file type', async ({ request }) => {
			// This test requires auth - skip if no auth token available
			test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');

			const response = await request.post(`${API_BASE}/api/v1/import/upload`, {
				headers: {
					Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
				},
				multipart: {
					file: {
						name: 'document.txt',
						mimeType: 'text/plain',
						buffer: Buffer.from('Plain text file'),
					},
				},
			});

			expect(response.status()).toBe(400);
			const body = await response.json();
			expect(body.error || body.message).toContain('tipo');
		});

		test('should reject empty file', async ({ request }) => {
			test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');

			const response = await request.post(`${API_BASE}/api/v1/import/upload`, {
				headers: {
					Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
				},
				multipart: {
					file: {
						name: 'empty.csv',
						mimeType: 'text/csv',
						buffer: Buffer.from(EMPTY_CSV_CONTENT),
					},
				},
			});

			expect(response.status()).toBe(400);
		});

		test('should reject file exceeding size limit', async ({ request }) => {
			test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');

			// Create a 15MB file (exceeds 10MB limit)
			const largeContent = 'x'.repeat(15 * 1024 * 1024);

			const response = await request.post(`${API_BASE}/api/v1/import/upload`, {
				headers: {
					Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
				},
				multipart: {
					file: {
						name: 'large.csv',
						mimeType: 'text/csv',
						buffer: Buffer.from(largeContent),
					},
				},
			});

			expect(response.status()).toBe(400);
			const body = await response.json();
			expect(body.error || body.message).toMatch(/tamanho|size|limite/i);
		});
	});

	test.describe('Import Status Polling', () => {
		test('should return 404 for non-existent session', async ({ request }) => {
			test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');

			const response = await request.get(
				`${API_BASE}/api/v1/import/status/non-existent-session-id`,
				{
					headers: {
						Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
					},
				},
			);

			expect(response.status()).toBe(404);
		});

		test('should reject status check without authentication', async ({ request }) => {
			const response = await request.get(`${API_BASE}/api/v1/import/status/any-session-id`);

			expect(response.status()).toBe(401);
		});
	});

	test.describe('Import Confirmation', () => {
		test('should reject confirmation without authentication', async ({ request }) => {
			const response = await request.post(`${API_BASE}/api/v1/import/confirm`, {
				data: {
					sessionId: 'test-session',
					bankAccountId: 'test-account',
					selectedTransactionIds: ['tx-1', 'tx-2'],
				},
			});

			expect(response.status()).toBe(401);
		});

		test('should reject confirmation for non-existent session', async ({ request }) => {
			test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');

			const response = await request.post(`${API_BASE}/api/v1/import/confirm`, {
				headers: {
					Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
					'Content-Type': 'application/json',
				},
				data: {
					sessionId: 'non-existent-session',
					bankAccountId: 'test-account',
					selectedTransactionIds: ['tx-1'],
				},
			});

			expect(response.status()).toBe(404);
		});

		test('should reject confirmation without bank account', async ({ request }) => {
			test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');

			const response = await request.post(`${API_BASE}/api/v1/import/confirm`, {
				headers: {
					Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
					'Content-Type': 'application/json',
				},
				data: {
					sessionId: 'test-session',
					// Missing bankAccountId
					selectedTransactionIds: ['tx-1'],
				},
			});

			expect(response.status()).toBe(400);
		});
	});

	test.describe('Import Cancellation', () => {
		test('should reject cancellation without authentication', async ({ request }) => {
			const response = await request.post(`${API_BASE}/api/v1/import/cancel`, {
				data: {
					sessionId: 'test-session',
				},
			});

			expect(response.status()).toBe(401);
		});
	});
});

test.describe('Import Flow - Integration Tests', () => {
	test.setTimeout(60000); // Longer timeout for full flow

	test.describe('Full Import Flow', () => {
		test('CSV upload → status poll → confirm flow @integration', async ({ request }) => {
			test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');
			test.skip(!process.env.TEST_BANK_ACCOUNT_ID, 'Requires test bank account');

			const authHeaders = {
				Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
			};

			// Step 1: Upload CSV file
			const csvBuffer = Buffer.from(NUBANK_CSV_CONTENT, 'utf-8');
			const uploadResponse = await request.post(`${API_BASE}/api/v1/import/upload`, {
				headers: authHeaders,
				multipart: {
					file: {
						name: 'nubank-extrato.csv',
						mimeType: 'text/csv',
						buffer: csvBuffer,
					},
				},
			});

			expect(uploadResponse.ok()).toBe(true);
			const uploadData = await uploadResponse.json();
			expect(uploadData.sessionId).toBeDefined();

			const sessionId = uploadData.sessionId;

			// Step 2: Poll status until processing complete
			let status = 'PROCESSING';
			let transactions: unknown[] = [];
			let pollCount = 0;
			const maxPolls = 30;

			while (status === 'PROCESSING' && pollCount < maxPolls) {
				await new Promise((resolve) => setTimeout(resolve, 1000));

				const statusResponse = await request.get(`${API_BASE}/api/v1/import/status/${sessionId}`, {
					headers: authHeaders,
				});

				expect(statusResponse.ok()).toBe(true);
				const statusData = await statusResponse.json();
				status = statusData.status;
				transactions = statusData.extractedTransactions || [];
				pollCount++;
			}

			expect(status).toBe('REVIEW');
			expect(transactions.length).toBeGreaterThan(0);

			// Step 3: Confirm import with selected transactions
			const transactionIds = (transactions as { id: string }[]).map((t) => t.id);

			const confirmResponse = await request.post(`${API_BASE}/api/v1/import/confirm`, {
				headers: {
					...authHeaders,
					'Content-Type': 'application/json',
				},
				data: {
					sessionId,
					bankAccountId: process.env.TEST_BANK_ACCOUNT_ID,
					selectedTransactionIds: transactionIds,
				},
			});

			expect(confirmResponse.ok()).toBe(true);
			const confirmData = await confirmResponse.json();
			expect(confirmData.importedCount).toBe(transactionIds.length);
		});

		test('should handle duplicate detection in import @integration', async ({
			request: _request,
		}) => {
			test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');
			test.skip(!process.env.TEST_BANK_ACCOUNT_ID, 'Requires test bank account');

			// This test would require:
			// 1. First import some transactions
			// 2. Try to import the same file again
			// 3. Verify duplicates are flagged

			// Placeholder for now - requires full integration setup
			await Promise.resolve(); // Satisfy async requirement
			test.skip(true, 'Requires pre-existing transactions for duplicate detection');
		});
	});
});

test.describe('Import Error Handling', () => {
	test('should handle malformed CSV gracefully', async ({ request }) => {
		test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');

		const response = await request.post(`${API_BASE}/api/v1/import/upload`, {
			headers: {
				Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
			},
			multipart: {
				file: {
					name: 'malformed.csv',
					mimeType: 'text/csv',
					buffer: Buffer.from(INVALID_CSV_CONTENT),
				},
			},
		});

		// Should either reject immediately or return session that fails processing
		if (response.ok()) {
			const data = await response.json();
			expect(data.sessionId).toBeDefined();
			// The processing should eventually fail
		} else {
			expect(response.status()).toBe(400);
		}
	});

	test('should handle rate limiting', async ({ request }) => {
		test.skip(!process.env.TEST_AUTH_TOKEN, 'Requires authentication token');
		test.skip(true, 'Rate limiting test requires special configuration');

		// Make many rapid requests to trigger rate limiting
		const requests = Array.from({ length: 20 }, () =>
			request.post(`${API_BASE}/api/v1/import/upload`, {
				headers: {
					Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN}`,
				},
				multipart: {
					file: {
						name: 'test.csv',
						mimeType: 'text/csv',
						buffer: Buffer.from(NUBANK_CSV_CONTENT),
					},
				},
			}),
		);

		const responses = await Promise.all(requests);
		const rateLimited = responses.filter((r) => r.status() === 429);

		// At least some requests should be rate limited
		expect(rateLimited.length).toBeGreaterThan(0);
	});
});
