
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BankConnection {
  id: string;
  user_id: string;
  provider_name: string;
  institution_id: string;
  institution_name: string;
  provider_connection_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token?: string;
}

interface OpenFinanceTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'CREDIT' | 'DEBIT';
  category?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { connectionId } = await req.json();

    if (!connectionId) {
      throw new Error('Connection ID is required');
    }

    console.log(`Starting sync for connection: ${connectionId}`);

    // Get the bank connection details
    const { data: connection, error: connectionError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connectionError || !connection) {
      throw new Error('Bank connection not found');
    }

    // Update status to syncing
    await supabase
      .from('bank_connections')
      .update({ sync_status: 'syncing' })
      .eq('id', connectionId);

    console.log(`Fetching transactions for institution: ${connection.institution_name}`);

    // Mock transaction data - in a real implementation, this would call the Open Finance API
    const mockTransactions: OpenFinanceTransaction[] = [
      {
        id: `mock_${Date.now()}_1`,
        amount: -50.00,
        description: "Compra no supermercado",
        date: new Date().toISOString().split('T')[0],
        type: 'DEBIT',
        category: 'food'
      },
      {
        id: `mock_${Date.now()}_2`,
        amount: 1500.00,
        description: "Salário",
        date: new Date().toISOString().split('T')[0],
        type: 'CREDIT',
        category: 'salary'
      },
      {
        id: `mock_${Date.now()}_3`,
        amount: -25.50,
        description: "Uber",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'DEBIT',
        category: 'transport'
      }
    ];

    // Get default categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .or(`user_id.eq.${connection.user_id},is_predefined.eq.true`);

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    }

    const categoryMap = new Map(categories?.map(cat => [cat.name.toLowerCase(), cat.id]) || []);
    const defaultCategoryId = categories?.find(cat => cat.name.toLowerCase() === 'outros')?.id || categories?.[0]?.id;

    // Process and save transactions
    const transactionsToInsert = mockTransactions.map(transaction => {
      let categoryId = defaultCategoryId;
      
      // Try to map category
      if (transaction.category) {
        const mappedCategoryId = categoryMap.get(transaction.category) || categoryMap.get('alimentação') || categoryMap.get('transporte');
        if (mappedCategoryId) {
          categoryId = mappedCategoryId;
        }
      }

      return {
        user_id: connection.user_id,
        amount: Math.abs(transaction.amount),
        description: transaction.description,
        date: transaction.date,
        type: transaction.type === 'CREDIT' ? 'income' : 'expense',
        category_id: categoryId,
        source_transaction_id: transaction.id,
        bank_connection_id: connectionId,
        is_imported: true
      };
    });

    console.log(`Processing ${transactionsToInsert.length} transactions`);

    // Insert transactions with conflict handling (upsert)
    const { data: insertedTransactions, error: insertError } = await supabase
      .from('transactions')
      .upsert(transactionsToInsert, {
        onConflict: 'source_transaction_id,bank_connection_id',
        ignoreDuplicates: true
      })
      .select();

    if (insertError) {
      console.error('Error inserting transactions:', insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${insertedTransactions?.length || 0} new transactions`);

    // Update connection status to success
    await supabase
      .from('bank_connections')
      .update({ 
        sync_status: 'success',
        last_successful_sync_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactionsCount: insertedTransactions?.length || 0,
        message: 'Transactions synced successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in sync-bank-transactions:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
