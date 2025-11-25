/**
 * Financial Notification Service
 *
 * Enhanced notification system for Brazilian financial reminders
 * Integrates with calendar events and provides contextual notifications
 */

import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging/logger';
import type { PushConfig, PushMessage } from '@/lib/security/pushProvider';
import { createPushProvider } from '@/lib/security/pushProvider';

// Brazilian financial event types
export interface BrazilianFinancialEvent {
  id: string;
  title: string;
  description?: string;
  amount?: number;
  eventDate: string;
  dueDate?: string;
  eventTypeId: string;
  categoryName?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: string;
  isCompleted: boolean;
}

export interface FinancialReminderConfig {
  // Standard reminder periods (in days before event)
  billPaymentReminders: number[]; // [7, 3, 1] days before
  pixTransferReminders: number[]; // [2, 1] days before
  creditCardReminders: number[]; // [5, 3, 1] days before
  investmentReminders: number[]; // [3, 1] days before
  taxPaymentReminders: number[]; // [30, 15, 7, 3, 1] days before
  salaryReminders: number[]; // [2, 1] days before
}

export interface NotificationTemplate {
  title: string;
  body: string;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  data?: Record<string, unknown>;
}

/**
 * Brazilian Financial Notification Service
 */
export class FinancialNotificationService {
  private pushProvider: unknown;
  private config: FinancialReminderConfig;

  constructor(pushConfig: PushConfig) {
    this.pushProvider = createPushProvider(pushConfig);
    this.config = this.getDefaultConfig();
  }

  /**
   * Get default Brazilian financial reminder configuration
   */
  private getDefaultConfig(): FinancialReminderConfig {
    return {
      billPaymentReminders: [7, 3, 1], // Contas (boletos)
      pixTransferReminders: [], // PIX transfers removed
      creditCardReminders: [5, 3, 1], // Credit card bills
      investmentReminders: [3, 1], // Investment maturities
      taxPaymentReminders: [30, 15, 7, 3, 1], // Tax payments
      salaryReminders: [2, 1], // Salary receipts
    };
  }

