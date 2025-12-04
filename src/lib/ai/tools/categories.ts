import { eq, isNull, or } from 'drizzle-orm';
import { z } from 'zod';

import type { DbClient } from '@/db/client';
import { transactionCategories } from '@/db/schema';

export function createCategoryTools(userId: string, db: DbClient) {
	const listCategoriesSchema = z.object({
		includeSystem: z.boolean().default(true).describe('Incluir categorias do sistema'),
	});

	const createCategorySchema = z.object({
		name: z.string().min(1).max(50).describe('Nome da categoria'),
		color: z
			.string()
			.regex(/^#[0-9A-Fa-f]{6}$/)
			.default('#6B7280')
			.describe('Cor em hexadecimal'),
		icon: z.string().default('circle').describe('Nome do ícone'),
	});

	return {
		listCategories: {
			description: 'Lista todas as categorias de transação disponíveis.',
			parameters: listCategoriesSchema,
			execute: async (args: z.infer<typeof listCategoriesSchema>) => {
				const { includeSystem } = args;

				// Get user categories and system categories (userId is null for system)
				const conditions = or(
					eq(transactionCategories.userId, userId),
					isNull(transactionCategories.userId),
				);

				let data = await db
					.select({
						id: transactionCategories.id,
						name: transactionCategories.name,
						color: transactionCategories.color,
						icon: transactionCategories.icon,
						isSystem: transactionCategories.isSystem,
						parentId: transactionCategories.parentId,
					})
					.from(transactionCategories)
					.where(conditions);

				if (!includeSystem) {
					data = data.filter((c) => !c.isSystem);
				}

				return {
					categories: data,
					count: data.length,
				};
			},
		},

		createCategory: {
			description: 'Cria uma nova categoria personalizada.',
			parameters: createCategorySchema,
			execute: async (args: z.infer<typeof createCategorySchema>) => {
				const { name, color, icon } = args;

				const [data] = await db
					.insert(transactionCategories)
					.values({
						userId,
						name,
						color,
						icon,
						isSystem: false,
					})
					.returning();

				return { success: true, category: data };
			},
		},
	};
}
