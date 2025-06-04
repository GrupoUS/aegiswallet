
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BelvoWebhookPayload {
  webhook_id: string;
  webhook_type: string;
  webhook_code: string;
  link_id: string;
  request_id: string;
  external_id?: string;
  data?: any;
  sent_at: string;
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

    // Verify webhook signature
    const signature = req.headers.get('belvo-signature');
    const webhookSecret = Deno.env.get('BELVO_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const body = await req.text();
    
    // Verify HMAC signature
    const expectedSignature = await generateHMACSignature(webhookSecret, body);
    
    if (!verifySignature(signature, expectedSignature)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }
    
    console.log('Webhook received and verified:', body);
    
    const payload: BelvoWebhookPayload = JSON.parse(body);
    
    // Handle different webhook events
    switch (payload.webhook_code) {
      case 'HISTORICAL_READY':
      case 'NEW_TRANSACTIONS':
        await handleTransactionEvents(supabase, payload);
        break;
      
      case 'LINK_STATUS_UPDATED':
        await handleLinkStatusUpdate(supabase, payload);
        break;
      
      case 'ACCOUNTS_UPDATED':
        await handleAccountsUpdate(supabase, payload);
        break;
      
      default:
        console.log('Unhandled webhook event:', payload.webhook_code);
    }

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

async function generateHMACSignature(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

function verifySignature(receivedSignature: string, expectedSignature: string): boolean {
  // Remove any prefixes from the received signature
  const cleanSignature = receivedSignature.replace(/^sha256=/, '');
  return cleanSignature === expectedSignature;
}

async function handleTransactionEvents(supabase: any, payload: BelvoWebhookPayload) {
  console.log('Handling transaction event for link:', payload.link_id);
  
  try {
    // Fetch transactions from Belvo API
    const transactions = await fetchBelvoTransactions(payload.link_id);
    
    if (transactions && transactions.length > 0) {
      await syncTransactionsToDatabase(supabase, transactions, payload.link_id);
    }
    
    // Update sync status
    await supabase
      .from('belvo_bank_connections')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        status: 'valid_token'
      })
      .eq('belvo_link_id', payload.link_id);
      
  } catch (error) {
    console.error('Error handling transaction event:', error);
    
    // Update error status
    await supabase
      .from('belvo_bank_connections')
      .update({ status: 'login_error' })
      .eq('belvo_link_id', payload.link_id);
  }
}

async function handleLinkStatusUpdate(supabase: any, payload: BelvoWebhookPayload) {
  console.log('Handling link status update:', payload);
  
  // Extract status from payload data
  const status = payload.data?.status || 'unknown';
  
  // Map Belvo statuses to our internal statuses
  let mappedStatus = status;
  switch (status) {
    case 'valid':
      mappedStatus = 'valid_token';
      break;
    case 'invalid':
    case 'error':
      mappedStatus = 'login_error';
      break;
    case 'token_required':
      mappedStatus = 'token_required';
      break;
    case 'suspended':
      mappedStatus = 'suspended';
      break;
    default:
      mappedStatus = status;
  }
  
  await supabase
    .from('belvo_bank_connections')
    .update({ 
      status: mappedStatus,
      last_accessed_at: new Date().toISOString()
    })
    .eq('belvo_link_id', payload.link_id);
}

async function handleAccountsUpdate(supabase: any, payload: BelvoWebhookPayload) {
  console.log('Handling accounts update for link:', payload.link_id);
  
  try {
    // Fetch updated accounts from Belvo API
    const accounts = await fetchBelvoAccounts(payload.link_id);
    
    if (accounts && accounts.length > 0) {
      await syncAccountsToDatabase(supabase, accounts);
    }
  } catch (error) {
    console.error('Error handling accounts update:', error);
  }
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
    body: JSON.stringify({ link: linkId }),
  });
  
  if (!response.ok) {
    throw new Error(`Belvo API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.results || [];
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
      // Map Belvo transaction types to AegisWallet types (Entrada = Income, Saída = Expense)
      let type: 'income' | 'expense';
      let amount: number;
      
      if (transaction.type === 'INFLOW' || transaction.amount > 0) {
        type = 'income'; // Entrada
        amount = Math.abs(transaction.amount);
      } else {
        type = 'expense'; // Saída
        amount = Math.abs(transaction.amount);
      }
      
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
          console.log(`Transaction inserted: ${transaction.id} - ${type} - R$ ${amount}`);
        }
      }
    } catch (error) {
      console.error('Error processing transaction:', transaction.id, error);
    }
  }
}

async function syncAccountsToDatabase(supabase: any, accounts: any[]) {
  console.log(`Syncing ${accounts.length} accounts`);
  
  for (const account of accounts) {
    try {
      // Check if account already exists
      const { data: existingAccount } = await supabase
        .from('belvo_accounts')
        .select('account_id')
        .eq('belvo_account_id', account.id)
        .single();
      
      const accountData = {
        belvo_link_id: account.link,
        belvo_account_id: account.id,
        institution_name: account.institution.name,
        name: account.name,
        type: account.type,
        currency: account.currency,
        balance_current: account.balance.current,
        balance_available: account.balance.available,
        collected_at: account.collected_at,
      };
      
      if (!existingAccount) {
        // Insert new account
        const { error } = await supabase
          .from('belvo_accounts')
          .insert(accountData);
        
        if (error) {
          console.error('Error inserting account:', error);
        } else {
          console.log('Account inserted:', account.id);
        }
      } else {
        // Update existing account
        const { error } = await supabase
          .from('belvo_accounts')
          .update(accountData)
          .eq('belvo_account_id', account.id);
        
        if (error) {
          console.error('Error updating account:', error);
        } else {
          console.log('Account updated:', account.id);
        }
      }
    } catch (error) {
      console.error('Error processing account:', account.id, error);
    }
  }
}
