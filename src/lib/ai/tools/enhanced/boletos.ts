import { createClient } from '@supabase/supabase-js';
import { tool } from 'ai';
import { z } from 'zod';

import { secureLogger } from '../../../logging/secure-logger';
import { filterSensitiveData } from '../../security/filter';
import type { Boleto, BoletoCalculation } from './types';

export function createBoletoTools(userId: string) {
	const supabaseUrl =
		process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
	const supabaseKey =
		process.env.SUPABASE_SERVICE_ROLE_KEY ||
		process.env.VITE_SUPABASE_ANON_KEY ||
		'';
	const supabase = createClient(supabaseUrl, supabaseKey);

	return {
		listBoletos: tool({
			description:
				'Lista todos os boletos do usuário com filtros opcionais. Use para consultar boletos pendentes, pagos ou vencidos.',
			inputSchema: z.object({
				status: z
					.enum(['ALL', 'REGISTERED', 'PAID', 'OVERDUE', 'CANCELED'])
					.default('ALL')
					.describe('Filtrar por status do boleto'),
				startDate: z
					.string()
					.datetime()
					.optional()
					.describe('Data inicial do vencimento'),
				endDate: z
					.string()
					.datetime()
					.optional()
					.describe('Data final do vencimento'),
				minAmount: z.number().positive().optional().describe('Valor mínimo'),
				maxAmount: z.number().positive().optional().describe('Valor máximo'),
				limit: z
					.number()
					.min(1)
					.max(100)
					.default(20)
					.describe('Número máximo de resultados'),
				offset: z
					.number()
					.min(0)
					.default(0)
					.describe('Pular N resultados para paginação'),
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
					let query = supabase
						.from('boletos')
						.select('*')
						.eq('user_id', userId)
						.order('due_date', { ascending: true })
						.range(offset, offset + limit - 1);

					if (status !== 'ALL') {
						query = query.eq('status', status);
					}
					if (startDate) query = query.gte('due_date', startDate);
					if (endDate) query = query.lte('due_date', endDate);
					if (minAmount) query = query.gte('amount', minAmount);
					if (maxAmount) query = query.lte('amount', maxAmount);

					const { data, error, count } = await query;

					if (error) {
						secureLogger.error('Erro ao listar boletos', {
							error: error.message,
							userId,
						});
						throw new Error(`Erro ao buscar boletos: ${error.message}`);
					}

					const boletos = (data ?? []) as Boleto[];
					const now = new Date();

					// Calcular estatísticas e classificações
					const registered = boletos.filter((b) => b.status === 'REGISTERED');
					const paid = boletos.filter((b) => b.status === 'PAID');
					const overdue = boletos.filter(
						(b) => b.status === 'REGISTERED' && new Date(b.dueDate) < now,
					);

					const totalAmount = boletos.reduce((sum, b) => sum + b.amount, 0);
					const pendingAmount = registered.reduce(
						(sum, b) => sum + b.amount,
						0,
					);
					const overdueAmount = overdue.reduce((sum, b) => sum + b.amount, 0);

					return {
						boletos: boletos.map(filterSensitiveData),
						total: count ?? 0,
						hasMore: (count ?? 0) > offset + limit,
						summary: {
							registered: registered.length,
							paid: paid.length,
							overdue: overdue.length,
							totalAmount,
							pendingAmount,
							overdueAmount,
						},
						message:
							boletos.length > 0
								? `Encontrados ${boletos.length} boletos (${overdue.length} vencidos, total de R$ ${pendingAmount.toFixed(2)})`
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
			description:
				'Registra um novo boleto a partir do código de barras ou linha digitável.',
			inputSchema: z.object({
				barcode: z
					.string()
					.length(44)
					.regex(/^[0-9]+$/)
					.describe('Código de barras de 44 dígitos'),
				digitableLine: z
					.string()
					.length(47)
					.regex(/^[0-9. ]+$/)
					.describe(
						'Linha digitável (opcional, será calculada se não informada)',
					),
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
					const { data: existingBoleto } = await supabase
						.from('boletos')
						.select('id')
						.eq('user_id', userId)
						.eq('barcode', barcode)
						.eq('status', 'PAID')
						.limit(1);

					if (existingBoleto && existingBoleto.length > 0) {
						throw new Error(
							'Este boleto já foi pago e está registrado no sistema.',
						);
					}

					// Gerar linha digitável se não informada
					const calculatedDigitableLine =
						digitableLine || generateDigitableLine(barcode);

					const boletoData = {
						user_id: userId,
						barcode,
						digitable_line: calculatedDigitableLine,
						amount: boletoInfo.amount,
						due_date: boletoInfo.dueDate,
						payee_name: boletoInfo.payeeName || 'Beneficiário não identificado',
						payee_document: boletoInfo.payeeDocument || null,
						status: 'REGISTERED',
						capture_method: captureMethod,
						created_at: new Date().toISOString(),
					};

					const { data, error } = await supabase
						.from('boletos')
						.insert(boletoData)
						.select()
						.single();

					if (error) {
						secureLogger.error('Erro ao registrar boleto', {
							error: error.message,
							userId,
							barcode: `${barcode.substring(0, 10)}***`,
						});
						throw new Error(`Erro ao registrar boleto: ${error.message}`);
					}

					const boleto = data as Boleto;

					// Log de auditoria
					await supabase.from('compliance_audit_logs').insert({
						user_id: userId,
						event_type: 'boleto_registered',
						resource_type: 'boletos',
						resource_id: boleto.id,
						description: `Boleto registrado no valor de R$ ${boleto.amount.toFixed(2)} - Vencimento: ${new Date(boleto.dueDate).toLocaleDateString('pt-BR')}`,
						metadata: {
							amount: boleto.amount,
							due_date: boleto.dueDate,
							capture_method: captureMethod,
							payee_name: boleto.payeeName,
						},
					});

					secureLogger.info('Boleto registrado com sucesso', {
						boletoId: boleto.id,
						userId,
						amount: boleto.amount,
						dueDate: boleto.dueDate,
					});

					// Calcular dias até vencimento
					const daysUntilDue = Math.ceil(
						(new Date(boleto.dueDate).getTime() - Date.now()) /
							(1000 * 60 * 60 * 24),
					);

					return {
						success: true,
						boleto: filterSensitiveData(boleto),
						message: `Boleto registrado com sucesso! Valor: R$ ${boleto.amount.toFixed(2)}, Vencimento: ${new Date(boleto.dueDate).toLocaleDateString('pt-BR')}`,
						daysUntilDue,
						isOverdue: daysUntilDue < 0,
						paymentUrgency:
							daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low',
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
			inputSchema: z.object({
				boletoId: z.string().uuid().describe('ID do boleto'),
				paymentDate: z
					.string()
					.datetime()
					.optional()
					.describe('Data de pagamento (padrão: hoje)'),
			}),
			execute: async ({ boletoId, paymentDate }) => {
				try {
					// Buscar boleto
					const { data: boleto, error } = await supabase
						.from('boletos')
						.select('*')
						.eq('id', boletoId)
						.eq('user_id', userId)
						.single();

					if (error || !boleto) {
						throw new Error('Boleto não encontrado');
					}

					const paymentDt = paymentDate ? new Date(paymentDate) : new Date();
					const dueDate = new Date(boleto.dueDate);

					if (boleto.status === 'PAID') {
						throw new Error('Este boleto já está pago');
					}

					// Calcular juros e multas
					const calculation = calculateBoletoAmount(boleto, paymentDt);

					return {
						boletoId,
						originalAmount: boleto.amount,
						calculation: calculation,
						paymentDate: paymentDt.toISOString().split('T')[0],
						dueDate: boleto.dueDate,
						isOverdue: paymentDt > dueDate,
						message:
							`Valor original: R$ ${boleto.amount.toFixed(2)}. ` +
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
			description:
				'Realiza o pagamento de um boleto. Verifica saldo e processa pagamento.',
			inputSchema: z.object({
				boletoId: z.string().uuid().describe('ID do boleto a pagar'),
				accountId: z
					.string()
					.uuid()
					.optional()
					.describe('ID da conta para débito (omitir para usar padrão)'),
				paymentDate: z
					.string()
					.datetime()
					.optional()
					.describe('Data de pagamento (padrão: hoje)'),
				confirmPayment: z
					.boolean()
					.default(false)
					.describe(
						'Confirmação final do pagamento (depois de calcular valores)',
					),
			}),
			execute: async ({
				boletoId,
				accountId: _accountId,
				paymentDate,
				confirmPayment,
			}) => {
				try {
					// Buscar boleto
					const { data: boleto, error } = await supabase
						.from('boletos')
						.select('*')
						.eq('id', boletoId)
						.eq('user_id', userId)
						.single();

					if (error || !boleto) {
						throw new Error('Boleto não encontrado');
					}

					if (boleto.status === 'PAID') {
						throw new Error('Este boleto já está pago');
					}

					const paymentDt = paymentDate ? new Date(paymentDate) : new Date();
					const calculation = calculateBoletoAmount(boleto, paymentDt);

					// Se não houver confirmação, retornar cálculo para confirmação
					if (!confirmPayment) {
						return {
							requiresConfirmation: true,
							boletoId,
							calculation,
							message: `Confirma o pagamento do boleto ${boleto.barcode.substring(0, 10)}... no valor total de R$ ${calculation.totalAmount.toFixed(2)}?`,
							originalAmount: boleto.amount,
							totalAmount: calculation.totalAmount,
							additionalAmount: calculation.totalAmount - boleto.amount,
						};
					}

					// Verificar saldo da conta (em produção, integrar com serviço de contas)
					// Por ora, simular verificação
					const hasBalance = true; // Simulação

					if (!hasBalance) {
						throw new Error('Saldo insuficiente para realizar o pagamento');
					}

					// Processar pagamento
					const { data: updatedBoleto, error: updateError } = await supabase
						.from('boletos')
						.update({
							status: 'PAID',
							paid_at: paymentDt.toISOString(),
							discount_amount: calculation.discountAmount || null,
							fine_amount: calculation.fineAmount || null,
							interest_amount: calculation.interestAmount || null,
							updated_at: new Date().toISOString(),
						})
						.eq('id', boletoId)
						.select()
						.single();

					if (updateError) {
						secureLogger.error('Erro ao processar pagamento do boleto', {
							error: updateError.message,
							userId,
							boletoId,
						});
						throw new Error(
							`Erro ao processar pagamento: ${updateError.message}`,
						);
					}

					// Log de auditoria
					await supabase.from('compliance_audit_logs').insert({
						user_id: userId,
						event_type: 'boleto_paid',
						resource_type: 'boletos',
						resource_id: boletoId,
						description: `Boleto pago no valor de R$ ${calculation.totalAmount.toFixed(2)}`,
						metadata: {
							original_amount: boleto.amount,
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
							originalAmount: boleto.amount,
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
			description:
				'Agenda o pagamento automático de um boleto para data futura.',
			inputSchema: z.object({
				boletoId: z.string().uuid().describe('ID do boleto'),
				scheduledDate: z
					.string()
					.datetime()
					.describe('Data para agendamento do pagamento'),
				accountId: z
					.string()
					.uuid()
					.optional()
					.describe('ID da conta para débito'),
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
					const { data: boleto, error } = await supabase
						.from('boletos')
						.select('*')
						.eq('id', boletoId)
						.eq('user_id', userId)
						.single();

					if (error || !boleto) {
						throw new Error('Boleto não encontrado');
					}

					if (boleto.status === 'PAID') {
						throw new Error('Este boleto já está pago');
					}

					// Verificar se já existe agendamento
					const { data: existingSchedule } = await supabase
						.from('scheduled_payments')
						.select('id')
						.eq('boleto_id', boletoId)
						.eq('status', 'pending')
						.limit(1);

					if (existingSchedule && existingSchedule.length > 0) {
						throw new Error('Este boleto já possui um pagamento agendado');
					}

					// Criar agendamento
					const { data: schedule, error: scheduleError } = await supabase
						.from('scheduled_payments')
						.insert({
							user_id: userId,
							boleto_id: boletoId,
							scheduled_for: scheduledDt.toISOString(),
							account_id: accountId || null,
							reminder_days: reminderDays,
							status: 'pending',
							created_at: new Date().toISOString(),
						})
						.select()
						.single();

					if (scheduleError) {
						secureLogger.error('Erro ao agendar pagamento do boleto', {
							error: scheduleError.message,
							userId,
							boletoId,
						});
						throw new Error(
							`Erro ao agendar pagamento: ${scheduleError.message}`,
						);
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
							amount: boleto.amount,
							dueDate: boleto.dueDate,
							payeeName: boleto.payeeName,
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
			inputSchema: z.object({
				boletoId: z.string().uuid().describe('ID do boleto'),
				includePaymentCalculation: z
					.boolean()
					.default(true)
					.describe('Incluir cálculo de valores para pagamento hoje'),
			}),
			execute: async ({ boletoId, includePaymentCalculation }) => {
				try {
					const { data: boleto, error } = await supabase
						.from('boletos')
						.select('*')
						.eq('id', boletoId)
						.eq('user_id', userId)
						.single();

					if (error || !boleto) {
						throw new Error('Boleto não encontrado');
					}

					const now = new Date();
					const dueDate = new Date(boleto.dueDate);
					const daysUntilDue = Math.ceil(
						(dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
					);

					const details = {
						...filterSensitiveData(boleto),
						daysUntilDue,
						isOverdue: now > dueDate,
						paymentUrgency:
							daysUntilDue <= 3 ? 'high' : daysUntilDue <= 7 ? 'medium' : 'low',
					};

					let paymentCalculation = null;
					if (includePaymentCalculation && boleto.status === 'REGISTERED') {
						paymentCalculation = calculateBoletoAmount(boleto, now);
					}

					return {
						boleto: details,
						paymentCalculation,
						canPay: boleto.status === 'REGISTERED',
						canSchedule: boleto.status === 'REGISTERED' && daysUntilDue > 0,
						message:
							`Boleto de R$ ${boleto.amount.toFixed(2)} com vencimento em ${dueDate.toLocaleDateString('pt-BR')}. ` +
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
	const amountValue = parseInt(barcode.substring(9, 19), 10);
	const amount = amountValue / 100;

	// Data de vencimento (posições 5-9) - dias desde 07/10/1997
	const dueDateDays = parseInt(barcode.substring(5, 9), 10);
	const baseDate = new Date('1997-10-07');
	const dueDate = new Date(
		baseDate.getTime() + dueDateDays * 24 * 60 * 60 * 1000,
	);

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

function calculateBoletoAmount(
	boleto: Boleto,
	paymentDate: Date,
): BoletoCalculation {
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

	const totalAmount =
		boleto.amount + fineAmount + interestAmount - discountAmount;

	return {
		originalAmount: boleto.amount,
		discountAmount: discountAmount || undefined,
		fineAmount: fineAmount || undefined,
		interestAmount: interestAmount || undefined,
		totalAmount,
		dueDate: boleto.dueDate,
		paymentDate: paymentDate.toISOString().split('T')[0],
		daysOverdue: isOverdue
			? Math.ceil(
					(paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
				)
			: undefined,
	};
}
