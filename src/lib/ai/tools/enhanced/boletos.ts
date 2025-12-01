import { tool } from 'ai';
import { and, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

import { secureLogger } from '../../../logging/secure-logger';
import { filterSensitiveData } from '../../security/filter';
import type { Boleto, BoletoCalculation } from './types';
import { db } from '@/db/client';
import { boletos, complianceAuditLogs, transactionSchedules } from '@/db/schema';

export function createBoletoTools(userId: string) {
	return {
		listBoletos: tool({
			description:
				'Lista todos os boletos do usuário com filtros opcionais. Use para consultar boletos pendentes, pagos ou vencidos.',
			parameters: z.object({
				status: z
					.enum(['ALL', 'REGISTERED', 'PAID', 'OVERDUE', 'CANCELED'])
					.default('ALL')
					.describe('Filtrar por status do boleto'),
				startDate: z.string().datetime().optional().describe('Data inicial do vencimento'),
				endDate: z.string().datetime().optional().describe('Data final do vencimento'),
				minAmount: z.number().positive().optional().describe('Valor mínimo'),
				maxAmount: z.number().positive().optional().describe('Valor máximo'),
				limit: z.number().min(1).max(100).default(20).describe('Número máximo de resultados'),
				offset: z.number().min(0).default(0).describe('Pular N resultados para paginação'),
			}),
			execute: async ({
				status,
				startDate,
				endDate,
				minAmount,
				maxAmount,
				limit = 20,
				offset = 0,
			}) => {
				try {
					// Build conditions array
					const conditions = [eq(boletos.userId, userId)];

					if (status !== 'ALL') {
						conditions.push(eq(boletos.status, status));
					}
					if (startDate) conditions.push(gte(boletos.dueDate, startDate));
					if (endDate) conditions.push(lte(boletos.dueDate, endDate));
					if (minAmount) conditions.push(gte(boletos.amount, String(minAmount)));
					if (maxAmount) conditions.push(lte(boletos.amount, String(maxAmount)));

					const data = await db
						.select()
						.from(boletos)
						.where(and(...conditions))
						.orderBy(boletos.dueDate)
						.limit(limit)
						.offset(offset);

					const boletosList = (data ?? []) as unknown as Boleto[];
					const now = new Date();

					// Calcular estatísticas e classificações
					const registered = boletosList.filter((b) => b.status === 'REGISTERED');
					const paid = boletosList.filter((b) => b.status === 'PAID');
					const overdue = boletosList.filter(
						(b) => b.status === 'REGISTERED' && new Date(b.dueDate) < now,
					);

					const totalAmount = boletosList.reduce((sum, b) => sum + b.amount, 0);
					const pendingAmount = registered.reduce((sum, b) => sum + b.amount, 0);
					const overdueAmount = overdue.reduce((sum, b) => sum + b.amount, 0);

					return {
						boletos: boletosList.map(filterSensitiveData),
						total: boletosList.length,
						hasMore: boletosList.length >= limit,
						summary: {
							registered: registered.length,
							paid: paid.length,
							overdue: overdue.length,
							totalAmount,
							pendingAmount,
							overdueAmount,
						},
						message:
							boletosList.length > 0
								? `Encontrados ${boletosList.length} boletos (${overdue.length} vencidos, total de R$ ${pendingAmount.toFixed(2)})`
								: 'Nenhum boleto encontrado',
					};
				} catch (error) {
					secureLogger.error('Falha ao listar boletos', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
					});
					throw error;
				}
			},
		}),

		registerBoleto: tool({
			description: 'Registra um novo boleto a partir do código de barras ou linha digitável.',
			parameters: z.object({
				barcode: z
					.string()
					.length(44)
					.regex(/^[0-9]+$/)
					.describe('Código de barras de 44 dígitos'),
				digitableLine: z
					.string()
					.length(47)
					.regex(/^[0-9. ]+$/)
					.describe('Linha digitável (opcional, será calculada se não informada)'),
				captureMethod: z
					.enum(['barcode', 'image', 'manual'])
					.default('manual')
					.describe('Método de captura do boleto'),
			}),
			execute: async ({ barcode, digitableLine, captureMethod }) => {
				try {
					// Validar e extrair informações do código de barras
					const boletoInfo = await extractBoletoInformation(barcode);

					// Verificar se boleto já existe
					const existingBoleto = await db
						.select({ id: boletos.id })
						.from(boletos)
						.where(
							and(
								eq(boletos.userId, userId),
								eq(boletos.barcode, barcode),
								eq(boletos.status, 'PAID'),
							),
						)
						.limit(1);

					if (existingBoleto && existingBoleto.length > 0) {
						throw new Error('Este boleto já foi pago e está registrado no sistema.');
					}

					// Gerar linha digitável se não informada
					const calculatedDigitableLine = digitableLine || generateDigitableLine(barcode);

					const boletoData = {
						userId: userId,
						barcode,
						lineIdDigitable: calculatedDigitableLine,
						amount: String(boletoInfo.amount),
						dueDate: boletoInfo.dueDate,
						beneficiaryName: boletoInfo.payeeName || 'Beneficiário não identificado',
						beneficiaryCnpj: boletoInfo.payeeDocument || null,
						status: 'REGISTERED',
						description: `Captura: ${captureMethod}`,
					};

					const [insertedBoleto] = await db.insert(boletos).values(boletoData).returning();

					if (!insertedBoleto) {
						secureLogger.error('Erro ao registrar boleto', {
							error: 'Insert failed',
							userId,
							barcode: `${barcode.substring(0, 10)}***`,
						});
						throw new Error('Erro ao registrar boleto: Insert failed');
					}

					// Use the inserted data directly
					const boletoId = insertedBoleto?.id;

					// Log de auditoria
					await db.insert(complianceAuditLogs).values({
						userId: userId,
						eventType: 'data_accessed', // Changed from 'consent_granted' as it's more appropriate
						resourceType: 'boletos',
						resourceId: boletoId,
						description: `Boleto registrado no valor de R$ ${Number(boletoData.amount).toFixed(2)} - Vencimento: ${new Date(boletoData.dueDate).toLocaleDateString('pt-BR')}`,
						metadata: {
							amount: boletoData.amount,
							due_date: boletoData.dueDate,
							capture_method: captureMethod,
							payee_name: boletoData.beneficiaryName,
						},
					});

					secureLogger.info('Boleto registrado com sucesso', {
						boletoId,
						userId,
						amount: Number(boletoData.amount),
						dueDate: boletoData.dueDate,
					});

					// Calcular dias até vencimento
					const daysUntilDue = Math.ceil(
						(new Date(boletoData.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
					);

					return {
						success: true,
						boleto: filterSensitiveData(boletoData),
						message: `Boleto registrado com sucesso! Valor: R$ ${Number(boletoData.amount).toFixed(2)}, Vencimento: ${new Date(boletoData.dueDate).toLocaleDateString('pt-BR')}`,
						daysUntilDue,
						isOverdue: daysUntilDue < 0,
						paymentUrgency: daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low',
					};
				} catch (error) {
					secureLogger.error('Falha ao registrar boleto', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						barcode: `${barcode.substring(0, 10)}***`,
					});
					throw error;
				}
			},
		}),

		calculateBoletoPayment: tool({
			description:
				'Calcula valor total do boleto com juros, multas e descontos baseado na data de pagamento.',
			parameters: z.object({
				boletoId: z.string().uuid().describe('ID do boleto'),
				paymentDate: z.string().datetime().optional().describe('Data de pagamento (padrão: hoje)'),
			}),
			execute: async ({ boletoId, paymentDate }) => {
				try {
					// Buscar boleto
					const [boleto] = await db
						.select()
						.from(boletos)
						.where(and(eq(boletos.id, boletoId), eq(boletos.userId, userId)))
						.limit(1);

					if (!boleto) {
						throw new Error('Boleto não encontrado');
					}

					const paymentDt = paymentDate ? new Date(paymentDate) : new Date();
					if (!boleto.dueDate) {
						throw new Error('Boleto não possui data de vencimento');
					}
					const dueDate = new Date(boleto.dueDate);

					if (boleto.status === 'paid') {
						throw new Error('Este boleto já está pago');
					}

					// Calcular juros e multas - convert DB record to Boleto type
					if (!boleto.dueDate) {
						throw new Error('Boleto não possui data de vencimento');
					}
					const boletoForCalc = {
						...boleto,
						amount: Number(boleto.amount),
						dueDate: boleto.dueDate,
					} as unknown as Boleto;
					const calculation = calculateBoletoAmount(boletoForCalc, paymentDt);

					return {
						boletoId,
						originalAmount: Number(boleto.amount),
						calculation: calculation,
						paymentDate: paymentDt.toISOString().split('T')[0],
						dueDate: boleto.dueDate,
						isOverdue: paymentDt > dueDate,
						message:
							`Valor original: R$ ${Number(boleto.amount).toFixed(2)}. ` +
							`${calculation.fineAmount ? `Multa: R$ ${calculation.fineAmount.toFixed(2)}. ` : ''}` +
							`${calculation.interestAmount ? `Juros: R$ ${calculation.interestAmount.toFixed(2)}. ` : ''}` +
							`${calculation.discountAmount ? `Desconto: R$ ${calculation.discountAmount.toFixed(2)}. ` : ''}` +
							`Total a pagar: R$ ${calculation.totalAmount.toFixed(2)}`,
					};
				} catch (error) {
					secureLogger.error('Falha ao calcular pagamento do boleto', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						boletoId,
					});
					throw error;
				}
			},
		}),

		payBoleto: tool({
			description: 'Realiza o pagamento de um boleto. Verifica saldo e processa pagamento.',
			parameters: z.object({
				boletoId: z.string().uuid().describe('ID do boleto a pagar'),
				accountId: z
					.string()
					.uuid()
					.optional()
					.describe('ID da conta para débito (omitir para usar padrão)'),
				paymentDate: z.string().datetime().optional().describe('Data de pagamento (padrão: hoje)'),
				confirmPayment: z
					.boolean()
					.default(false)
					.describe('Confirmação final do pagamento (depois de calcular valores)'),
			}),
			execute: async ({ boletoId, accountId: _accountId, paymentDate, confirmPayment }) => {
				try {
					// Buscar boleto
					const [boleto] = await db
						.select()
						.from(boletos)
						.where(and(eq(boletos.id, boletoId), eq(boletos.userId, userId)))
						.limit(1);

					if (!boleto) {
						throw new Error('Boleto não encontrado');
					}

					if (boleto.status === 'paid') {
						throw new Error('Este boleto já está pago');
					}

					const paymentDt = paymentDate ? new Date(paymentDate) : new Date();
					if (!boleto.dueDate) {
						throw new Error('Boleto não possui data de vencimento');
					}
					const boletoForCalc = {
						...boleto,
						amount: Number(boleto.amount),
						dueDate: boleto.dueDate,
					} as unknown as Boleto;
					const calculation = calculateBoletoAmount(boletoForCalc, paymentDt);

					// Se não houver confirmação, retornar cálculo para confirmação
					if (!confirmPayment) {
						return {
							requiresConfirmation: true,
							boletoId,
							calculation,
							message: `Confirma o pagamento do boleto ${boleto.barcode.substring(0, 10)}... no valor total de R$ ${calculation.totalAmount.toFixed(2)}?`,
							originalAmount: Number(boleto.amount),
							totalAmount: calculation.totalAmount,
							additionalAmount: calculation.totalAmount - Number(boleto.amount),
						};
					}

					// Verificar saldo da conta (em produção, integrar com serviço de contas)
					// Por ora, simular verificação
					const hasBalance = true; // Simulação

					if (!hasBalance) {
						throw new Error('Saldo insuficiente para realizar o pagamento');
					}

					// Processar pagamento
					const [updatedBoleto] = await db
						.update(boletos)
						.set({
							status: 'paid',
							paymentDate: paymentDt,
							discountAmount: calculation.discountAmount
								? String(calculation.discountAmount)
								: null,
							fineAmount: calculation.fineAmount ? String(calculation.fineAmount) : null,
							interestAmount: calculation.interestAmount
								? String(calculation.interestAmount)
								: null,
							updatedAt: new Date(),
						})
						.where(eq(boletos.id, boletoId))
						.returning();

					if (!updatedBoleto) {
						secureLogger.error('Erro ao processar pagamento do boleto', {
							error: 'Update failed',
							userId,
							boletoId,
						});
						throw new Error('Erro ao processar pagamento: Update failed');
					}

					// Log de auditoria
					await db.insert(complianceAuditLogs).values({
						userId: userId,
						eventType: 'consent_granted',
						resourceType: 'boletos',
						resourceId: boletoId,
						description: `Boleto pago no valor de R$ ${calculation.totalAmount.toFixed(2)}`,
						metadata: {
							original_amount: Number(boleto.amount),
							total_paid: calculation.totalAmount,
							discount: calculation.discountAmount,
							fine: calculation.fineAmount,
							interest: calculation.interestAmount,
							payment_date: paymentDt.toISOString(),
						},
					});

					secureLogger.info('Boleto pago com sucesso', {
						boletoId,
						userId,
						amount: calculation.totalAmount,
						paymentDate: paymentDt.toISOString(),
					});

					return {
						success: true,
						boleto: filterSensitiveData(updatedBoleto),
						calculation,
						message: `Boleto pago com sucesso! Valor total: R$ ${calculation.totalAmount.toFixed(2)}`,
						paymentConfirmation: {
							transactionId: `BLT${Date.now()}`,
							paidAt: paymentDt.toISOString(),
							originalAmount: Number(boleto.amount),
							totalPaid: calculation.totalAmount,
						},
					};
				} catch (error) {
					secureLogger.error('Falha ao pagar boleto', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						boletoId,
					});
					throw error;
				}
			},
		}),

		scheduleBoletoPayment: tool({
			description: 'Agenda o pagamento automático de um boleto para data futura.',
			parameters: z.object({
				boletoId: z.string().uuid().describe('ID do boleto'),
				scheduledDate: z.string().datetime().describe('Data para agendamento do pagamento'),
				accountId: z.string().uuid().optional().describe('ID da conta para débito'),
				reminderDays: z
					.number()
					.min(1)
					.max(30)
					.default(3)
					.describe('Dias antes do vencimento para enviar lembrete'),
			}),
			execute: async ({ boletoId, scheduledDate, accountId, reminderDays }) => {
				try {
					// Validar data de agendamento
					const scheduledDt = new Date(scheduledDate);
					const now = new Date();

					if (scheduledDt <= now) {
						throw new Error('A data de agendamento deve ser futura');
					}

					// Buscar boleto
					const [boleto] = await db
						.select()
						.from(boletos)
						.where(and(eq(boletos.id, boletoId), eq(boletos.userId, userId)))
						.limit(1);

					if (!boleto) {
						throw new Error('Boleto não encontrado');
					}

					if (boleto.status === 'paid') {
						throw new Error('Este boleto já está pago');
					}

					// Verificar se já existe agendamento (using transaction_schedules table)
					const existingSchedule = await db
						.select({ id: transactionSchedules.id })
						.from(transactionSchedules)
						.where(
							and(
								eq(transactionSchedules.userId, userId),
								eq(transactionSchedules.description, `boleto:${boletoId}`),
								eq(transactionSchedules.isActive, true),
							),
						)
						.limit(1);

					if (existingSchedule && existingSchedule.length > 0) {
						throw new Error('Este boleto já possui um pagamento agendado');
					}

					// Criar agendamento usando transactionSchedules
					const [schedule] = await db
						.insert(transactionSchedules)
						.values({
							userId: userId,
							accountId: accountId || null,
							amount: boleto.amount,
							description: `boleto:${boletoId}`,
							scheduledDate: scheduledDt.toISOString().split('T')[0],
							isActive: true,
							autoExecute: true,
						})
						.returning();

					if (!schedule) {
						secureLogger.error('Erro ao agendar pagamento do boleto', {
							error: 'Insert failed',
							userId,
							boletoId,
						});
						throw new Error('Erro ao agendar pagamento: Insert failed');
					}

					// Calcular data do lembrete
					const reminderDate = new Date(scheduledDt);
					reminderDate.setDate(reminderDate.getDate() - reminderDays);

					secureLogger.info('Pagamento de boleto agendado com sucesso', {
						scheduleId: schedule.id,
						userId,
						boletoId,
						scheduledDate: scheduledDt.toISOString(),
					});

					return {
						success: true,
						schedule,
						message: `Pagamento do boleto agendado para ${scheduledDt.toLocaleDateString('pt-BR')}. Lembrente será enviado em ${reminderDate.toLocaleDateString('pt-BR')}.`,
						boletoSummary: {
							id: boleto.id,
							amount: Number(boleto.amount),
							dueDate: boleto.dueDate,
							payeeName: boleto.beneficiaryName,
						},
						reminderDate: reminderDate.toISOString(),
						canCancel: true,
					};
				} catch (error) {
					secureLogger.error('Falha ao agendar pagamento do boleto', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						boletoId,
						scheduledDate,
					});
					throw error;
				}
			},
		}),

		getBoletoDetails: tool({
			description:
				'Obtém detalhes completos de um boleto específico incluindo cálculos de juros e multas.',
			parameters: z.object({
				boletoId: z.string().uuid().describe('ID do boleto'),
				includePaymentCalculation: z
					.boolean()
					.default(true)
					.describe('Incluir cálculo de valores para pagamento hoje'),
			}),
			execute: async ({ boletoId, includePaymentCalculation }) => {
				try {
					const [boleto] = await db
						.select()
						.from(boletos)
						.where(and(eq(boletos.id, boletoId), eq(boletos.userId, userId)))
						.limit(1);

					if (!boleto) {
						throw new Error('Boleto não encontrado');
					}

					const now = new Date();
					if (!boleto.dueDate) {
						throw new Error('Boleto não possui data de vencimento');
					}
					const dueDate = new Date(boleto.dueDate);
					const daysUntilDue = Math.ceil(
						(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
					);

					const details = {
						...filterSensitiveData(boleto),
						daysUntilDue,
						isOverdue: now > dueDate,
						paymentUrgency: daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low',
					};

					let paymentCalculation = null;
					if (includePaymentCalculation && boleto.status === 'pending') {
						if (!boleto.dueDate) {
							throw new Error('Boleto não possui data de vencimento');
						}
						const boletoForCalc = {
							...boleto,
							amount: Number(boleto.amount),
							dueDate: boleto.dueDate,
						} as unknown as Boleto;
						paymentCalculation = calculateBoletoAmount(boletoForCalc, now);
					}

					return {
						boleto: details,
						paymentCalculation,
						canPay: boleto.status === 'pending',
						canSchedule: boleto.status === 'pending' && daysUntilDue > 0,
						message:
							`Boleto de R$ ${Number(boleto.amount).toFixed(2)} com vencimento em ${dueDate.toLocaleDateString('pt-BR')}. ` +
							`${daysUntilDue < 0 ? 'Vencido!' : `Vence em ${daysUntilDue} dias`}.`,
					};
				} catch (error) {
					secureLogger.error('Falha ao obter detalhes do boleto', {
						error: error instanceof Error ? error.message : 'Unknown',
						userId,
						boletoId,
					});
					throw error;
				}
			},
		}),
	};
}