  /**
   * Generate contextual notification message for Brazilian financial events
   */
  private generateNotificationMessage(
    event: BrazilianFinancialEvent,
    daysUntil: number
  ): NotificationTemplate {
    const eventDate = parseISO(event.eventDate);
    const formattedDate = format(eventDate, "dd 'de' MMMM", { locale: ptBR });
    const formattedAmount = event.amount
      ? new Intl.NumberFormat('pt-BR', {
          currency: 'BRL',
          style: 'currency',
        }).format(Math.abs(event.amount))
      : '';

    const isPayment = event.amount && event.amount < 0;
    const isReceivable = event.amount && event.amount > 0;

    // Different message templates based on event type and timing
    if (daysUntil <= 0) {
      // Overdue or due today
      if (isPayment) {
        return {
          actions: [
            { action: 'pay', icon: '/icons/payment.png', title: 'Pagar Agora' },
            {
              action: 'remind',
              icon: '/icons/clock.png',
              title: 'Lembrar Depois',
            },
          ],
          body: `Pagamento de ${formattedAmount} venceu hoje. Realize o pagamento imediatamente para evitar juros.`,
          data: {
            amount: event.amount,
            eventId: event.id,
            type: 'payment_overdue',
            urgency: 'urgent',
          },
          title: `🔴 Pagamento Vencido: ${event.title}`,
        };
      }
      if (isReceivable) {
        return {
          actions: [{ action: 'view', icon: '/icons/eye.png', title: 'Ver Detalhes' }],
          body: `Você receberá ${formattedAmount} hoje em sua conta.`,
          data: {
            amount: event.amount,
            eventId: event.id,
            type: 'receipt_today',
          },
          title: `💰 Recebimento Hoje: ${event.title}`,
        };
      }
    } else if (daysUntil === 1) {
      // Due tomorrow
      if (isPayment) {
        return {
          actions: [
            { action: 'pay', icon: '/icons/payment.png', title: 'Pagar Agora' },
            {
              action: 'schedule',
              icon: '/icons/calendar.png',
              title: 'Agendar',
            },
          ],
          body: `Pagamento de ${formattedAmount} vence amanhã (${formattedDate}).`,
          data: {
            amount: event.amount,
            eventId: event.id,
            type: 'payment_tomorrow',
            urgency: 'high',
          },
          title: `⚠️ Pagamento Amanhã: ${event.title}`,
        };
      }
      if (isReceivable) {
        return {
          body: `Você receberá ${formattedAmount} amanhã (${formattedDate}).`,
          data: {
            amount: event.amount,
            eventId: event.id,
            type: 'receipt_tomorrow',
          },
          title: `💳 Recebimento Amanhã: ${event.title}`,
        };
      }
    } else if (daysUntil <= 7) {
      // Due this week
      if (isPayment) {
        return {
          actions: [
            { action: 'pay', icon: '/icons/payment.png', title: 'Pagar Agora' },
            {
              action: 'schedule',
              icon: '/icons/calendar.png',
              title: 'Agendar',
            },
          ],
          body: `Pagamento de ${formattedAmount} vence em ${daysUntil} dias (${formattedDate}).`,
          data: {
            amount: event.amount,
            daysUntil,
            eventId: event.id,
            type: 'payment_this_week',
            urgency: 'normal',
          },
          title: `📅 Pagamento Esta Semana: ${event.title}`,
        };
      }
      if (isReceivable) {
        return {
          body: `Você receberá ${formattedAmount} em ${daysUntil} dias (${formattedDate}).`,
          data: {
            amount: event.amount,
            daysUntil,
            eventId: event.id,
            type: 'receipt_this_week',
          },
          title: `📈 Recebimento Esta Semana: ${event.title}`,
        };
      }
    } else {
      // Future event
      return {
        actions: [
          { action: 'view', icon: '/icons/eye.png', title: 'Ver Detalhes' },
          { action: 'edit', icon: '/icons/edit.png', title: 'Editar' },
        ],
        body: `${event.title} agendado para ${formattedDate}${formattedAmount ? ` - ${formattedAmount}` : ''}`,
        data: {
          amount: event.amount,
          daysUntil,
          eventId: event.id,
          type: 'future_event',
        },
        title: `📋 Lembrete: ${event.title}`,
      };
    }

    // Default fallback
    return {
      body: `${event.title} em ${formattedDate}${formattedAmount ? ` - ${formattedAmount}` : ''}`,
      data: {
        amount: event.amount,
        eventId: event.id,
        type: 'generic_reminder',
      },
      title: `📅 Lembrete Financeiro`,
    };
  }

  /**
   * Get reminder schedule based on Brazilian event type
   */
  private getReminderSchedule(eventTypeId: string): number[] {
    // Brazilian financial event types mapping
    const eventTypeReminders: Record<string, number[]> = {
      // Boletos e contas
      'boleto-payment': this.config.billPaymentReminders,
      'utility-bill': this.config.billPaymentReminders,
      'rent-payment': [15, 7, 3, 1],
      condominium: [10, 5, 1],

      // Transferências (PIX removido)
      'ted-transfer': [2, 1],
      'doc-transfer': [3, 1],

      // Cartão de crédito
      'credit-card-bill': this.config.creditCardReminders,
      'credit-card-payment': this.config.creditCardReminders,

      // Investimentos
      'investment-maturity': this.config.investmentReminders,
      'savings-goal': [7, 3, 1],
      'fixed-income': [5, 2, 1],

      // Impostos
      'income-tax': [60, 30, 15, 7, 3, 1],
      'property-tax': [30, 15, 7, 3, 1],
      'service-tax': [15, 7, 3, 1],

      // Salário e recebimentos
      salary: this.config.salaryReminders,
      'freelance-payment': [3, 1],
      'dividend-payment': [3, 1],

      // Default fallback
      default: [7, 3, 1],
    };

    return eventTypeReminders[eventTypeId] || eventTypeReminders.default;
  }

