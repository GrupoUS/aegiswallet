
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BelvoSyncRequest {
  linkId: string;
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

    const { linkId }: BelvoSyncRequest = await req.json();

    if (!linkId) {
      return new Response('Missing linkId', { status: 400, headers: corsHeaders });
    }

    console.log('Starting manual sync for link:', linkId);

    // Update connection status to syncing
    await supabase
      .from('belvo_bank_connections')
      .update({ status: 'syncing' })
      .eq('belvo_link_id', linkId);

    // Fetch accounts first
    const accounts = await fetchBelvoAccounts(linkId);
    if (accounts && accounts.length > 0) {
      await syncAccountsToDatabase(supabase, accounts);
    }

    // Fetch and sync transactions
    const transactions = await fetchBelvoTransactions(linkId);
    if (transactions && transactions.length > 0) {
      await syncTransactionsToDatabase(supabase, transactions, linkId);
    }

    // Update connection status to success
    await supabase
      .from('belvo_bank_connections')
      .update({ 
        status: 'valid_token',
        last_accessed_at: new Date().toISOString()
      })
      .eq('belvo_link_id', linkId);

    console.log('Manual sync completed for link:', linkId);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync error:', error);
    
    // Try to update error status if we have the linkId
    try {
      const { linkId } = await req.json();
      if (linkId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('belvo_bank_connections')
          .update({ status: 'login_error' })
          .eq('belvo_link_id', linkId);
      }
    } catch (updateError) {
      console.error('Error updating status:', updateError);
    }

    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function fetchBelvoAccounts(linkId: string) {
  const belvoSecretKey = Deno.env.get('BELVO_SECRET_KEY');
  const belvoSecretPassword = Deno.env.get('BELVO_SECRET_PASSWORD');
  
  if (!belvoSecretKey || !belvoSecretPassword) {
    throw new Error('Belvo credentials not configured');
  }
  
  const credentials = btoa(`${belvoSecretKey}:${belvoSecretPassword}`);
  
  const response = await fetch('https://api.belvo.com/api/accounts/', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      link: linkId,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Belvo API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
}

async function fetchBelvoTransactions(linkId: string) {
  const belvoSecretKey = Deno.env.get('BELVO_SECRET_KEY');
  const belvoSecretPassword = Deno.env.get('BELVO_SECRET_PASSWORD');
  
  if (!belvoSecretKey || !belvoSecretPassword) {
    throw new Error('Belvo credentials not configured');
  }
  
  const credentials = btoa(`${belvoSecretKey}:${belvoSecretPassword}`);
  
  const response = await fetch('https://api.belvo.com/api/transactions/', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      link: linkId,
      date_from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      date_to: new Date().toISOString().split('T')[0],
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Belvo API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
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
      } else {
        console.log('Account synced:', account.id);
      }
    } catch (error) {
      console.error('Error processing account:', account.id, error);
    }
  }
}

async function syncTransactionsToDatabase(supabase: any, transactions: any[], linkId: string) {
  console.log(`Syncing ${transactions.length} transactions for link ${linkId}`);
  
  // Get user_id from the belvo_bank_connections table
  const { data: connection } = await supabase
    .from('belvo_bank_connections')
    .select('user_id')
    .eq('belvo_link_id', linkId)
    .single();
    
  if (!connection) {
    console.error('No connection found for link_id:', linkId);
    return;
  }
  
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
      // Determine transaction type based on amount
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
            user_id: connection.user_id,
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
        } else {
          console.log('Transaction inserted:', transaction.id);
        }
      }
    } catch (error) {
      console.error('Error processing transaction:', transaction.id, error);
    }
  }
}
