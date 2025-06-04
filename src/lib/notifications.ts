// Sistema de notificações simplificado para o AegisWallet
export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  // Inicializar service worker para notificações
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications não são suportadas neste navegador');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return false;
    }
  }

  // Solicitar permissão para notificações
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Permissão para notificações foi negada');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Mostrar notificação imediata
  async showNotification(data: NotificationData): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    if (this.registration) {
      // Usar service worker para notificações mais robustas
      await this.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/icon-72x72.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: true
      });
    } else {
      // Fallback para notificação simples
      new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png'
      });
    }
  }

  // Agendar notificação para lembretes de contas (usando localStorage)
  async scheduleBillReminder(billId: string, billName: string, amount: number, dueDate: Date): Promise<void> {
    // Calcular quando enviar a notificação (1 dia antes)
    const notificationDate = new Date(dueDate);
    notificationDate.setDate(notificationDate.getDate() - 1);
    notificationDate.setHours(9, 0, 0, 0); // 9h da manhã

    const reminder = {
      id: `bill-${billId}-${Date.now()}`,
      type: 'bill_reminder',
      title: '💳 Lembrete de Conta',
      body: `${billName} vence amanhã - R$ ${amount.toFixed(2)}`,
      scheduledFor: notificationDate.getTime(),
      data: {
        bill_id: billId,
        bill_name: billName,
        amount: amount,
        due_date: dueDate.toISOString()
      }
    };

    // Salvar no localStorage
    const reminders = this.getStoredReminders();
    reminders.push(reminder);
    localStorage.setItem('financial_reminders', JSON.stringify(reminders));
  }

  // Agendar alerta de orçamento
  async scheduleBudgetAlert(categoryName: string, spent: number, budget: number): Promise<void> {
    const percentage = (spent / budget) * 100;
    
    if (percentage >= 80) {
      await this.showNotification({
        title: '⚠️ Alerta de Orçamento',
        body: `Você gastou ${percentage.toFixed(0)}% do orçamento de ${categoryName}`,
        tag: `budget-alert-${categoryName}`,
        data: {
          category: categoryName,
          spent: spent,
          budget: budget,
          percentage: percentage
        }
      });
    }
  }

  // Obter lembretes armazenados
  private getStoredReminders(): any[] {
    try {
      const stored = localStorage.getItem('financial_reminders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Processar notificações pendentes
  async processScheduledNotifications(): Promise<void> {
    const now = Date.now();
    const reminders = this.getStoredReminders();
    const pendingReminders = reminders.filter(r => r.scheduledFor <= now);

    for (const reminder of pendingReminders) {
      await this.showNotification({
        title: reminder.title,
        body: reminder.body,
        tag: reminder.id,
        data: reminder.data
      });
    }

    // Remover lembretes processados
    const remainingReminders = reminders.filter(r => r.scheduledFor > now);
    localStorage.setItem('financial_reminders', JSON.stringify(remainingReminders));
  }

  // Configurar verificação periódica de notificações
  startPeriodicCheck(): void {
    // Verificar a cada 5 minutos
    setInterval(() => {
      this.processScheduledNotifications();
    }, 5 * 60 * 1000);

    // Verificar imediatamente
    this.processScheduledNotifications();
  }

  // Cancelar lembrete específico
  async cancelReminder(reminderId: string): Promise<void> {
    const reminders = this.getStoredReminders();
    const filteredReminders = reminders.filter(r => r.id !== reminderId);
    localStorage.setItem('financial_reminders', JSON.stringify(filteredReminders));
  }

  // Listar lembretes pendentes
  getPendingReminders(): any[] {
    const now = Date.now();
    return this.getStoredReminders().filter(r => r.scheduledFor > now);
  }
}

export const notificationService = new NotificationService();

// Hook para usar notificações
export function useNotifications() {
  const initialize = async () => {
    return await notificationService.initialize();
  };

  const requestPermission = async () => {
    return await notificationService.requestPermission();
  };

  const showNotification = async (data: NotificationData) => {
    return await notificationService.showNotification(data);
  };

  const scheduleBillReminder = async (billId: string, billName: string, amount: number, dueDate: Date) => {
    return await notificationService.scheduleBillReminder(billId, billName, amount, dueDate);
  };

  const scheduleBudgetAlert = async (categoryName: string, spent: number, budget: number) => {
    return await notificationService.scheduleBudgetAlert(categoryName, spent, budget);
  };

  const startPeriodicCheck = () => {
    notificationService.startPeriodicCheck();
  };

  const getPendingReminders = () => {
    return notificationService.getPendingReminders();
  };

  const cancelReminder = async (reminderId: string) => {
    return await notificationService.cancelReminder(reminderId);
  };

  return {
    initialize,
    requestPermission,
    showNotification,
    scheduleBillReminder,
    scheduleBudgetAlert,
    startPeriodicCheck,
    getPendingReminders,
    cancelReminder
  };
}

// Função para integrar com o assistente AI
export async function sendFinancialNotification(type: 'success' | 'warning' | 'info', message: string, data?: any) {
  const icons = {
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const titles = {
    success: 'Sucesso!',
    warning: 'Atenção!',
    info: 'Informação'
  };

  await notificationService.showNotification({
    title: `${icons[type]} ${titles[type]}`,
    body: message,
    tag: `financial-${type}`,
    data: data
  });
}
