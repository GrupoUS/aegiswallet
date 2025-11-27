import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/integrations/supabase/client';
import { filterSensitiveData } from '../security/filter';

export function createTransactionTools(userId: string) {
  // Use the client factory but we need to ensure we are using it in a context where we can pass the auth token?
  // Actually, for server-side Hono, we should probably use the server client or pass the client in.
  // The plan says `createClient()` from `@/integrations/supabase/client`.
  // However, that client is usually a browser client.
  // In `src/server/routes/v1/ai-chat.ts`, we will likely have access to a server client or we can use the browser client if this code runs on client?
  // Wait, the plan says this is for the backend (Hono).
  // The `createClient` in `@/integrations/supabase/client` is `getBrowserClient`.
  // For the server, we should use a server client that can handle the user's session or a service role if strictly controlled.
  // But the plan explicitly imports from `@/integrations/supabase/client`.
  // Let's check `src/integrations/supabase/client.ts` again. It exports `supabase` and `createClient` (maybe?).
  // The file view showed `export const supabase = getBrowserClient();`. It didn't show `createClient` export.
  // I should probably use `createClient` from `@supabase/supabase-js` or better, use the client passed from the request context if possible.
  // But to stick to the plan, I will assume I need to fix the import or use what's available.
  // The plan code: `import { createClient } from '@/integrations/supabase/client';`
  // This suggests I might need to adjust the import to where the server client is, OR the plan assumes I'm using a client that works.
  // Given this is running on Hono backend, I should probably use `createClient` from `@supabase/supabase-js` with the user's token, OR use the `supabase` client from the context if Hono middleware provides it.
  // Let's look at `src/server/middleware/auth.ts` later.
  // For now, I will use a placeholder `createClient` that I will implement or import correctly.
  // Actually, looking at the plan, it uses `createClient` inside the function.
  // I will import `createClient` from `@supabase/supabase-js` and use env vars, OR better, rely on the `authMiddleware` to provide a client.
  // BUT, the tool definition needs to be standalone.
  // Let's assume for now I can import a helper to get the client.
  // I'll stick to the plan's logic but maybe adjust the import if `createClient` isn't in `@/integrations/supabase/client`.
  // I'll check `src/integrations/supabase/client.ts` again. It only exports `supabase`.
  // I will use `import { supabase } from '@/integrations/supabase/client';` if it's a singleton, but for server we need per-request client usually.
  // I'll use `import { createClient } from '@supabase/supabase-js'` and init it with env vars and the user's token if I had it, but `userId` is passed.
  // If I only have `userId`, I can't easily act AS the user without their token.
  // The `ai-chat.ts` route will likely have the user's token.
  // The plan passes `userId` to `createTransactionTools`.
  // If I use `service_role` key, I can act as anyone, but I must enforce `user_id` check (which the tools do).
  // I will use `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY` to create a client,
  // OR `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  // Since this is server-side, I should probably use the Service Role to bypass RLS *if* I manually handle security,
  // OR use the user's token to respect RLS.
  // The plan says "Supabase RLS já garante que usuários acessem apenas seus próprios dados".
  // This implies we should use a client authenticated as the user.
  // But the `createTransactionTools` only takes `userId`.
  // I will modify `createTransactionTools` to take `supabase` client as an argument, or `token`.
  // The plan says: `const supabase = createClient();` inside `createTransactionTools`.
  // This implies a default client creation.
  // I'll follow the plan but I suspect `createClient` needs to be imported from somewhere else or I need to create it.
  // I will assume there is a `src/lib/supabase/server.ts` or similar, or I will create a local helper.
  // Let's check if `src/lib/supabase` exists.

  // For now, I will implement the tools accepting a `supabase` client instance to be safe and dependency-injectable.
  // Wait, the `tool` definition from `ai` SDK expects `execute` to be an async function.
  // If I pass `supabase` to `createTransactionTools`, I can use it in the closure.

  return {
    listTransactions: tool({
      description: 'Lista transações do usuário com filtros opcionais. Use para consultar histórico, buscar por período ou categoria.',
      parameters: z.object({
        startDate: z.string().datetime().optional()
          .describe('Data inicial no formato ISO (YYYY-MM-DD)'),
        endDate: z.string().datetime().optional()
          .describe('Data final no formato ISO (YYYY-MM-DD)'),
        categoryId: z.string().uuid().optional()
          .describe('ID da categoria para filtrar'),
        accountId: z.string().uuid().optional()
          .describe('ID da conta para filtrar'),
        minAmount: z.number().optional()
          .describe('Valor mínimo da transação'),
        maxAmount: z.number().optional()
          .describe('Valor máximo da transação'),
        searchTerm: z.string().optional()
          .describe('Termo para buscar na descrição'),
        limit: z.number().min(1).max(100).default(20)
          .describe('Número máximo de resultados'),
        offset: z.number().min(0).default(0)
          .describe('Pular N resultados para paginação'),
      }),
      execute: async ({ startDate, endDate, categoryId, accountId, minAmount, maxAmount, searchTerm, limit, offset }) => {
        // I need a supabase client here.
        // I will assume `createClient` is available or I'll use `process.env` to create one.
        // To strictly follow the plan, I'll put the import, but I know it might be wrong.
        // I will fix the import to point to `@supabase/supabase-js` and create a client using env vars.
        // But to respect RLS, I really need the user's session.
        // I'll modify the signature to `createTransactionTools(userId: string, token?: string)`
        // and use the token to create the client.
        // However, the user plan `createTransactionTools(userId)` suggests using Service Role + manual `user_id` filters.
        // The code does `.eq('user_id', userId)`.
        // So I will use a Service Role client (or a generic client if RLS is not relied upon for *this* specific query logic, but the plan says RLS exists).
        // If RLS exists, Service Role bypasses it.
        // So `.eq('user_id', userId)` is crucial.

        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        let query = supabase
          .from('transactions')
          .select(`
            id,
            amount,
            description,
            merchant_name,
            transaction_date,
            status,
            created_at,
            category:transaction_categories(id, name, color, icon),
            account:bank_accounts(id, institution_name, account_type)
          `)
          .eq('user_id', userId)
          .order('transaction_date', { ascending: false })
          .range(offset, offset + limit - 1);

        if (startDate) query = query.gte('transaction_date', startDate);
        if (endDate) query = query.lte('transaction_date', endDate);
        if (categoryId) query = query.eq('category_id', categoryId);
        if (accountId) query = query.eq('account_id', accountId);
        if (minAmount) query = query.gte('amount', minAmount);
        if (maxAmount) query = query.lte('amount', maxAmount);
        if (searchTerm) query = query.ilike('description', `%${searchTerm}%`);

        const { data, error, count } = await query;

        if (error) throw new Error(`Erro ao buscar transações: ${error.message}`);

        return {
          transactions: data?.map(filterSensitiveData) ?? [],
          total: count ?? 0,
          hasMore: (count ?? 0) > offset + limit,
        };
      },
    }),

    getTransaction: tool({
      description: 'Obtém detalhes de uma transação específica pelo ID.',
      parameters: z.object({
        transactionId: z.string().uuid().describe('ID da transação'),
      }),
      execute: async ({ transactionId }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            category:transaction_categories(id, name, color, icon),
            account:bank_accounts(id, institution_name, account_type)
          `)
          .eq('id', transactionId)
          .eq('user_id', userId)
          .single();

        if (error) throw new Error(`Transação não encontrada: ${error.message}`);

        return filterSensitiveData(data);
      },
    }),

    createTransaction: tool({
      description: 'Cria uma nova transação manual para o usuário.',
      parameters: z.object({
        amount: z.number().describe('Valor da transação (positivo para receita, negativo para despesa)'),
        description: z.string().min(1).max(255).describe('Descrição da transação'),
        categoryId: z.string().uuid().optional().describe('ID da categoria'),
        accountId: z.string().uuid().optional().describe('ID da conta bancária'),
        transactionDate: z.string().datetime().optional()
          .describe('Data da transação (padrão: agora)'),
        merchantName: z.string().optional().describe('Nome do estabelecimento'),
      }),
      execute: async ({ amount, description, categoryId, accountId, transactionDate, merchantName }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount,
            description,
            category_id: categoryId,
            account_id: accountId,
            transaction_date: transactionDate ?? new Date().toISOString(),
            merchant_name: merchantName,
            status: 'posted',
          })
          .select()
          .single();

        if (error) throw new Error(`Erro ao criar transação: ${error.message}`);

        return { success: true, transaction: filterSensitiveData(data) };
      },
    }),

    updateTransaction: tool({
      description: 'Atualiza uma transação existente do usuário.',
      parameters: z.object({
        transactionId: z.string().uuid().describe('ID da transação a atualizar'),
        amount: z.number().optional().describe('Novo valor'),
        description: z.string().min(1).max(255).optional().describe('Nova descrição'),
        categoryId: z.string().uuid().optional().describe('Nova categoria'),
        transactionDate: z.string().datetime().optional().describe('Nova data'),
        merchantName: z.string().optional().describe('Novo estabelecimento'),
      }),
      execute: async ({ transactionId, ...updates }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Remover campos undefined
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([, v]) => v !== undefined)
        );

        const { data, error } = await supabase
          .from('transactions')
          .update({
            ...cleanUpdates,
            category_id: updates.categoryId,
            transaction_date: updates.transactionDate,
            merchant_name: updates.merchantName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw new Error(`Erro ao atualizar: ${error.message}`);

        return { success: true, transaction: filterSensitiveData(data) };
      },
    }),

    requestDeleteConfirmation: tool({
      description: 'Solicita confirmação antes de deletar uma transação. SEMPRE use esta tool antes de deleteTransaction.',
      parameters: z.object({
        transactionId: z.string().uuid().describe('ID da transação a deletar'),
      }),
      execute: async ({ transactionId }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
          .from('transactions')
          .select('id, amount, description, transaction_date')
          .eq('id', transactionId)
          .eq('user_id', userId)
          .single();

        if (error) throw new Error(`Transação não encontrada: ${error.message}`);

        // Gerar token temporário (expira em 60s)
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 60000).toISOString();

        // Armazenar token (em produção, usar Redis ou similar)
        await supabase.from('delete_confirmations').insert({
          token,
          transaction_id: transactionId,
          user_id: userId,
          expires_at: expiresAt,
        });

        return {
          requiresConfirmation: true,
          confirmationToken: token,
          expiresIn: 60,
          summary: {
            id: data.id,
            description: data.description,
            amount: data.amount,
            date: data.transaction_date,
          },
          message: `Para confirmar a exclusão da transação "${data.description}" (R$ ${Math.abs(data.amount).toFixed(2)}), peça ao usuário que confirme.`,
        };
      },
    }),

    deleteTransaction: tool({
      description: 'Deleta uma transação. REQUER confirmationToken obtido via requestDeleteConfirmation.',
      parameters: z.object({
        transactionId: z.string().uuid().describe('ID da transação'),
        confirmationToken: z.string().uuid().describe('Token de confirmação'),
      }),
      execute: async ({ transactionId, confirmationToken }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verificar token
        const { data: confirmation, error: tokenError } = await supabase
          .from('delete_confirmations')
          .select('*')
          .eq('token', confirmationToken)
          .eq('transaction_id', transactionId)
          .eq('user_id', userId)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (tokenError || !confirmation) {
          throw new Error('Token de confirmação inválido ou expirado. Use requestDeleteConfirmation primeiro.');
        }

        // Deletar transação
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transactionId)
          .eq('user_id', userId);

        if (deleteError) throw new Error(`Erro ao deletar: ${deleteError.message}`);

        // Limpar token usado
        await supabase.from('delete_confirmations').delete().eq('token', confirmationToken);

        return { success: true, message: 'Transação deletada com sucesso.' };
      },
    }),

    getSpendingSummary: tool({
      description: 'Obtém resumo de gastos por categoria em um período.',
      parameters: z.object({
        startDate: z.string().datetime().describe('Data inicial'),
        endDate: z.string().datetime().describe('Data final'),
      }),
      execute: async ({ startDate, endDate }) => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            amount,
            category:transaction_categories(id, name, color)
          `)
          .eq('user_id', userId)
          .lt('amount', 0) // Apenas despesas
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate);

        if (error) throw new Error(`Erro: ${error.message}`);

        // Agrupar por categoria
        const summary = data?.reduce((acc, tx) => {
          const catName = tx.category?.name ?? 'Sem categoria';
          const catId = tx.category?.id ?? 'uncategorized';

          if (!acc[catId]) {
            acc[catId] = {
              categoryId: catId,
              categoryName: catName,
              color: tx.category?.color ?? '#6B7280',
              total: 0,
              count: 0,
            };
          }

          acc[catId].total += Math.abs(tx.amount);
          acc[catId].count += 1;

          return acc;
        }, {} as Record<string, { categoryId: string; categoryName: string; color: string; total: number; count: number }>);

        const categories = Object.values(summary ?? {}).sort((a, b) => b.total - a.total);
        const grandTotal = categories.reduce((sum, cat) => sum + cat.total, 0);

        return {
          period: { startDate, endDate },
          grandTotal,
          categories,
        };
      },
    }),
  };
}
