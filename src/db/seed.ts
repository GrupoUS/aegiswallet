/**
 * Database Seed Script
 *
 * Seeds initial data for development/testing
 * Run with: bun run db:seed
 */

import { logger } from '../lib/logging/logger';
import { getHttpClient } from './client';
import { transactionCategories } from './schema';

export const seedDatabase = async () => {
	const db = getHttpClient();

	try {
		// Seed system transaction categories
		await db
			.insert(transactionCategories)
			.values([
				{
					name: 'Alimentação',
					color: '#EF4444',
					icon: 'utensils',
					isSystem: true,
				},
				{
					name: 'Transporte',
					color: '#F59E0B',
					icon: 'car',
					isSystem: true,
				},
				{
					name: 'Moradia',
					color: '#3B82F6',
					icon: 'home',
					isSystem: true,
				},
				{
					name: 'Saúde',
					color: '#10B981',
					icon: 'heart',
					isSystem: true,
				},
				{
					name: 'Educação',
					color: '#8B5CF6',
					icon: 'book',
					isSystem: true,
				},
				{
					name: 'Lazer',
					color: '#EC4899',
					icon: 'gamepad',
					isSystem: true,
				},
				{
					name: 'Compras',
					color: '#6366F1',
					icon: 'shopping-bag',
					isSystem: true,
				},
				{
					name: 'Serviços',
					color: '#14B8A6',
					icon: 'briefcase',
					isSystem: true,
				},
				{
					name: 'Investimentos',
					color: '#22C55E',
					icon: 'trending-up',
					isSystem: true,
				},
				{
					name: 'Outros',
					color: '#6B7280',
					icon: 'circle',
					isSystem: true,
				},
			])
			.onConflictDoNothing();
		process.exit(0);
	} catch (error) {
		logger.error('❌ Database seeding failed', {
			error: error instanceof Error ? error.message : String(error),
		});
		process.exit(1);
	}
};

// Run if executed directly
seedDatabase();
