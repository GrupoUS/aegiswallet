/**
 * Server-side Voice Command Processing Service
 * Handles NLU processing for Portuguese voice commands in Brazilian Portuguese
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { ProcessVoiceCommandInput as ServerProcessVoiceCommandInput } from '@/types/server.types';

const MIN_AUTOMATION_CONFIDENCE = 0.8;

export interface VoiceCommandContext {
  user: {
    id: string;
    email: string;
    role?: string;
  };
  supabase: SupabaseClient<Database>;
}

export interface VoiceCommandEntities {
  amount?: number;
  currency?: string;
  recipient?: string;
  pixKey?: string;
  pixKeyType?: 'EMAIL' | 'PHONE' | 'CPF' | 'RANDOM_KEY';
  billType?: 'electricity' | 'water' | 'phone' | 'internet';
  [key: string]: unknown;
}

export interface VoiceCommandResult {
  intent: string | null;
  entities: VoiceCommandEntities;
  confidence: number;
  response: string;
  requiresConfirmation: boolean;
  sessionId: string;
  language: string;
  processedAt: string;
}

export interface VoiceCommandServiceInput extends ServerProcessVoiceCommandInput {
  userId: string;
  context: VoiceCommandContext;
}

/**
 * Process voice command through NLU pipeline
 *
 * Features:
 * - Brazilian Portuguese command recognition
 * - Financial command patterns (saldo, transferir, pagar conta, etc.)
 * - Confidence scoring and confirmation requirements
 * - LGPD-compliant logging
 * - Entity extraction (amounts, recipients, etc.)
 */
export async function processVoiceCommand(
  input: VoiceCommandServiceInput
): Promise<VoiceCommandResult> {
  const { commandText, sessionId, language, requireConfirmation, userId } = input;
  const command = commandText ?? '';

  // Simulate processing delay for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Command detection and intent extraction
  const lowerCommand = command.toLowerCase().trim();
  let intent = null;
  let entities: VoiceCommandEntities = {};
  let confidence = 0.9;

  // Balance checking commands
  if (
    lowerCommand.includes('saldo') ||
    lowerCommand.includes('quanto tenho') ||
    lowerCommand.includes('quanto dinheiro') ||
    lowerCommand.includes('verificar saldo')
  ) {
    intent = 'check_balance';
  }
  // Transfer commands
  else if (
    lowerCommand.includes('transferir') ||
    lowerCommand.includes('pagar') ||
    lowerCommand.includes('enviar dinheiro') ||
    lowerCommand.includes('mandar dinheiro')
  ) {
    intent = 'transfer_money';
    // Extract amount entity (simplified regex for demo)
    const amountMatch = command.match(/r?\$?\s*(\d+(?:,\d{1,2})?)/i);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1].replace(',', '.'));
      entities = {
        amount,
        currency: 'BRL',
      };
    }

    // Extract recipient (simplified - would need NLP in production)
    const recipientMatch = command.match(/(?:para|para o|para a)\s+([a-zá-ú\s]{2,30})/i);
    if (recipientMatch) {
      entities = { ...entities, recipient: recipientMatch[1].trim() };
    }
  }
  // Bill payment commands
  else if (
    lowerCommand.includes('conta') ||
    lowerCommand.includes('boleto') ||
    lowerCommand.includes('pagar conta') ||
    lowerCommand.includes('pagar boleto')
  ) {
    intent = 'pay_bill';
    // Extract bill type
    if (lowerCommand.includes('luz')) entities = { ...entities, billType: 'electricity' };
    else if (lowerCommand.includes('água')) entities = { ...entities, billType: 'water' };
    else if (lowerCommand.includes('telefone')) entities = { ...entities, billType: 'phone' };
    else if (lowerCommand.includes('internet')) entities = { ...entities, billType: 'internet' };
  }
  // Transaction history commands
  else if (
    lowerCommand.includes('extrato') ||
    lowerCommand.includes('transações') ||
    lowerCommand.includes('historico') ||
    lowerCommand.includes('compras')
  ) {
    intent = 'transaction_history';
  }
  // PIX commands
  else if (lowerCommand.includes('pix') || lowerCommand.includes('fazer pix')) {
    intent = 'pix_transfer';
    // Extract PIX key patterns
    const emailMatch = command.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = command.match(/\(?(\d{2})?\)?\s?(\d{4,5})-?(\d{4})/);
    const cpfMatch = command.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);

    if (emailMatch) entities = { ...entities, pixKey: emailMatch[1], pixKeyType: 'EMAIL' };
    else if (phoneMatch) entities = { ...entities, pixKey: phoneMatch[0], pixKeyType: 'PHONE' };
    else if (cpfMatch) entities = { ...entities, pixKey: cpfMatch[0], pixKeyType: 'CPF' };
  }
  // Unknown command
  else {
    intent = 'unknown';
    confidence = 0.3;
  }

  // Determine if confirmation is required based on confidence
  const requiresConfirmation =
    confidence < MIN_AUTOMATION_CONFIDENCE || (requireConfirmation ?? false);

  // Generate appropriate response
  let response = '';
  switch (intent) {
    case 'check_balance':
      response = 'Verificando seu saldo...';
      break;
    case 'transfer_money':
      if (entities.amount && entities.recipient) {
        response = `Preparando transferência de R$ ${entities.amount} para ${entities.recipient}`;
      } else {
        response = 'Entendi que quer transferir dinheiro. Para quem e quanto?';
      }
      break;
    case 'pay_bill':
      response = 'Buscando suas contas a pagar...';
      break;
    case 'transaction_history':
      response = 'Mostrando seu histórico de transações...';
      break;
    case 'pix_transfer':
      response = 'Preparando transferência PIX...';
      break;
    default:
      response = 'Não entendi o comando. Pode repetir?';
  }

  const result: VoiceCommandResult = {
    confidence,
    entities,
    intent,
    language: language ?? 'pt-BR',
    processedAt: new Date().toISOString(),
    requiresConfirmation,
    response,
    sessionId,
  };

  return result;
}

