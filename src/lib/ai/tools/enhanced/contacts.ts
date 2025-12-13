import { tool } from 'ai';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

import { secureLogger } from '../../../logging/secure-logger';
import { filterSensitiveData } from '../../security/filter';
import { type ContactWithPaymentMethods, PixKeyTypeSchema } from './types';
import { db } from '@/db/client';
import { contactPaymentMethods, contacts } from '@/db/schema';

// Interface for transfer results to ensure type safety
interface TransferResult {
	success: boolean;
	transfer: Record<string, unknown>;
	message: string;
	endToEndId?: string;
	estimatedCompletion?: string;
}

// Interface for PIX transfer result
interface PixTransferResult {
	success: boolean;
	transfer: Record<string, unknown>;
	message: string;
	endToEndId?: string;
	estimatedCompletion?: string;
}

export function createContactsTools(userId: string) {
	return {
		listContacts: tool({
			description:
				'Lista todos os contatos do usuário com métodos de pagamento. Use para encontrar contatos para transferências.',
			parameters: z.object({
				searchName: z.string().optional().describe('Buscar por nome do contato'),
				hasPix: z.boolean().optional().describe('Filtrar contatos com chave PIX'),
				favoritesOnly: z.boolean().default(false).describe('Mostrar apenas favoritos'),
				limit: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
			}),
			execute: async ({ searchName, hasPix, favoritesOnly, limit = 20 }) => {
				try {
					// Build conditions
					const conditions = [eq(contacts.userId, userId)];
					if (searchName) {
						conditions.push(ilike(contacts.name, `%${searchName}%`));
					}
					if (favoritesOnly) {
						conditions.push(eq(contacts.isFavorite, true));
					}

					// Fetch contacts
					const contactsData = await db
						.select()
						.from(contacts)
						.where(and(...conditions))
						.orderBy(desc(contacts.isFavorite), contacts.name)
						.limit(limit);

					// Fetch payment methods for each contact
					const contactIds = contactsData.map((c) => c.id);
					const paymentMethodsData =
						contactIds.length > 0
							? await db
									.select()
									.from(contactPaymentMethods)
									.where(or(...contactIds.map((id) => eq(contactPaymentMethods.contactId, id))))
							: [];

					// Combine contacts with payment methods
					const contactsWithMethods = contactsData.map((contact) => ({
						...contact,
						// Map camelCase to snake_case for type compatibility
						created_at: contact.createdAt?.toISOString(),
						updated_at: contact.updatedAt?.toISOString(),
						user_id: contact.userId,
						is_favorite: contact.isFavorite ?? false,
						contact_payment_methods: paymentMethodsData
							.filter((pm) => pm.contactId === contact.id)
							.map((pm) => ({
								...pm,
								payment_type: pm.methodType,
								is_favorite: (pm.methodDetails as { is_favorite?: boolean })?.is_favorite ?? false,
								usage_count: (pm.methodDetails as { usage_count?: number })?.usage_count ?? 0,
							})),
					})) as unknown as ContactWithPaymentMethods[];

					const filteredContacts = filterContactsByPix(contactsWithMethods, hasPix);
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
			parameters: z.object({
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
					// Check if contact exists
					const orConditions = [eq(contacts.name, name)];
					if (email) orConditions.push(eq(contacts.email, email));
					if (phone) orConditions.push(eq(contacts.phone, phone));

					const existingContact = await db
						.select({ id: contacts.id })
						.from(contacts)
						.where(and(eq(contacts.userId, userId), or(...orConditions)))
						.limit(1);

					if (existingContact && existingContact.length > 0) {
						throw new Error('Já existe um contato com essas informações');
					}

					// Insert contact
					const [contact] = await db
						.insert(contacts)
						.values({
							userId: userId,
							name: name.trim(),
							email: email?.trim() || null,
							phone: phone?.trim() || null,
							cpf: cpf?.trim() || null,
							isFavorite: isFavorite,
						})
						.returning();

					if (!contact) {
						throw new Error('Erro ao adicionar contato');
					}

					secureLogger.info('Contato adicionado com sucesso', {
						contactId: contact.id,
						userId,
						contactName: name,
						isFavorite,
					});

					return {
						success: true,
						contact: filterSensitiveData(contact),
						message: `Contato "${name}" adicionado com sucesso${isFavorite ? ' e marcado como favorito' : ''}`,
						nextStep: 'Adicione métodos de pagamento (PIX, TED, DOC) para facilitar transferências',
					};
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
			parameters: z.object({
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
					// Validate contact exists
					const [foundContact] = await db
						.select({ name: contacts.name })
						.from(contacts)
						.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
						.limit(1);

					if (!foundContact) {
						throw new Error('Contato não encontrado');
					}

					// Validate payment fields
					if (paymentType === 'PIX' && !(pixKey && pixKeyType)) {
						throw new Error('Para PIX, é necessário informar a chave e o tipo da chave');
					}
					if (['TED', 'DOC'].includes(paymentType) && !(bankCode && agency && accountNumber)) {
						throw new Error('Para TED/DOC, é necessário informar dados bancários completos');
					}

					// Insert payment method
					const methodDetails: Record<string, unknown> = {
						label: label || null,
						is_favorite: isFavorite,
						is_verified: false,
						usage_count: 0,
					};

					if (paymentType === 'PIX') {
						methodDetails.pix_key = pixKey;
						methodDetails.pix_key_type = pixKeyType;
					} else {
						methodDetails.bank_code = bankCode;
						methodDetails.bank_name = bankName;
						methodDetails.agency = agency;
						methodDetails.account_number = accountNumber;
						methodDetails.account_type = accountType;
					}

					const [paymentMethod] = await db
						.insert(contactPaymentMethods)
						.values({
							contactId: contactId,
							methodType: paymentType,
							methodDetails: methodDetails,
						})
						.returning();

					if (!paymentMethod) {
						throw new Error('Erro ao adicionar método de pagamento');
					}

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
						contactName: foundContact.name,
						message: `Método de pagamento ${paymentType} adicionado para "${foundContact.name}": ${paymentDescription}`,
						isReady: paymentType === 'PIX',
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
			parameters: z.object({
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
			// biome-ignore lint: Complex business logic for handling multiple payment types
			execute: async ({ contactId, paymentMethodId, amount, description, paymentType }) => {
				try {
					// Fetch contact
					const [contact] = await db
						.select()
						.from(contacts)
						.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
						.limit(1);

					if (!contact) {
						throw new Error('Contato não encontrado');
					}

					// Fetch payment methods
					const paymentMethodsData = await db
						.select()
						.from(contactPaymentMethods)
						.where(eq(contactPaymentMethods.contactId, contactId));

					// Select payment method
					let selectedMethod: (typeof paymentMethodsData)[0] | undefined;
					if (paymentMethodId) {
						selectedMethod = paymentMethodsData.find((pm) => pm.id === paymentMethodId);
						if (!selectedMethod) {
							throw new Error('Método de pagamento não encontrado para este contato');
						}
					} else {
						selectedMethod = paymentMethodsData[0];
						if (!selectedMethod) {
							throw new Error('Nenhum método de pagamento encontrado para este contato');
						}
					}

					// Validate payment type if specified
					if (paymentType && selectedMethod.methodType !== paymentType) {
						throw new Error(
							`O método selecionado é do tipo ${selectedMethod.methodType}, mas foi solicitado ${paymentType}`,
						);
					}

					// Update usage count
					const currentUsage =
						(selectedMethod.methodDetails as { usage_count?: number })?.usage_count ?? 0;
					await db
						.update(contactPaymentMethods)
						.set({
							methodDetails: {
								...(selectedMethod.methodDetails as Record<string, unknown>),
								usage_count: currentUsage + 1,
								last_used_at: new Date().toISOString(),
							},
							updatedAt: new Date(),
						})
						.where(eq(contactPaymentMethods.id, selectedMethod.id));

					// Create transfer
					const details = selectedMethod.methodDetails as Record<string, unknown>;
					const finalDescription = description || `Transferência para ${contact.name}`;
					let transferResult: TransferResult;

					if (selectedMethod.methodType === 'PIX') {
						const { createPixTools } = await import('./pix');
						const pixTools = createPixTools(userId);

						if (!pixTools.sendPixTransfer?.execute) {
							throw new Error('PIX transfer functionality not available');
						}

						// Validate Brazilian CPF format for PIX transfers
						const recipientKey = details.pix_key as string;
						const recipientKeyType = details.pix_key_type as string;

						if (recipientKeyType === 'CPF' && !isValidBrazilianCPF(recipientKey)) {
							throw new Error('CPF inválido para transferência PIX');
						}

						// Execute PIX transfer using the tool's execute method
						const pixTransferResult = (await pixTools.sendPixTransfer.execute(
							{
								recipientKey,
								recipientKeyType: recipientKeyType as
									| 'CPF'
									| 'CNPJ'
									| 'EMAIL'
									| 'PHONE'
									| 'RANDOM_KEY',
								recipientName: contact.name,
								amount,
								description: finalDescription,
							},
							{},
						)) as PixTransferResult;

						// Map PIX transfer result to TransferResult interface
						transferResult = {
							success: pixTransferResult.success,
							transfer: pixTransferResult.transfer,
							message: pixTransferResult.message,
							endToEndId: pixTransferResult.endToEndId,
							estimatedCompletion: pixTransferResult.estimatedCompletion,
						};
					} else {
						transferResult = {
							success: true,
							transfer: {
								id: `TRF${Date.now()}`,
								amount,
								recipientName: contact.name,
								recipientBank: details.bank_name,
								accountInfo: details.account_number,
								status: 'PENDING',
							},
							message: `Transferência ${selectedMethod.methodType} de R$ ${amount.toFixed(2)} agendada para ${contact.name}`,
						};
					}

					secureLogger.info('Transferência para contato criada com sucesso', {
						contactId,
						userId,
						amount,
						paymentType: selectedMethod.methodType,
						paymentMethodId: selectedMethod.id,
					});

					return {
						success: true,
						transfer: transferResult.transfer || transferResult,
						contact: {
							id: contact.id,
							name: contact.name,
							paymentMethod: {
								type: selectedMethod.methodType,
								label: details.label,
								key: details.pix_key || details.account_number,
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
			parameters: z.object({
				contactId: z.string().uuid().describe('ID do contato'),
				isFavorite: z.boolean().describe('Marcar como favorito (true) ou remover favorito (false)'),
			}),
			execute: async ({ contactId, isFavorite }) => {
				try {
					const [contact] = await db
						.update(contacts)
						.set({
							isFavorite: isFavorite,
							updatedAt: new Date(),
						})
						.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
						.returning({ name: contacts.name });

					if (!contact) {
						throw new Error('Contato não encontrado');
					}

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
			parameters: z.object({
				contactId: z.string().uuid().describe('ID do contato'),
				confirmDeletion: z.boolean().default(false).describe('Confirmação final da exclusão'),
			}),
			execute: async ({ contactId, confirmDeletion }) => {
				try {
					if (!confirmDeletion) {
						// Buscar informações para confirmação
						const [contactToConfirm] = await db
							.select({ name: contacts.name })
							.from(contacts)
							.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
							.limit(1);

						if (!contactToConfirm) {
							throw new Error('Contato não encontrado');
						}

						// Count payment methods
						const paymentMethodsCount = await db
							.select({ id: contactPaymentMethods.id })
							.from(contactPaymentMethods)
							.where(eq(contactPaymentMethods.contactId, contactId));

						return {
							requiresConfirmation: true,
							contactId,
							contactName: contactToConfirm.name,
							paymentMethodsCount: paymentMethodsCount.length,
							message: `Deseja realmente excluir o contato "${contactToConfirm.name}" e todos os seus métodos de pagamento? Esta ação não pode ser desfeita.`,
						};
					}

					// Buscar nome para log
					const [contactForLog] = await db
						.select({ name: contacts.name })
						.from(contacts)
						.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
						.limit(1);

					// Excluir métodos de pagamento primeiro (devido a foreign key)
					await db
						.delete(contactPaymentMethods)
						.where(eq(contactPaymentMethods.contactId, contactId));

					// Excluir contato
					await db
						.delete(contacts)
						.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));

					secureLogger.info('Contato excluído com sucesso', {
						contactId,
						userId,
						contactName: contactForLog?.name || 'Nome não disponível',
					});

					return {
						success: true,
						contactId,
						message: `Contato "${contactForLog?.name}" e todos os seus métodos de pagamento foram excluídos com sucesso`,
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
function filterContactsByPix(
	contactList: ContactWithPaymentMethods[],
	hasPix: boolean | undefined,
) {
	if (hasPix === undefined) return contactList;

	return contactList.filter((contactItem) =>
		hasPix
			? contactItem.contact_payment_methods.some((pm) => pm.payment_type === 'PIX')
			: !contactItem.contact_payment_methods.some((pm) => pm.payment_type === 'PIX'),
	);
}

function calculateContactsStatistics(contactList: ContactWithPaymentMethods[]) {
	const totalContacts = contactList.length;
	const favoriteContacts = contactList.filter((c) => c.is_favorite).length;
	const contactsWithPix = contactList.filter((c) =>
		c.contact_payment_methods.some((pm) => pm.payment_type === 'PIX'),
	).length;
	const totalPaymentMethods = contactList.reduce(
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

function formatContactsResponse(contactList: ContactWithPaymentMethods[]) {
	return contactList.map((contactItem) => ({
		...filterSensitiveData(contactItem),
		paymentMethods: contactItem.contact_payment_methods.map(filterSensitiveData),
		hasPix: contactItem.contact_payment_methods.some((pm) => pm.payment_type === 'PIX'),
		favoritePaymentMethod: contactItem.contact_payment_methods.sort(
			(a, b) => b.usage_count - a.usage_count,
		)[0],
	}));
}

function buildContactsResponse(
	formattedContacts: Record<string, unknown>[],
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

// Brazilian CPF validation for LGPD compliance
function isValidBrazilianCPF(cpf: string): boolean {
	// Remove non-numeric characters
	const cleanCPF = cpf.replace(/\D/g, '');

	// Check if it has 11 digits
	if (cleanCPF.length !== 11) {
		return false;
	}

	// Check if all digits are the same (invalid CPF)
	if (/^(\d)\1+$/.test(cleanCPF)) {
		return false;
	}

	// Calculate first verification digit
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += Number.parseInt(cleanCPF.charAt(i), 10) * (10 - i);
	}
	let remainder = (sum * 10) % 11;
	const firstDigit = remainder === 10 ? 0 : remainder;

	// Calculate second verification digit
	sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += Number.parseInt(cleanCPF.charAt(i), 10) * (11 - i);
	}
	remainder = (sum * 10) % 11;
	const secondDigit = remainder === 10 ? 0 : remainder;

	// Check if verification digits match
	return (
		firstDigit === Number.parseInt(cleanCPF.charAt(9), 10) &&
		secondDigit === Number.parseInt(cleanCPF.charAt(10), 10)
	);
}
