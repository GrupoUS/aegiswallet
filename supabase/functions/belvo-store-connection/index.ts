
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StoreConnectionRequest {
  link_id: string;
  institution_name: string;
  access_mode?: string;
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

    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Authorization required', { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response('Invalid token', { status: 401, headers: corsHeaders });
    }

    const { link_id, institution_name, access_mode }: StoreConnectionRequest = await req.json();

    if (!link_id || !institution_name) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders });
    }

    console.log('Storing Belvo connection for user:', user.id, 'link_id:', link_id);

    // Store the connection in the database
    const { data: connection, error: connectionError } = await supabase
      .from('belvo_bank_connections')
      .insert({
        user_id: user.id,
        belvo_link_id: link_id,
        institution_name: institution_name,
        access_mode: access_mode || 'recurrent',
        status: 'valid_token',
        last_accessed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (connectionError) {
      console.error('Error storing connection:', connectionError);
      return new Response('Failed to store connection', { status: 500, headers: corsHeaders });
    }

    console.log('Connection stored successfully:', connection.connection_id);

    // Trigger initial data fetch
    try {
      await fetchInitialAccountsAndTransactions(link_id, user.id);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // Don't fail the connection storage if initial fetch fails
    }

    return new Response(JSON.stringify({
      success: true,
      connection_id: connection.connection_id,
      message: 'Conexão armazenada com sucesso'
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error storing connection:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      success: false 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function fetchInitialAccountsAndTransactions(linkId: string, userId: string) {
  const belvoSecretKey = Deno.env.get('BELVO_SECRET_KEY');
  const belvoSecretPassword = Deno.env.get('BELVO_SECRET_PASSWORD');
  
  if (!belvoSecretKey || !belvoSecretPassword) {
    throw new Error('Belvo credentials not configured');
  }
  
  const credentials = btoa(`${belvoSecretKey}:${belvoSecretPassword}`);
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log('Fetching initial accounts for link:', linkId);

  // Fetch accounts
  const accountsResponse = await fetch('https://api.belvo.com/api/accounts/', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ link: linkId }),
  });

  if (accountsResponse.ok) {
    const accountsData = await accountsResponse.json();
    if (accountsData.results) {
      await syncAccountsToDatabase(supabase, accountsData.results);
    }
  }

  // Fetch initial transactions (last 90 days)
  const dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dateTo = new Date().toISOString().split('T')[0];

  console.log('Fetching initial transactions for link:', linkId);

  const transactionsResponse = await fetch('https://api.belvo.com/api/transactions/', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      link: linkId,
      date_from: dateFrom,
      date_to: dateTo,
    }),
  });

  if (transactionsResponse.ok) {
    const transactionsData = await transactionsResponse.json();
    if (transactionsData.results) {
      await syncTransactionsToDatabase(supabase, transactionsData.results, linkId, userId);
    }
  }
}

async function syncAccountsToDatabase(supabase: any, accounts: any[]) {
  console.log(`Syncing ${accounts.length} accounts`);
  
  for (const account of accounts) {
    try {
      const { error: upsertError } = await supabase
        .from('belvo_accounts')
        .upsert({
          belvo_link_id: account.link,
          belvo_account_id: account.id,
          institution_name: account.institution.name,
          name: account.name,
          type: account.type,
          currency: account.currency,
          balance_current: account.balance.current,
          balance_available: account.balance.available,
          collected_at: account.collected_at,
        }, {
          onConflict: 'belvo_account_id'
        });
      
      if (upsertError) {
        console.error('Error upserting account:', upsertError);
      }
    } catch (error) {
      console.error('Error processing account:', account.id, error);
    }
  }
}

async function syncTransactionsToDatabase(supabase: any, transactions: any[], linkId: string, userId: string) {
  console.log(`Syncing ${transactions.length} transactions for link ${linkId}`);
  
  // Get default category
  const { data: defaultCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Outros')
    .eq('is_predefined', true)
    .single();
  
  const defaultCategoryId = defaultCategory?.id;
  
  for (const transaction of transactions) {
    try {
      // Map Belvo transaction types to AegisWallet types (Entrada/Saída)
      const type = transaction.amount >= 0 ? 'income' : 'expense';
      const amount = Math.abs(transaction.amount);
      
      // Check if transaction already exists
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('source_transaction_id', transaction.id)
        .eq('belvo_account_id', transaction.account.id)
        .single();
      
      if (!existingTransaction) {
        // Insert new transaction
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: amount,
            description: transaction.description || 'Transação importada via Belvo',
            date: transaction.value_date,
            type: type,
            category_id: defaultCategoryId,
            source_transaction_id: transaction.id,
            belvo_account_id: transaction.account.id,
            is_imported: true,
          });
        
        if (error) {
          console.error('Error inserting transaction:', error);
        }
      }
    } catch (error) {
      console.error('Error processing transaction:', transaction.id, error);
    }
  }
}