  /**
   * Create automated reminders for a financial event
   */
  async createAutomatedReminders(event: BrazilianFinancialEvent, userId: string): Promise<void> {
    try {
      const reminderSchedule = this.getReminderSchedule(event.eventTypeId);
      const eventDate = parseISO(event.eventDate);

      for (const daysBefore of reminderSchedule) {
        const reminderDate = addDays(eventDate, -daysBefore);
        const remindAt = reminderDate.toISOString();

        // Only create future reminders
        if (new Date(remindAt) > new Date()) {
          const daysUntil = differenceInDays(eventDate, new Date(remindAt));
          const notification = this.generateNotificationMessage(event, daysUntil);

          // Create reminder in database
          await supabase.from('event_reminders').insert({
            created_at: new Date().toISOString(),
            event_id: event.id,
            message: notification.body,
            remind_at: remindAt,
            reminder_type: 'notification',
          });

          logger.info('Created automated reminder', {
            daysBefore,
            eventId: event.id,
            operation: 'create_automated_reminder',
            remindAt,
            reminderType: 'notification',
            resource: 'event_reminders',
            userId,
          });
        }
      }
    } catch (error) {
      logger.error('create_automated_reminders failed', {
        error: (error as Error).message,
        eventId: event.id,
        eventTitle: event.title,
        operation: 'create_automated_reminders',
        userId,
      });
      throw error;
    }
  }

  /**
   * Send immediate notification for a financial event
   */
  async sendFinancialNotification(
    event: BrazilianFinancialEvent,
    userId: string,
    customMessage?: string
  ): Promise<void> {
    try {
      const daysUntil = differenceInDays(parseISO(event.eventDate), new Date());
      const notification = customMessage
        ? { body: customMessage, title: '📅 Lembrete Financeiro' }
        : this.generateNotificationMessage(event, daysUntil);

      const pushMessage: PushMessage = {
        actions: notification.actions,
        badge: '/badge-72x72.png',
        body: notification.body,
        data: {
          ...notification.data,
          eventId: event.id,
          userId,
          timestamp: new Date().toISOString(),
        },
        icon: '/icon-192x192.png',
        requireInteraction: daysUntil <= 1,
        tag: `financial-event-${event.id}`,
        title: notification.title,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.pushProvider as any).sendPushNotification(userId, pushMessage);

      if (result.success) {
        logger.info('Financial notification sent successfully', {
          daysUntil,
          eventId: event.id,
          eventTitle: event.title,
          messageId: result.messageId,
          operation: 'send_financial_notification_success',
          resource: 'notifications',
          userId,
        });
      } else {
        logger.error('Financial notification failed', {
          error: result.error || 'Unknown error',
          eventId: event.id,
          eventTitle: event.title,
          operation: 'send_financial_notification_failed',
          userId,
        });
      }
    } catch (error) {
      logger.error('send_financial_notification_error', {
        error: (error as Error).message,
        eventId: event.id,
        eventTitle: event.title,
        operation: 'send_financial_notification_error',
        userId,
      });
      throw error;
    }
  }

  /**
   * Process pending reminders (called by background job)
   */
  async processPendingReminders(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Get pending reminders that need to be sent
      const { data: reminders, error } = await supabase
        .from('event_reminders')
        .select(`
          *,
          financial_events(
            id,
            title,
            description,
            amount,
            start_date,
            due_date,
            event_type_id,
            user_id,
            priority,
            status,
            event_types(name, icon, color),
            transaction_categories(name, color, icon)
          )
        `)
        .eq('is_sent', false)
        .lte('remind_at', now)
        .order('remind_at', { ascending: true });

      if (error) {
        logger.error('Failed to fetch pending reminders', {
          component: 'system',
          error: error.message,
          operation: 'processPendingReminders',
        });
        return;
      }

      for (const reminder of reminders || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawEvent = reminder.financial_events as any;
        if (!rawEvent) {
          continue;
        }

        // Map to BrazilianFinancialEvent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event: BrazilianFinancialEvent = {
          amount: rawEvent.amount ?? undefined,
          categoryName: rawEvent.transaction_categories?.name ?? undefined,
          description: rawEvent.description ?? undefined,
          dueDate: rawEvent.due_date ?? undefined,
          eventDate: rawEvent.start_date,
          eventTypeId: rawEvent.event_type_id,
          id: rawEvent.id,
          priority: (rawEvent.priority as 'low' | 'normal' | 'high' | 'urgent') ?? 'normal',
          status: rawEvent.status ?? 'pending',
          title: rawEvent.title,
        };

        try {
          // Wait, sendFinancialNotification takes (event, userId, message).
          // BrazilianFinancialEvent doesn't have userId.
          // rawEvent has user_id.

          await this.sendFinancialNotification(
            event,
            rawEvent.user_id,
            reminder.message ?? undefined
          );

          // Mark reminder as sent
          await supabase
            .from('event_reminders')
            .update({
              is_sent: true,
              sent_at: new Date().toISOString(),
            })
            .eq('id', reminder.id);
        } catch (notificationError) {
          logger.error('Failed to process reminder notification', {
            error: (notificationError as Error).message,
            eventId: event.id,
            operation: 'process_reminder_notification_failed',
            reminderId: reminder.id,
            userId: rawEvent.user_id,
          });
        }
      }

