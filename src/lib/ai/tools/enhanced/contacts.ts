import { createClient } from '@supabase/supabase-js';
import { tool } from 'ai';
import { z } from 'zod';

import { secureLogger } from '../../../logging/secure-logger';
import { filterSensitiveData } from '../../security/filter';
import {
  type ContactDbRow,
  type ContactPaymentMethodDbRow,
  type ContactWithPaymentMethods,
  PixKeyTypeSchema,
} from './types';

// Interface for transfer results to ensure type safety
interface TransferResult {
  success: boolean;
  transfer: Record<string, unknown>;
  message: string;
  endToEndId?: string;
  estimatedCompletion?: string;
}

export function createContactsTools(userId: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    listContacts: tool({
      description:
        'Lista todos os contatos do usuário com métodos de pagamento. Use para encontrar contatos para transferências.',
      inputSchema: z.object({
        searchName: z.string().optional().describe('Buscar por nome do contato'),
        hasPix: z.boolean().optional().describe('Filtrar contatos com chave PIX'),
        favoritesOnly: z.boolean().default(false).describe('Mostrar apenas favoritos'),
        limit: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
      }),
      execute: async ({ searchName, hasPix, favoritesOnly, limit = 20 }) => {
        try {
          const query = buildContactsQuery(supabase, userId, searchName, favoritesOnly, limit);
          const contacts = await fetchContactsData(query, userId);
          const filteredContacts = filterContactsByPix(contacts, hasPix);
          const statistics = calculateContactsStatistics(filteredContacts);
          const formattedContacts = formatContactsResponse(filteredContacts);

          return buildContactsResponse(formattedContacts, statistics);
        } catch (error) {
          secureLogger.error('Falha ao listar contatos', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
          });
          throw error;
        }
      },
    }),

    addContact: tool({
      description: 'Adiciona um novo contato para transferências.',
      inputSchema: z.object({
        name: z.string().min(1).max(100).describe('Nome completo do contato'),
        email: z.string().email().optional().describe('Email do contato'),
        phone: z.string().optional().describe('Telefone com DDD'),
        cpf: z
          .string()
          .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
          .optional()
          .describe('CPF formatado'),
        isFavorite: z.boolean().default(false).describe('Marcar como favorito'),
      }),
      execute: async ({ name, email, phone, cpf, isFavorite }) => {
        try {
          await checkContactExists(supabase, userId, name, email, phone);
          const contactData = prepareContactData(userId, name, email, phone, cpf, isFavorite);
          const contact = await insertContact(supabase, contactData, userId, name);
          logContactCreation(contact, userId, name, isFavorite);

          return buildAddContactResponse(contact, name, isFavorite);
        } catch (error) {
          secureLogger.error('Falha ao adicionar contato', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
            contactName: name,
          });
          throw error;
        }
      },
    }),

    addContactPaymentMethod: tool({
      description: 'Adiciona um método de pagamento PIX/TED/DOC a um contato existente.',
      inputSchema: z.object({
        contactId: z.string().uuid().describe('ID do contato'),
        paymentType: z.enum(['PIX', 'TED', 'DOC']).describe('Tipo de pagamento'),
        label: z.string().max(50).optional().describe('Etiqueta para identificar o método'),
        isFavorite: z.boolean().default(false).describe('Marcar como método favorito'),
        // PIX fields
        pixKey: z.string().optional().describe('Chave PIX'),
        pixKeyType: PixKeyTypeSchema.optional().describe('Tipo da chave PIX'),
        // Bank transfer fields
        bankCode: z.string().optional().describe('Código do banco'),
        bankName: z.string().optional().describe('Nome do banco'),
        agency: z.string().optional().describe('Agência'),
        accountNumber: z.string().optional().describe('Número da conta'),
        accountType: z.enum(['corrente', 'poupança']).optional().describe('Tipo de conta'),
      }),
      execute: async ({
        contactId,
        paymentType,
        label,
        isFavorite,
        pixKey,
        pixKeyType,
        bankCode,
        bankName,
        agency,
        accountNumber,
        accountType,
      }) => {
        try {
          // Verificar se contato existe
          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select('name')
            .eq('id', contactId)
            .eq('user_id', userId)
            .single();

          if (contactError || !contact) {
            throw new Error('Contato não encontrado');
          }

          // Validar campos baseado no tipo de pagamento
          if (paymentType === 'PIX' && (!pixKey || !pixKeyType)) {
            throw new Error('Para PIX, é necessário informar a chave e o tipo da chave');
          }

          if (['TED', 'DOC'].includes(paymentType) && (!bankCode || !agency || !accountNumber)) {
            throw new Error('Para TED/DOC, é necessário informar dados bancários completos');
          }

          const paymentMethodData = {
            user_id: userId,
            contact_id: contactId,
            payment_type: paymentType,
            pix_key: pixKey || null,
            pix_key_type: pixKeyType || null,
            bank_code: bankCode || null,
            bank_name: bankName || null,
            agency: agency || null,
            account_number: accountNumber || null,
            account_type: accountType || null,
            label: label || null,
            is_favorite: isFavorite,
            is_verified: false, // Por padrão, métodos começam não verificados
            usage_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data, error } = await supabase
            .from('contact_payment_methods')
            .insert(paymentMethodData)
            .select()
            .single();

          if (error) {
            secureLogger.error('Erro ao adicionar método de pagamento', {
              error: error.message,
              userId,
              contactId,
              paymentType,
            });
            throw new Error(`Erro ao adicionar método de pagamento: ${error.message}`);
          }

          const paymentMethod = data as ContactPaymentMethodDbRow;

          secureLogger.info('Método de pagamento adicionado com sucesso', {
            paymentMethodId: paymentMethod.id,
            userId,
            contactId,
            paymentType,
            isFavorite,
          });

          const paymentDescription =
            paymentType === 'PIX'
              ? `chave PIX ${pixKey} (${pixKeyType})`
              : `conta ${accountType} - ${bankName || `Banco ${bankCode}`}`;

          return {
            success: true,
            paymentMethod: filterSensitiveData(paymentMethod),
            contactName: contact.name,
            message: `Método de pagamento ${paymentType} adicionado para "${contact.name}": ${paymentDescription}`,
            isReady: paymentType === 'PIX', // PIX já está pronto para uso
          };
        } catch (error) {
          secureLogger.error('Falha ao adicionar método de pagamento', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
            contactId,
            paymentType,
          });
          throw error;
        }
      },
    }),

    sendToContact: tool({
      description: 'Envia transferência para um contato usando método de pagamento salvo.',
      inputSchema: z.object({
        contactId: z.string().uuid().describe('ID do contato'),
        paymentMethodId: z
          .string()
          .uuid()
          .optional()
          .describe('ID do método de pagamento (omitir para usar favorito)'),
        amount: z.number().positive().max(50000).describe('Valor da transferência'),
        description: z.string().max(140).optional().describe('Descrição da transferência'),
        paymentType: z
          .enum(['PIX', 'TED', 'DOC'])
          .optional()
          .describe('Tipo de transferência (se não informado, usa o do método)'),
      }),
      execute: async ({ contactId, paymentMethodId, amount, description, paymentType }) => {
        try {
          // Buscar contato e métodos de pagamento
          const { data: contact, error: contactError } = await supabase
            .from('contacts')
            .select(`
              *,
              contact_payment_methods(*)
            `)
            .eq('id', contactId)
            .eq('user_id', userId)
            .single();

          if (contactError || !contact) {
            throw new Error('Contato não encontrado');
          }

          const paymentMethods = contact.contact_payment_methods as ContactPaymentMethodDbRow[];

          // Selecionar método de pagamento
          let selectedMethod: ContactPaymentMethodDbRow | undefined;

          if (paymentMethodId) {
            selectedMethod = paymentMethods.find((pm) => pm.id === paymentMethodId);
            if (!selectedMethod) {
              throw new Error('Método de pagamento não encontrado para este contato');
            }
          } else {
            // Usar método favorito ou o mais usado
            selectedMethod =
              paymentMethods
                .filter((pm) => pm.is_favorite)
                .sort((a, b) => b.usage_count - a.usage_count)[0] ||
              paymentMethods.sort((a, b) => b.usage_count - a.usage_count)[0];

            if (!selectedMethod) {
              throw new Error('Nenhum método de pagamento encontrado para este contato');
            }
          }

          // Validar tipo de pagamento
          if (paymentType && selectedMethod.payment_type !== paymentType) {
            throw new Error(
              `O método selecionado é do tipo ${selectedMethod.payment_type}, mas foi solicitado ${paymentType}`,
            );
          }

          // Incrementar contador de uso do método
          await supabase
            .from('contact_payment_methods')
            .update({
              usage_count: selectedMethod.usage_count + 1,
              last_used_at: new Date().toISOString(),
            })
            .eq('id', selectedMethod.id);

          // Criar transferência baseada no tipo
          let transferResult: TransferResult;
          const finalDescription = description || `Transferência para ${contact.name}`;

          if (selectedMethod.payment_type === 'PIX') {
            // Usar PIX tools
            const { createPixTools } = await import('./pix');
            const pixTools = createPixTools(userId);

            if (!selectedMethod.pix_key || !selectedMethod.pix_key_type) {
              throw new Error('Método PIX selecionado não possui chave configurada');
            }

            // Call the execute function of the sendPixTransfer tool
            const executeFunc = pixTools.sendPixTransfer.execute;
            if (!executeFunc) {
              throw new Error('Função de transferência PIX não disponível');
            }
            const pixTransferResult = (await executeFunc(
              {
                recipientKey: selectedMethod.pix_key,
                recipientKeyType: selectedMethod.pix_key_type,
                recipientName: contact.name,
                amount,
                description: finalDescription,
              },
              {} as never,
            )) as TransferResult;
            transferResult = pixTransferResult;
          } else {
            // TED/DOC - simular criação de transferência
            // Em produção, integrar com serviço bancário
            transferResult = {
              success: true,
              transfer: {
                id: `TRF${Date.now()}`,
                amount,
                recipientName: contact.name,
                recipientBank: selectedMethod.bank_name,
                accountInfo: selectedMethod.account_number,
                status: 'PENDING',
              },
              message: `Transferência ${selectedMethod.payment_type} de R$ ${amount.toFixed(2)} agendada para ${contact.name}`,
            };
          }

          secureLogger.info('Transferência para contato criada com sucesso', {
            contactId,
            userId,
            amount,
            paymentType: selectedMethod.payment_type,
            paymentMethodId: selectedMethod.id,
          });

          return {
            success: true,
            transfer: transferResult.transfer || transferResult,
            contact: {
              id: contact.id,
              name: contact.name,
              paymentMethod: {
                type: selectedMethod.payment_type,
                label: selectedMethod.label,
                key: selectedMethod.pix_key || selectedMethod.account_number,
              },
            },
            message:
              transferResult.message ||
              `Transferência de R$ ${amount.toFixed(2)} enviada para ${contact.name} com sucesso!`,
          };
        } catch (error) {
          secureLogger.error('Falha ao enviar transferência para contato', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
            contactId,
            amount,
          });
          throw error;
        }
      },
    }),

    favoriteContact: tool({
      description: 'Marca ou desmarca um contato como favorito.',
      inputSchema: z.object({
        contactId: z.string().uuid().describe('ID do contato'),
        isFavorite: z.boolean().describe('Marcar como favorito (true) ou remover favorito (false)'),
      }),
      execute: async ({ contactId, isFavorite }) => {
        try {
          const { data, error } = await supabase
            .from('contacts')
            .update({
              is_favorite: isFavorite,
              updated_at: new Date().toISOString(),
            })
            .eq('id', contactId)
            .eq('user_id', userId)
            .select('name')
            .single();

          if (error) {
            secureLogger.error('Erro ao atualizar favorito do contato', {
              error: error.message,
              userId,
              contactId,
            });
            throw new Error(`Erro ao atualizar contato: ${error.message}`);
          }

          const contact = data;

          secureLogger.info('Favorito do contato atualizado com sucesso', {
            contactId,
            userId,
            isFavorite,
            contactName: contact.name,
          });

          return {
            success: true,
            contactId,
            isFavorite,
            contactName: contact.name,
            message: isFavorite
              ? `"${contact.name}" marcado como favorito`
              : `"${contact.name}" removido dos favoritos`,
          };
        } catch (error) {
          secureLogger.error('Falha ao atualizar favorito do contato', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
            contactId,
          });
          throw error;
        }
      },
    }),

    deleteContact: tool({
      description: 'Remove um contato e todos os seus métodos de pagamento.',
      inputSchema: z.object({
        contactId: z.string().uuid().describe('ID do contato'),
        confirmDeletion: z.boolean().default(false).describe('Confirmação final da exclusão'),
      }),
      execute: async ({ contactId, confirmDeletion }) => {
        try {
          if (!confirmDeletion) {
            // Buscar informações para confirmação
            const { data: contact } = await supabase
              .from('contacts')
              .select('name, contact_payment_methods(count)')
              .eq('id', contactId)
              .eq('user_id', userId)
              .single();

            if (!contact) {
              throw new Error('Contato não encontrado');
            }

            return {
              requiresConfirmation: true,
              contactId,
              contactName: contact.name,
              paymentMethodsCount: contact.contact_payment_methods?.[0]?.count || 0,
              message: `Deseja realmente excluir o contato "${contact.name}" e todos os seus métodos de pagamento? Esta ação não pode ser desfeita.`,
            };
          }

          // Buscar nome para log
          const { data: contact } = await supabase
            .from('contacts')
            .select('name')
            .eq('id', contactId)
            .eq('user_id', userId)
            .single();

          // Excluir métodos de pagamento primeiro (devido a foreign key)
          await supabase.from('contact_payment_methods').delete().eq('contact_id', contactId);

          // Excluir contato
          const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contactId)
            .eq('user_id', userId);

          if (error) {
            secureLogger.error('Erro ao excluir contato', {
              error: error.message,
              userId,
              contactId,
            });
            throw new Error(`Erro ao excluir contato: ${error.message}`);
          }

          secureLogger.info('Contato excluído com sucesso', {
            contactId,
            userId,
            contactName: contact?.name || 'Nome não disponível',
          });

          return {
            success: true,
            contactId,
            message: `Contato "${contact?.name}" e todos os seus métodos de pagamento foram excluídos com sucesso`,
          };
        } catch (error) {
          secureLogger.error('Falha ao excluir contato', {
            error: error instanceof Error ? error.message : 'Unknown',
            userId,
            contactId,
          });
          throw error;
        }
      },
    }),
  };
}

