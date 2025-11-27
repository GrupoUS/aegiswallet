import { tool } from 'ai';
import { z } from 'zod';

export function createCategoryTools(userId: string) {
  return {
    listCategories: tool({
      description: 'Lista todas as categorias de transação disponíveis.',
      parameters: z.object({
        includeSystem: z.boolean().default(true)
          .describe('Incluir categorias do sistema'),
      }),
      execute: async ({ includeSystem }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

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
    }),

    createCategory: tool({
      description: 'Cria uma nova categoria personalizada.',
      parameters: z.object({
        name: z.string().min(1).max(50).describe('Nome da categoria'),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280')
          .describe('Cor em hexadecimal'),
        icon: z.string().default('circle').describe('Nome do ícone'),
      }),
      execute: async ({ name, color, icon }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

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
    }),
  };
}