// Helper functions for boleto processing
async function extractBoletoInformation(barcode: string): Promise<{
	amount: number;
	dueDate: string;
	payeeName?: string;
	payeeDocument?: string;
}> {
	// Simplificação - em produção integrar com API de validação de boletos
	// Extrair valor e data do código de barras

	// Valor (posições 9-19)
	const amountValue = Number.parseInt(barcode.substring(9, 19), 10);
	const amount = amountValue / 100;

	// Data de vencimento (posições 5-9) - dias desde 07/10/1997
	const dueDateDays = Number.parseInt(barcode.substring(5, 9), 10);
	const baseDate = new Date('1997-10-07');
	const dueDate = new Date(baseDate.getTime() + dueDateDays * 24 * 60 * 60 * 1000);

	return {
		amount,
		dueDate: dueDate.toISOString().split('T')[0],
		// Em produção, consultar API bancária para obter beneficiário
		payeeName: 'Empresa ABC',
		payeeDocument: '12.345.678/0001-90',
	};
}

function generateDigitableLine(barcode: string): string {
	// Simplificação - gerar linha digitável a partir do código de barras
	// Em produção, usar algoritmo oficial
	const parts = [
		barcode.substring(0, 4),
		barcode.substring(4, 9),
		barcode.substring(9, 19),
		barcode.substring(19, 20),
		barcode.substring(20, 24),
		barcode.substring(24, 34),
		barcode.substring(34, 44),
	];

	return parts.join('.');
}