// Helper functions for listContacts
function buildContactsQuery(
  // biome-ignore lint/suspicious/noExplicitAny: Supabase client type is dynamic
  supabaseClient: any,
  userId: string,
  searchName: string | undefined,
  favoritesOnly: boolean,
  limit: number,
) {
  let query = supabaseClient
    .from('contacts')
    .select(`
      *,
      contact_payment_methods(*)
    `)
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('name', { ascending: true })
    .limit(limit);

  if (searchName) {
    query = query.ilike('name', `%${searchName}%`);
  }
  if (favoritesOnly) {
    query = query.eq('is_favorite', true);
  }

  return query;
}

// biome-ignore lint/suspicious/noExplicitAny: Query type is dynamic from Supabase builder
async function fetchContactsData(query: any, userId: string) {
  const { data, error } = await query;

  if (error) {
    secureLogger.error('Erro ao listar contatos', {
      error: error.message,
      userId,
    });
    throw new Error(`Erro ao buscar contatos: ${error.message}`);
  }

  return (data ?? []) as ContactWithPaymentMethods[];
}

function filterContactsByPix(contacts: ContactWithPaymentMethods[], hasPix: boolean | undefined) {
  if (hasPix === undefined) return contacts;

  return contacts.filter((contact) =>
    hasPix
      ? contact.contact_payment_methods.some((pm) => pm.payment_type === 'PIX')
      : !contact.contact_payment_methods.some((pm) => pm.payment_type === 'PIX'),
  );
}

