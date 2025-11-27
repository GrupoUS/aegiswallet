import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

export function createCategoryTools(userId: string, supabase: SupabaseClient) {
	const listCategoriesSchema = z.object({
		includeSystem: z
			.boolean()
			.default(true)
			.describe('Incluir categorias do sistema'),
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
				let query = supabase
					.from('transaction_categories')
					.select('id, name, color, icon, is_system, parent_id')
					.or(`user_id.eq.${userId},user_id.is.null`)
					.order('name');

				if (!includeSystem) {
					query = query.eq('is_system', false);
				}

				const { data, error } = await query;

				if (error) throw new Error(`Erro: ${error.message}`);

				return {
					categories: data ?? [],
					count: data?.length ?? 0,
				};
			},
		},

		createCategory: {
			description: 'Cria uma nova categoria personalizada.',
			parameters: createCategorySchema,
			execute: async (args: z.infer<typeof createCategorySchema>) => {
				const { name, color, icon } = args;
				const { data, error } = await supabase
					.from('transaction_categories')
					.insert({
						user_id: userId,
						name,
						color,
						icon,
						is_system: false,
					})
					.select()
					.single();

				if (error) throw new Error(`Erro ao criar categoria: ${error.message}`);

				return { success: true, category: data };
			},
		},
	};
}
