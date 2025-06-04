
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BillReminder {
  id: string;
  name: string;
  due_date: string;
  amount: number | null;
  user_id: string;
  email_sent_at: string | null;
}

interface UserProfile {
  email: string;
  full_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[REMINDER-EMAILS] Function started');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[REMINDER-EMAILS] Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Configuração do Supabase ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[REMINDER-EMAILS] Supabase client initialized');

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[REMINDER-EMAILS] Missing Resend API key');
      return new Response(
        JSON.stringify({ error: 'Chave da API do Resend ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    console.log('[REMINDER-EMAILS] Resend client initialized');

    // Query for due reminders (today and tomorrow) that haven't been emailed yet
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: reminders, error: remindersError } = await supabase
      .from('bill_reminders')
      .select('id, name, due_date, amount, user_id, email_sent_at')
      .in('due_date', [today, tomorrow])
      .is('email_sent_at', null)
      .eq('is_paid', false);

    if (remindersError) {
      console.error('[REMINDER-EMAILS] Error fetching reminders:', remindersError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar lembretes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[REMINDER-EMAILS] Found ${reminders?.length || 0} reminders to process`);

    if (!reminders || reminders.length === 0) {
      console.log('[REMINDER-EMAILS] No reminders to process');
      return new Response(
        JSON.stringify({ message: 'Nenhum lembrete para processar', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processedCount = 0;
    let errorCount = 0;

    // Process each reminder
    for (const reminder of reminders as BillReminder[]) {
      try {
        console.log(`[REMINDER-EMAILS] Processing reminder ${reminder.id} for user ${reminder.user_id}`);

        // Get user email from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(reminder.user_id);

        if (userError || !userData.user?.email) {
          console.error(`[REMINDER-EMAILS] Error getting user ${reminder.user_id}:`, userError);
          errorCount++;
          continue;
        }

        const userEmail = userData.user.email;
        console.log(`[REMINDER-EMAILS] Sending email to ${userEmail}`);

        // Format due date
        const dueDate = new Date(reminder.due_date);
        const formattedDate = dueDate.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        const isToday = reminder.due_date === today;
        const subject = isToday 
          ? `Lembrete AegisWallet: Sua conta '${reminder.name}' vence hoje!`
          : `AegisWallet: Lembrete - '${reminder.name}' vence amanhã!`;

        // Create email content
        const amountText = reminder.amount 
          ? `<br><strong>Valor:</strong> ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(reminder.amount)}`
          : '';

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">AegisWallet - Lembrete de Pagamento</h2>
            
            <p>Olá,</p>
            
            <p>Este é um lembrete amigável do AegisWallet para o seu compromisso:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <strong>Descrição:</strong> ${reminder.name}<br>
              <strong>Data de Vencimento:</strong> ${formattedDate}${amountText}
            </div>
            
            <p>Não se esqueça de realizar este pagamento no prazo para evitar taxas ou juros adicionais.</p>
            
            <p>Acesse o AegisWallet para mais detalhes sobre seus lembretes e finanças.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Atenciosamente,<br>
              Equipe AegisWallet
            </p>
            
            <p style="color: #9ca3af; font-size: 12px;">
              Este é um email automático. Não responda a esta mensagem.
            </p>
          </div>
        `;

        // Send email via Resend
        const emailResponse = await resend.emails.send({
          from: 'AegisWallet <lembretes@onboarding.resend.dev>', // Update this to your verified domain
          to: [userEmail],
          subject: subject,
          html: htmlContent,
        });

        if (emailResponse.error) {
          console.error(`[REMINDER-EMAILS] Error sending email to ${userEmail}:`, emailResponse.error);
          errorCount++;
          continue;
        }

        console.log(`[REMINDER-EMAILS] Email sent successfully to ${userEmail}, ID: ${emailResponse.data?.id}`);

        // Update reminder to mark email as sent
        const { error: updateError } = await supabase
          .from('bill_reminders')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', reminder.id);

        if (updateError) {
          console.error(`[REMINDER-EMAILS] Error updating reminder ${reminder.id}:`, updateError);
          errorCount++;
        } else {
          processedCount++;
          console.log(`[REMINDER-EMAILS] Successfully processed reminder ${reminder.id}`);
        }

      } catch (error) {
        console.error(`[REMINDER-EMAILS] Error processing reminder ${reminder.id}:`, error);
        errorCount++;
      }
    }

    console.log(`[REMINDER-EMAILS] Processing complete. Successful: ${processedCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        message: 'Processamento de lembretes concluído',
        processed: processedCount,
        errors: errorCount,
        total: reminders.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[REMINDER-EMAILS] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);
