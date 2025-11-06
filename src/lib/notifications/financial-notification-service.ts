/**
 * Financial Notification Service
 *
 * Enhanced notification system for Brazilian financial reminders
 * Integrates with calendar events and provides contextual notifications
 */

import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { createPushProvider, type PushConfig, type PushMessage } from '@/lib/security/pushProvider';
import { logError, logOperation } from '@/server/lib/logger';

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
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

/**
 * Brazilian Financial Notification Service
 */
export class FinancialNotificationService {
  private pushProvider: any;
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
      pixTransferReminders: [2, 1], // PIX transfers
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
          style: 'currency',
          currency: 'BRL',
        }).format(Math.abs(event.amount))
      : '';

    const isPayment = event.amount && event.amount < 0;
    const isReceivable = event.amount && event.amount > 0;

    // Different message templates based on event type and timing
    if (daysUntil <= 0) {
      // Overdue or due today
      if (isPayment) {
        return {
          title: `🔴 Pagamento Vencido: ${event.title}`,
          body: `Pagamento de ${formattedAmount} venceu hoje. Realize o pagamento imediatamente para evitar juros.`,
          actions: [
            { action: 'pay', title: 'Pagar Agora', icon: '/icons/pix.png' },
            {
              action: 'remind',
              title: 'Lembrar Depois',
              icon: '/icons/clock.png',
            },
          ],
          data: {
            type: 'payment_overdue',
            eventId: event.id,
            amount: event.amount,
            urgency: 'urgent',
          },
        };
      } else if (isReceivable) {
        return {
          title: `💰 Recebimento Hoje: ${event.title}`,
          body: `Você receberá ${formattedAmount} hoje em sua conta.`,
          actions: [{ action: 'view', title: 'Ver Detalhes', icon: '/icons/eye.png' }],
          data: {
            type: 'receipt_today',
            eventId: event.id,
            amount: event.amount,
          },
        };
      }
    } else if (daysUntil === 1) {
      // Due tomorrow
      if (isPayment) {
        return {
          title: `⚠️ Pagamento Amanhã: ${event.title}`,
          body: `Pagamento de ${formattedAmount} vence amanhã (${formattedDate}).`,
          actions: [
            { action: 'pay', title: 'Pagar Agora', icon: '/icons/pix.png' },
            {
              action: 'schedule',
              title: 'Agendar',
              icon: '/icons/calendar.png',
            },
          ],
          data: {
            type: 'payment_tomorrow',
            eventId: event.id,
            amount: event.amount,
            urgency: 'high',
          },
        };
      } else if (isReceivable) {
        return {
          title: `💳 Recebimento Amanhã: ${event.title}`,
          body: `Você receberá ${formattedAmount} amanhã (${formattedDate}).`,
          data: {
            type: 'receipt_tomorrow',
            eventId: event.id,
            amount: event.amount,
          },
        };
      }
    } else if (daysUntil <= 7) {
      // Due this week
      if (isPayment) {
        return {
          title: `📅 Pagamento Esta Semana: ${event.title}`,
          body: `Pagamento de ${formattedAmount} vence em ${daysUntil} dias (${formattedDate}).`,
          actions: [
            { action: 'pay', title: 'Pagar Agora', icon: '/icons/pix.png' },
            {
              action: 'schedule',
              title: 'Agendar',
              icon: '/icons/calendar.png',
            },
          ],
          data: {
            type: 'payment_this_week',
            eventId: event.id,
            amount: event.amount,
            daysUntil,
            urgency: 'normal',
          },
        };
      } else if (isReceivable) {
        return {
          title: `📈 Recebimento Esta Semana: ${event.title}`,
          body: `Você receberá ${formattedAmount} em ${daysUntil} dias (${formattedDate}).`,
          data: {
            type: 'receipt_this_week',
            eventId: event.id,
            amount: event.amount,
            daysUntil,
          },
        };
      }
    } else {
      // Future event
      return {
        title: `📋 Lembrete: ${event.title}`,
        body: `${event.title} agendado para ${formattedDate}${formattedAmount ? ` - ${formattedAmount}` : ''}`,
        actions: [
          { action: 'view', title: 'Ver Detalhes', icon: '/icons/eye.png' },
          { action: 'edit', title: 'Editar', icon: '/icons/edit.png' },
        ],
        data: {
          type: 'future_event',
          eventId: event.id,
          amount: event.amount,
          daysUntil,
        },
      };
    }

    // Default fallback
    return {
      title: `📅 Lembrete Financeiro`,
      body: `${event.title} em ${formattedDate}${formattedAmount ? ` - ${formattedAmount}` : ''}`,
      data: {
        type: 'generic_reminder',
        eventId: event.id,
        amount: event.amount,
      },
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

      // PIX e transferências
      'pix-transfer': this.config.pixTransferReminders,
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
            event_id: event.id,
            remind_at: remindAt,
            reminder_type: 'notification',
            message: notification.body,
            created_at: new Date().toISOString(),
          });

          logOperation('create_automated_reminder', userId, 'event_reminders', undefined, {
            eventId: event.id,
            daysBefore,
            remindAt,
            reminderType: 'notification',
          });
        }
      }
    } catch (error) {
      logError('create_automated_reminders', userId, error as Error, {
        eventId: event.id,
        eventTitle: event.title,
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
        ? { title: '📅 Lembrete Financeiro', body: customMessage }
        : this.generateNotificationMessage(event, daysUntil);

      const pushMessage: PushMessage = {
        title: notification.title,
        body: notification.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        requireInteraction: daysUntil <= 1,
        tag: `financial-event-${event.id}`,
        actions: notification.actions,
        data: {
          ...notification.data,
          eventId: event.id,
          userId,
          timestamp: new Date().toISOString(),
        },
      };

      const result = await this.pushProvider.sendPushNotification(userId, pushMessage);

      if (result.success) {
        logOperation('send_financial_notification_success', userId, 'notifications', undefined, {
          eventId: event.id,
          eventTitle: event.title,
          daysUntil,
          messageId: result.messageId,
        });
      } else {
        logError(
          'send_financial_notification_failed',
          userId,
          new Error(result.error || 'Unknown error'),
          {
            eventId: event.id,
            eventTitle: event.title,
          }
        );
      }
    } catch (error) {
      logError('send_financial_notification_error', userId, error as Error, {
        eventId: event.id,
        eventTitle: event.title,
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
            event_date,
            event_type_id,
            user_id,
            priority,
            is_completed,
            event_types(name, icon, color),
            transaction_categories(name, color, icon)
          )
        `)
        .eq('is_sent', false)
        .lte('remind_at', now)
        .order('remind_at', { ascending: true });

      if (error) {
        logError('fetch_pending_reminders', 'system', error, {
          operation: 'processPendingReminders',
        });
        return;
      }

      for (const reminder of reminders || []) {
        const event = reminder.financial_events;
        if (!event) continue;

        try {
          await this.sendFinancialNotification(event, event.user_id, reminder.message);

          // Mark reminder as sent
          await supabase
            .from('event_reminders')
            .update({
              is_sent: true,
              sent_at: new Date().toISOString(),
            })
            .eq('id', reminder.id);
        } catch (notificationError) {
          logError(
            'process_reminder_notification_failed',
            event.user_id,
            notificationError as Error,
            {
              reminderId: reminder.id,
              eventId: event.id,
            }
          );
        }
      }

      logOperation('process_pending_reminders_complete', 'system', 'event_reminders', undefined, {
        processedCount: reminders?.length || 0,
      });
    } catch (error) {
      logError('process_pending_reminders_error', 'system', error as Error, {
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
            style: 'currency',
            currency: 'BRL',
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
        event_id: event.id,
        remind_at: reminderTime,
        reminder_type: 'voice',
        message: voiceMessage,
        created_at: new Date().toISOString(),
      });

      logOperation('create_voice_reminder', userId, 'event_reminders', undefined, {
        eventId: event.id,
        reminderTime,
        messageType: 'voice',
      });
    } catch (error) {
      logError('create_voice_reminder', userId, error as Error, {
        eventId: event.id,
        reminderTime,
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

export async function sendPixTransferReminder(
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