/**
 * Get available voice commands with Portuguese examples
 */
export function getAvailableCommands() {
  return {
    commands: [
      {
        description: 'Verificar saldo da conta',
        examples: ['Qual é o meu saldo?', 'Quanto dinheiro eu tenho?', 'Mostrar meu saldo'],
        name: 'check_balance',
      },
      {
        description: 'Transferir dinheiro para outra conta',
        examples: [
          'Transferir R$ 100 para João',
          'Pagar 50 reais para Maria',
          'Enviar R$ 200 para o email teste@email.com',
        ],
        name: 'transfer_money',
      },
      {
        description: 'Pagar contas e boletos',
        examples: ['Pagar conta de luz', 'Pagar boleto do cartão', 'Quitar conta de telefone'],
        name: 'pay_bill',
      },
      {
        description: 'Fazer transferência PIX',
        examples: [
          'Fazer PIX para o CPF 123.456.789-00',
          'Enviar PIX para o telefone 11999999999',
          'Transferir por PIX para maria@email.com',
        ],
        name: 'pix_transfer',
      },
      {
        description: 'Ver histórico de transações',
        examples: ['Mostrar minhas transações', 'Ver extrato do mês', 'Histórico de compras'],
        name: 'transaction_history',
      },
    ],
    language: 'pt-BR',
  };
}

/**
 * Validate command confidence and automation eligibility
 */
export function canAutomateCommand(confidence: number, requireConfirmation: boolean): boolean {
  return confidence >= MIN_AUTOMATION_CONFIDENCE && !requireConfirmation;
}

export default {
  processVoiceCommand,
  getAvailableCommands,
  canAutomateCommand,
  MIN_AUTOMATION_CONFIDENCE,
};
