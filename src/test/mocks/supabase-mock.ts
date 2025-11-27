/**
 * Simplified Supabase Mock for AegisWallet Tests
 * Focused on making TypeScript compile without errors
 */

import { vi } from 'vitest';

// Simple mock database storage
class SimpleMockDatabase {
	private data: Map<string, unknown[]> = new Map();

	select(table: string): unknown[] {
		return [...(this.data.get(table) || [])];
	}

	insert(table: string, record: unknown): unknown {
		const newRecord = Object.assign({}, record, {
			id: crypto.randomUUID(),
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		});

		const tableData = this.data.get(table) || [];
		tableData.push(newRecord);
		this.data.set(table, tableData);

		return newRecord;
	}

	find(table: string, predicate: (record: unknown) => boolean): unknown[] {
		const tableData = this.data.get(table) || [];
		return tableData.filter(predicate);
	}

	findOne(
		table: string,
		predicate: (record: unknown) => boolean,
	): unknown | null {
		const records = this.find(table, predicate);
		return records.length > 0 ? records[0] : null;
	}

	clear(table: string): void {
		this.data.set(table, []);
	}
}

const mockDatabase = new SimpleMockDatabase();

// Simple Mock Query Builder
class SimpleMockQueryBuilder {
	private table: string;

	constructor(table: string) {
		this.table = table;
	}

	select(): SimpleMockQueryBuilder {
		return this;
	}

	eq(_column: string, _value: unknown): SimpleMockQueryBuilder {
		return this;
	}

	insert(record: unknown): Promise<{ data: unknown; error: null }> {
		const insertedRecord = mockDatabase.insert(this.table, record);
		return Promise.resolve({ data: insertedRecord, error: null });
	}

	single(): Promise<{ data: unknown; error: null }> {
		const results = mockDatabase.select(this.table);
		const record = results.length > 0 ? results[0] : null;
		return Promise.resolve({ data: record, error: null });
	}
}

// Mock Supabase Client
function createMockSupabaseClient() {
	return {
		auth: {
			getUser: vi.fn().mockResolvedValue({
				data: { user: { id: 'test-user-id' } },
				error: null,
			}),
			signInWithOAuth: vi.fn(),
			signInWithPassword: vi.fn(),
			signOut: vi.fn(),
			signUp: vi.fn(),
			refreshSession: vi.fn(),
			updateUser: vi.fn(),
			resetPasswordForEmail: vi.fn(),
		},

		from: (table: string) => new SimpleMockQueryBuilder(table),

		storage: {
			from: vi.fn().mockReturnValue({
				upload: vi.fn(),
				update: vi.fn(),
				move: vi.fn(),
				copy: vi.fn(),
				createSignedUrl: vi.fn(),
				getPublicUrl: vi
					.fn()
					.mockReturnValue({ data: { publicUrl: 'test-url' } }),
				createUrls: vi.fn(),
				remove: vi.fn(),
				list: vi.fn(),
			}),
		},

		realtime: {
			subscribe: vi.fn(),
			unsubscribe: vi.fn(),
			getChannels: vi.fn(),
		},

		functions: {
			invoke: vi.fn(),
		},

		supabaseUrl: 'https://test.supabase.co',
		supabaseKey: 'test-key',
		realtimeUrl: 'wss://test.supabase.co/realtime',
		authUrl: 'https://test.supabase.co/auth/v1',
		storageUrl: 'https://test.supabase.co/storage/v1',
	};
}

export const supabaseMock = createMockSupabaseClient();

// Helper functions for test setup
export const setupMockDatabase = {
	clear: (table: string) => mockDatabase.clear(table),
	insert: (table: string, record: unknown) =>
		mockDatabase.insert(table, record),
	find: (table: string, predicate: (record: unknown) => boolean) =>
		mockDatabase.find(table, predicate),
	findOne: (table: string, predicate: (record: unknown) => boolean) =>
		mockDatabase.findOne(table, predicate),
};

// Vitest Mock Configuration
vi.mock('@/integrations/supabase/client', () => ({
	supabase: supabaseMock,
}));

export { mockDatabase, createMockSupabaseClient };