      logger.info('Processed pending reminders', {
        component: 'system',
        operation: 'process_pending_reminders_complete',
        processedCount: reminders?.length || 0,
        resource: 'event_reminders',
      });
    } catch (error) {
      logger.error('process_pending_reminders_error', {
        component: 'system',
        error: (error as Error).message,
        operation: 'processPendingReminders',
      });
    }
  }

  /**
   * Create voice reminder for Brazilian Portuguese
   */
  async createVoiceReminder(
    event: BrazilianFinancialEvent,
    userId: string,
    reminderTime: string
  ): Promise<void> {
    try {
      const eventDate = parseISO(event.eventDate);
      const formattedDate = format(eventDate, "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      });
      const formattedAmount = event.amount
        ? new Intl.NumberFormat('pt-BR', {
            currency: 'BRL',
            style: 'currency',
          }).format(Math.abs(event.amount))
        : '';

      const isPayment = event.amount && event.amount < 0;
      const isReceivable = event.amount && event.amount > 0;

      let voiceMessage = '';
      if (isPayment) {
        voiceMessage = `Olá! Este é um lembrete da AegisWallet. Você tem um pagamento de ${formattedAmount} para ${event.title} agendado para ${formattedDate}. Não se esqueça de realizar o pagamento para evitar juros e multas.`;
      } else if (isReceivable) {
        voiceMessage = `Olá! Este é um lembrete da AegisWallet. Você receberá ${formattedAmount} de ${event.title} em ${formattedDate}. Fique atento ao seu saldo bancário.`;
      } else {
        voiceMessage = `Olá! Este é um lembrete da AegisWallet. Você tem o evento ${event.title} agendado para ${formattedDate}.`;
      }

      // Create voice reminder in database
      await supabase.from('event_reminders').insert({
        created_at: new Date().toISOString(),
        event_id: event.id,
        message: voiceMessage,
        remind_at: reminderTime,
        reminder_type: 'voice',
      });

      logger.info('Created voice reminder', {
        eventId: event.id,
        messageType: 'voice',
        operation: 'create_voice_reminder',
        reminderTime,
        resource: 'event_reminders',
        userId,
      });
    } catch (error) {
      logger.error('create_voice_reminder failed', {
        error: (error as Error).message,
        eventId: event.id,
        operation: 'create_voice_reminder',
        reminderTime,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update reminder configuration
   */
  updateConfig(newConfig: Partial<FinancialReminderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): FinancialReminderConfig {
    return { ...this.config };
  }
}

/**
 * Create financial notification service instance
 */
export function createFinancialNotificationService(
  pushConfig: PushConfig
): FinancialNotificationService {
  return new FinancialNotificationService(pushConfig);
}

/**
 * Quick notification functions for common Brazilian financial events
 */
export async function sendBillPaymentReminder(
  event: BrazilianFinancialEvent,
  userId: string,
  service: FinancialNotificationService
): Promise<void> {
  await service.sendFinancialNotification(event, userId);
}

export async function sendTransferReminder(
  event: BrazilianFinancialEvent,
  userId: string,
  service: FinancialNotificationService
): Promise<void> {
  await service.sendFinancialNotification(event, userId);
}

export async function sendCreditCardReminder(
  event: BrazilianFinancialEvent,
  userId: string,
  service: FinancialNotificationService
): Promise<void> {
  await service.sendFinancialNotification(event, userId);
}