function calculateContactsStatistics(contacts: ContactWithPaymentMethods[]) {
  const totalContacts = contacts.length;
  const favoriteContacts = contacts.filter((c) => c.is_favorite).length;
  const contactsWithPix = contacts.filter((c) =>
    c.contact_payment_methods.some((pm) => pm.payment_type === 'PIX'),
  ).length;
  const totalPaymentMethods = contacts.reduce(
    (sum, c) => sum + c.contact_payment_methods.length,
    0,
  );

  return {
    totalContacts,
    favoriteContacts,
    contactsWithPix,
    totalPaymentMethods,
  };
}

function formatContactsResponse(contacts: ContactWithPaymentMethods[]) {
  return contacts.map((contact) => ({
    ...filterSensitiveData(contact),
    paymentMethods: contact.contact_payment_methods.map(filterSensitiveData),
    hasPix: contact.contact_payment_methods.some((pm) => pm.payment_type === 'PIX'),
    favoritePaymentMethod: contact.contact_payment_methods.sort(
      (a, b) => b.usage_count - a.usage_count,
    )[0],
  }));
}

function buildContactsResponse(
  // biome-ignore lint/suspicious/noExplicitAny: Formatted contacts have dynamic structure
  formattedContacts: any[],
  statistics: {
    totalContacts: number;
    favoriteContacts: number;
    contactsWithPix: number;
    totalPaymentMethods: number;
  },
) {
  const { totalContacts, favoriteContacts, contactsWithPix } = statistics;

  return {
    contacts: formattedContacts,
    total: totalContacts,
    summary: {
      favoriteContacts,
      contactsWithPix,
      totalPaymentMethods: statistics.totalPaymentMethods,
    },
    message:
      formattedContacts.length > 0
        ? `Encontrados ${totalContacts} contatos (${favoriteContacts} favoritos, ${contactsWithPix} com PIX)`
        : 'Nenhum contato encontrado',
  };
}

