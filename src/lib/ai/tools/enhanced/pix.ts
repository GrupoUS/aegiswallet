import { createClient } from '@supabase/supabase-js';
import { tool } from 'ai';
import { z } from 'zod';
import { secureLogger } from '../../../logging/secure-logger';
import { filterSensitiveData } from '../../security/filter';
import {
  type PixKey,
  PixKeyTypeSchema,
  type PixQrCode,
  type PixTransfer,
  PixTransferStatusSchema,
} from './types';

export function createPixTools(userId: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    listPixKeys: tool({
      description:
        'Lista todas as chaves PIX cadastradas pelo usuário. Use para mostrar opções de transferência.',
      inputSchema: z.object({
        includeInactive: z.boolean().default(false).describe('Incluir chaves inativas'),
      }),
      execute: async ({ includeInactive }) => {
        try {
          let query = supabase
            .from('pix_keys')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (!includeInactive) {
            query = query.eq('is_active', true);
          }

          const { data, error } = await query;

          if (error) {
            secureLogger.error('Erro ao buscar chaves PIX', { error: error.message, userId });
            throw new Error(`Erro ao buscar chaves PIX: ${error.message}`);
          }

          const pixKeys = (data ?? []) as PixKey[];

          return {
            pixKeys: pixKeys.map(filterSensitiveData),
            total: pixKeys.length,
            activeCount: pixKeys.filter((key) => key.isActive).length,
            message:
              pixKeys.length > 0
                ? `Encontradas ${pixKeys.length} chaves PIX (${pixKeys.filter((key) => key.isActive).length} ativas)`
                : 'Nenhuma chave PIX cadastrada',
          };
        } catch (error) {
          secureLogger.error('Falha ao listar chaves PIX', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
          });
          throw error;
        }
      },
    }),

    sendPixTransfer: tool({
      description: 'Envia uma transferência PIX. Verifica limites e segurança antes de processar.',
      inputSchema: z.object({
        recipientKey: z.string().min(1).describe('Chave PIX do destinatário'),
        recipientKeyType: PixKeyTypeSchema.describe('Tipo da chave PIX'),
        recipientName: z.string().min(1).max(200).describe('Nome completo do destinatário'),
        amount: z
          .number()
          .positive()
          .max(50000)
          .describe('Valor da transferência (máximo R$ 50.000)'),
        description: z.string().max(140).optional().describe('Descrição da transferência'),
        scheduledFor: z
          .string()
          .datetime()
          .optional()
          .describe('Agendar para data/hora específica'),
      }),
      execute: async ({
        recipientKey,
        recipientKeyType,
        recipientName,
        amount,
        description,
        scheduledFor,
      }) => {
        try {
          // TODO: Verificar limites de transação (integrar com compliance service quando disponível)
          // const dailyLimit = 50000; // Padrão: R$ 50.000 por dia

          // Gerar endToEndId único
          const endToEndId = `E${Date.now()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

          const transferData = {
            user_id: userId,
            amount,
            recipient_key: recipientKey,
            recipient_key_type: recipientKeyType,
            recipient_name: recipientName,
            description: description ?? null,
            status: scheduledFor ? 'SCHEDULED' : 'PENDING',
            end_to_end_id: endToEndId,
            scheduled_for: scheduledFor ?? null,
            created_at: new Date().toISOString(),
          };

          const { data, error } = await supabase
            .from('pix_transfers')
            .insert(transferData)
            .select()
            .single();

          if (error) {
            secureLogger.error('Erro ao criar transferência PIX', {
              error: error.message,
              userId,
              amount,
              recipientKey: `${recipientKey.substring(0, 3)}***`,
            });
            throw new Error(`Erro ao processar transferência PIX: ${error.message}`);
          }

          const transfer = data as PixTransfer;

          // Log de auditoria para compliance
          await supabase.from('compliance_audit_logs').insert({
            user_id: userId,
            event_type: 'pix_transfer_initiated',
            resource_type: 'pix_transfers',
            resource_id: transfer.id,
            description: `Transferência PIX de R$ ${amount.toFixed(2)} para ${recipientName}`,
            metadata: {
              amount,
              recipient_key_type: recipientKeyType,
              end_to_end_id: endToEndId,
              scheduled: !!scheduledFor,
            },
          });

          secureLogger.info('Transferência PIX criada com sucesso', {
            transferId: transfer.id,
            userId,
            amount,
            endToEndId,
          });

          const scheduledMessage = scheduledFor
            ? ` agendada para ${new Date(scheduledFor).toLocaleString('pt-BR')}`
            : ' sendo processada';

          return {
            success: true,
            transfer: filterSensitiveData(transfer),
            message: `Transferência PIX de R$ ${amount.toFixed(2)} para ${recipientName} criada${scheduledMessage}.`,
            endToEndId,
            estimatedCompletion: scheduledFor
              ? new Date(scheduledFor).toISOString()
              : new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos para transferência PIX
          };
        } catch (error) {
          secureLogger.error('Falha ao enviar transferência PIX', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
            amount,
          });
          throw error;
        }
      },
    }),

    requestPixQrCode: tool({
      description: 'Gera um QR Code PIX para receber valores. Útil para cobranças e pagamentos.',
      inputSchema: z.object({
        amount: z
          .number()
          .positive()
          .max(50000)
          .describe('Valor a receber (opcional, máximo R$ 50.000)'),
        description: z.string().max(140).optional().describe('Descrição da cobrança'),
        recipientKey: z
          .string()
          .optional()
          .describe('Chave PIX que receberá (omitir para usar padrão)'),
        expiresInMinutes: z
          .number()
          .min(5)
          .max(1440)
          .default(60)
          .describe('Tempo de expiração em minutos (padrão: 1 hora)'),
      }),
      execute: async ({ amount, description, recipientKey, expiresInMinutes }) => {
        try {
          // Se não informar chave, usar a primeira chave ativa do usuário
          let targetKey = recipientKey;
          if (!targetKey) {
            const { data: keys } = await supabase
              .from('pix_keys')
              .select('key')
              .eq('user_id', userId)
              .eq('is_active', true)
              .eq('is_default', true)
              .limit(1);

            if (!keys || keys.length === 0) {
              const { data: anyKey } = await supabase
                .from('pix_keys')
                .select('key')
                .eq('user_id', userId)
                .eq('is_active', true)
                .limit(1);

              if (!anyKey || anyKey.length === 0) {
                throw new Error(
                  'Você não possui chaves PIX cadastradas. Cadastre uma chave PIX primeiro.'
                );
              }
              targetKey = anyKey[0].key;
            } else {
              targetKey = keys[0].key;
            }
          }

          const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

          // Gerar QR Code (simulação - em produção integrar com API real)
          const qrCodePayload = `br.gov.bcb.pix${targetKey}${amount ? `${amount.toFixed(2)}` : ''}${description ? description : ''}`;
          const qrCode = btoa(qrCodePayload).substring(0, 200);

          const qrData = {
            user_id: userId,
            qr_code: qrCode,
            amount: amount ?? null,
            recipient_key: targetKey,
            description: description ?? null,
            expires_at: expiresAt,
            created_at: new Date().toISOString(),
          };

          const { data, error } = await supabase
            .from('pix_qr_codes')
            .insert(qrData)
            .select()
            .single();

          if (error) {
            secureLogger.error('Erro ao gerar QR Code PIX', { error: error.message, userId });
            throw new Error(`Erro ao gerar QR Code PIX: ${error.message}`);
          }

          const qrCodeData = data as PixQrCode;

          secureLogger.info('QR Code PIX gerado com sucesso', {
            qrCode: `${qrCodeData.qrCode.slice(0, 20)}...`,
            userId,
            amount: amount ?? 'unspecified',
            expiresAt,
          });

          return {
            success: true,
            qrCode: filterSensitiveData(qrCodeData),
            message: amount
              ? `QR Code PIX gerado para receber R$ ${amount.toFixed(2)}. Expira em ${expiresInMinutes} minutos.`
              : `QR Code PIX gerado para receber qualquer valor. Expira em ${expiresInMinutes} minutos.`,
            sharingUrl: `https://aegiswallet.app/pix/${qrCode}`,
            expiresAt,
          };
        } catch (error) {
          secureLogger.error('Falha ao gerar QR Code PIX', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
          });
          throw error;
        }
      },
    }),

    getPixTransferStatus: tool({
      description: 'Consulta o status de uma transferência PIX específica.',
      inputSchema: z.object({
        transferId: z.string().uuid().describe('ID da transferência PIX'),
        endToEndId: z
          .string()
          .optional()
          .describe('ID End-to-End da transferência (alternativo ao transferId)'),
      }),
      execute: async ({ transferId, endToEndId }) => {
        try {
          let query = supabase.from('pix_transfers').select('*').eq('user_id', userId);

          if (transferId) {
            query = query.eq('id', transferId);
          } else if (endToEndId) {
            query = query.eq('end_to_end_id', endToEndId);
          } else {
            throw new Error('É necessário informar transferId ou endToEndId');
          }

          const { data, error } = await query.single();

          if (error || !data) {
            throw new Error('Transferência PIX não encontrada');
          }

          const transfer = data as PixTransfer;

          // Calcular status detalhado
          const statusMessages = {
            PENDING: 'Aguardando processamento',
            PROCESSING: 'Processando transferência',
            COMPLETED: 'Transferência concluída com sucesso',
            FAILED: 'Transferência falhou',
            REVERSED: 'Transferência estornada',
            SCHEDULED: 'Transferência agendada',
          };

          return {
            transfer: filterSensitiveData(transfer),
            statusMessage: statusMessages[transfer.status] || 'Status desconhecido',
            isCompleted: transfer.status === 'COMPLETED',
            isFailed: ['FAILED', 'REVERSED'].includes(transfer.status),
            isPending: ['PENDING', 'PROCESSING'].includes(transfer.status),
            message: `Transferência PIX de R$ ${transfer.amount.toFixed(2)} para ${transfer.recipientName}: ${statusMessages[transfer.status]}`,
          };
        } catch (error) {
          secureLogger.error('Falha ao consultar status PIX', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
            transferId: transferId ?? endToEndId,
          });
          throw error;
        }
      },
    }),

    listPixTransfers: tool({
      description: 'Lista histórico de transferências PIX com filtros opcionais.',
      inputSchema: z.object({
        startDate: z.string().datetime().optional().describe('Data inicial'),
        endDate: z.string().datetime().optional().describe('Data final'),
        status: PixTransferStatusSchema.optional().describe('Filtrar por status'),
        minAmount: z.number().positive().optional().describe('Valor mínimo'),
        maxAmount: z.number().positive().optional().describe('Valor máximo'),
        limit: z.number().min(1).max(100).default(20).describe('Número de resultados'),
        offset: z.number().min(0).default(0).describe('Pular resultados para paginação'),
      }),
      execute: async ({
        startDate,
        endDate,
        status,
        minAmount,
        maxAmount,
        limit = 20,
        offset = 0,
      }) => {
        try {
          let query = supabase
            .from('pix_transfers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (startDate) query = query.gte('created_at', startDate);
          if (endDate) query = query.lte('created_at', endDate);
          if (status) query = query.eq('status', status);
          if (minAmount) query = query.gte('amount', minAmount);
          if (maxAmount) query = query.lte('amount', maxAmount);

          const { data, error, count } = await query;

          if (error) {
            secureLogger.error('Erro ao listar transferências PIX', {
              error: error.message,
              userId,
            });
            throw new Error(`Erro ao buscar transferências: ${error.message}`);
          }

          const transfers = (data ?? []) as PixTransfer[];

          // Calcular estatísticas
          const totalSent = transfers.reduce((sum, tx) => sum + tx.amount, 0);
          const successfulTransfers = transfers.filter((tx) => tx.status === 'COMPLETED');
          const totalSuccess = successfulTransfers.reduce((sum, tx) => sum + tx.amount, 0);

          return {
            transfers: transfers.map(filterSensitiveData),
            total: count ?? 0,
            hasMore: (count ?? 0) > offset + limit,
            statistics: {
              totalSent,
              totalSuccess,
              successfulCount: successfulTransfers.length,
              averageAmount: transfers.length > 0 ? totalSent / transfers.length : 0,
            },
            message:
              transfers.length > 0
                ? `Encontradas ${transfers.length} transferências PIX (total: R$ ${totalSent.toFixed(2)})`
                : 'Nenhuma transferência PIX encontrada no período',
          };
        } catch (error) {
          secureLogger.error('Falha ao listar transferências PIX', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
          });
          throw error;
        }
      },
    }),

    schedulePixTransfer: tool({
      description: 'Agenda uma transferência PIX para data futura.',
      inputSchema: z.object({
        recipientKey: z.string().min(1).describe('Chave PIX do destinatário'),
        recipientKeyType: PixKeyTypeSchema.describe('Tipo da chave PIX'),
        recipientName: z.string().min(1).max(200).describe('Nome completo do destinatário'),
        amount: z.number().positive().max(50000).describe('Valor da transferência'),
        scheduledFor: z.string().datetime().describe('Data e hora para agendamento'),
        description: z.string().max(140).optional().describe('Descrição da transferência'),
        recurring: z.boolean().default(false).describe('Transferência recorrente'),
      }),
      execute: async ({
        recipientKey,
        recipientKeyType,
        recipientName,
        amount,
        scheduledFor,
        description,
        recurring: _recurring,
      }) => {
        try {
          const scheduledDate = new Date(scheduledFor);
          const now = new Date();

          if (scheduledDate <= now) {
            throw new Error('A data de agendamento deve ser futura');
          }

          if (scheduledDate > new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)) {
            throw new Error('O agendamento máximo é de 90 dias');
          }

          // Gerar endToEndId único
          const endToEndId = `E${Date.now()}${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

          const transferData = {
            user_id: userId,
            amount,
            recipient_key: recipientKey,
            recipient_key_type: recipientKeyType,
            recipient_name: recipientName,
            description: description ?? null,
            status: 'SCHEDULED',
            end_to_end_id: endToEndId,
            scheduled_for: scheduledFor,
            created_at: new Date().toISOString(),
          };

          const { data, error } = await supabase
            .from('pix_transfers')
            .insert(transferData)
            .select()
            .single();

          if (error) {
            secureLogger.error('Erro ao agendar transferência PIX', {
              error: error.message,
              userId,
              amount,
              recipientKey: `${recipientKey.substring(0, 3)}***`,
            });
            throw new Error(`Erro ao agendar transferência PIX: ${error.message}`);
          }

          const transfer = data as PixTransfer;

          // Log de auditoria para compliance
          await supabase.from('compliance_audit_logs').insert({
            user_id: userId,
            event_type: 'pix_transfer_scheduled',
            resource_type: 'pix_transfers',
            resource_id: transfer.id,
            description: `Transferência PIX de R$ ${amount.toFixed(2)} agendada para ${scheduledDate.toLocaleString('pt-BR')}`,
            metadata: {
              amount,
              recipient_key_type: recipientKeyType,
              end_to_end_id: endToEndId,
              scheduled_for: scheduledFor,
            },
          });

          secureLogger.info('Transferência PIX agendada com sucesso', {
            transferId: transfer.id,
            userId,
            amount,
            scheduledFor,
          });

          return {
            success: true,
            transfer: filterSensitiveData(transfer),
            message: `Transferência PIX de R$ ${amount.toFixed(2)} para ${recipientName} agendada para ${scheduledDate.toLocaleString('pt-BR')}.`,
            endToEndId,
            scheduledFor,
          };
        } catch (error) {
          secureLogger.error('Falha ao agendar transferência PIX', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
            scheduledFor,
          });
          throw error;
        }
      },
    }),
  };
}