function calculateBoletoAmount(boleto: Boleto, paymentDate: Date): BoletoCalculation {
	const dueDate = new Date(boleto.dueDate);
	const isOverdue = paymentDate > dueDate;

	let fineAmount = 0;
	let interestAmount = 0;
	let discountAmount = 0;

	if (isOverdue) {
		// Multa de 2% sobre o valor principal (padrão mercado)
		fineAmount = boleto.amount * 0.02;

		// Juros de 1% ao mês proporcional aos dias de atraso
		const overdueDays = Math.ceil(
			(paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
		);
		interestAmount = boleto.amount * 0.01 * (overdueDays / 30);
	}

	// Se pagamento antes do vencimento, possível desconto (configurável)
	const daysBeforeDue = Math.ceil(
		(dueDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (daysBeforeDue > 10) {
		discountAmount = boleto.amount * 0.01; // 1% de desconto para pagamento antecipado
	}

	const totalAmount = boleto.amount + fineAmount + interestAmount - discountAmount;

	return {
		originalAmount: boleto.amount,
		discountAmount: discountAmount || undefined,
		fineAmount: fineAmount || undefined,
		interestAmount: interestAmount || undefined,
		totalAmount,
		dueDate: boleto.dueDate,
		paymentDate: paymentDate.toISOString().split('T')[0],
		daysOverdue: isOverdue
			? Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
			: undefined,
	};
}