// Helper functions for addContact
// biome-ignore lint/suspicious/noExplicitAny: Supabase client type is dynamic
async function checkContactExists(
	supabaseClient: any,
	userId: string,
	name: string,
	email?: string,
	phone?: string,
) {
  const { data: existingContact } = await supabaseClient
    .from('contacts')
    .select('id')
    .eq('user_id', userId)
    .or(`name.eq.${name},${email ? `email.eq.${email}` : ''},${phone ? `phone.eq.${phone}` : ''}`)
    .limit(1);

  if (existingContact && existingContact.length > 0) {
    throw new Error('Já existe um contato com essas informações');
  }
}

function prepareContactData(
  userId: string,
  name: string,
  email?: string,
  phone?: string,
  cpf?: string,
  isFavorite?: boolean,
) {
  return {
    user_id: userId,
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    cpf: cpf?.trim() || null,
    is_favorite: isFavorite,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function insertContact(
	// biome-ignore lint/suspicious/noExplicitAny: Supabase client and contact data types are dynamic
	supabaseClient: any,
	contactData: any,
	userId: string,
	name: string,
) {
  const { data, error } = await supabaseClient
    .from('contacts')
    .insert(contactData)
    .select()
    .single();

  if (error) {
    secureLogger.error('Erro ao adicionar contato', {
      error: error.message,
      userId,
      contactName: name,
    });
    throw new Error(`Erro ao adicionar contato: ${error.message}`);
  }

  return data as ContactDbRow;
}

function logContactCreation(
  contact: ContactDbRow,
  userId: string,
  name: string,
  isFavorite?: boolean,
) {
  secureLogger.info('Contato adicionado com sucesso', {
    contactId: contact.id,
    userId,
    contactName: name,
    isFavorite,
  });
}

function buildAddContactResponse(contact: ContactDbRow, name: string, isFavorite?: boolean) {
  return {
    success: true,
    contact: filterSensitiveData(contact),
    message: `Contato "${name}" adicionado com sucesso${isFavorite ? ' e marcado como favorito' : ''}`,
    nextStep: 'Adicione métodos de pagamento (PIX, TED, DOC) para facilitar transferências',
  };
}
