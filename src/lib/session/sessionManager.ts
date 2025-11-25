import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';

export interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  extendOnActivity: boolean;
  enableTracking: boolean;
  warningEnabled: boolean;
}

export interface SessionState {
  isActive: boolean;
  lastActivity: Date;
  warningShown: boolean;
  timeRemaining: number;
  sessionId: string;
}

export class SessionManager {
  private readonly config: SessionConfig;
  private state: SessionState;
  private warningTimeout?: NodeJS.Timeout;
  private expiryTimeout?: NodeJS.Timeout;
  private activityEventListeners: {
    target: EventTarget;
    event: string;
    handler: EventListener;
  }[] = [];
  private readonly WARNING_MODAL_ID = 'session-warning-modal';
  private readonly STORAGE_KEYS = {
    LAST_ACTIVITY: 'session_last_activity',
    SESSION_ID: 'session_id',
    WARNING_SHOWN: 'session_warning_shown',
  };

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = {
      timeoutMinutes: 30,
      warningMinutes: 5,
      extendOnActivity: true,
      enableTracking: true,
      warningEnabled: true,
      ...config,
    };

    this.state = this.initializeState();

    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initializeState(): SessionState {
    const now = new Date();
    const storedActivity = localStorage.getItem(this.STORAGE_KEYS.LAST_ACTIVITY);
    const storedSessionId = localStorage.getItem(this.STORAGE_KEYS.SESSION_ID);
    const storedWarningShown = localStorage.getItem(this.STORAGE_KEYS.WARNING_SHOWN) === 'true';

    const lastActivity = storedActivity ? new Date(storedActivity) : now;
    const isExpired =
      now.getTime() - lastActivity.getTime() > this.config.timeoutMinutes * 60 * 1000;

    if (isExpired) {
      this.clearStorage();
      return {
        isActive: false,
        lastActivity: now,
        sessionId: this.generateSessionId(),
        timeRemaining: 0,
        warningShown: false,
      };
    }

    return {
      isActive: true,
      lastActivity,
      sessionId: storedSessionId || this.generateSessionId(),
      timeRemaining: this.calculateTimeRemaining(lastActivity),
      warningShown: storedWarningShown,
    };
  }

  private calculateTimeRemaining(lastActivity: Date): number {
    const now = new Date();
    const elapsed = now.getTime() - lastActivity.getTime();
    return Math.max(0, this.config.timeoutMinutes * 60 * 1000 - elapsed);
  }

  private initialize(): void {
    logger.info('Initializing session manager', {
      timeout: this.config.timeoutMinutes,
      warning: this.config.warningMinutes,
    });

    // Setup activity tracking
    if (this.config.enableTracking) {
      this.setupActivityTracking();
    }

    // Start timeout monitoring
    this.startTimeoutMonitoring();

    // Setup periodic checks
    this.startPeriodicChecks();

    // Save initial state
    this.saveState();

    // Log session start
    this.logSessionEvent('session_started');
  }

  private setupActivityTracking(): void {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'blur',
      'keydown',
      'keyup',
      'wheel',
    ];

    const handleActivity = (event: Event) => {
      if (this.shouldTrackEvent(event)) {
        this.onActivity();
      }
    };

    activityEvents.forEach((eventType) => {
      document.addEventListener(eventType, handleActivity, { capture: true, passive: true });
      this.activityEventListeners.push({
        event: eventType,
        handler: handleActivity,
        target: document,
      });
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.onActivity();
      }
    });

    this.activityEventListeners.push({
      event: 'visibilitychange',
      handler: () => {
        if (!document.hidden) {
          this.onActivity();
        }
      },
      target: document,
    });
  }

  private shouldTrackEvent(event: Event): boolean {
    // Ignore events from certain elements
    const target = event.target as HTMLElement;
    if (!target) {
      return true;
    }

    const ignoredElements = ['script', 'style', 'meta', 'link'];
    const ignoredClasses = ['session-tracking-ignore'];

    return (
      !ignoredElements.includes(target.tagName.toLowerCase()) &&
      !ignoredClasses.some((className) => target.classList.contains(className))
    );
  }

  private onActivity(): void {
    if (!this.state.isActive) {
      return;
    }

    const now = new Date();

    // Only update if significant time has passed (debounce)
    if (now.getTime() - this.state.lastActivity.getTime() > 1000) {
      this.state.lastActivity = now;
      this.state.timeRemaining = this.config.timeoutMinutes * 60 * 1000;
      this.state.warningShown = false;

      // Reset timers
      this.resetTimers();

      // Save state
      this.saveState();

      // Log activity
      this.logSessionEvent('activity_detected');
    }
  }

  private startTimeoutMonitoring(): void {
    this.resetTimers();
  }

  private resetTimers(): void {
    // Clear existing timers
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }
    if (this.expiryTimeout) {
      clearTimeout(this.expiryTimeout);
    }

    const timeToWarning = (this.config.timeoutMinutes - this.config.warningMinutes) * 60 * 1000;
    const timeToExpiry = this.config.timeoutMinutes * 60 * 1000;

    // Set warning timer
    if (this.config.warningEnabled && timeToWarning > 0) {
      this.warningTimeout = setTimeout(() => {
        this.showWarning();
      }, timeToWarning);
    }

    // Set expiry timer
    this.expiryTimeout = setTimeout(() => {
      this.expireSession();
    }, timeToExpiry);
  }

  private startPeriodicChecks(): void {
    // Check every minute
    setInterval(() => {
      this.checkSessionStatus();
    }, 60 * 1000);
  }

  private checkSessionStatus(): void {
    if (!this.state.isActive) {
      return;
    }

    const now = new Date();
    const timeSinceActivity = now.getTime() - this.state.lastActivity.getTime();
    const timeRemaining = this.config.timeoutMinutes * 60 * 1000 - timeSinceActivity;

    this.state.timeRemaining = Math.max(0, timeRemaining);

    if (timeRemaining <= 0) {
      this.expireSession();
    } else if (
      timeRemaining <= this.config.warningMinutes * 60 * 1000 &&
      !this.state.warningShown
    ) {
      this.showWarning();
    }

    this.saveState();
  }

  private showWarning(): void {
    if (!this.config.warningEnabled || this.state.warningShown) {
      return;
    }

    this.state.warningShown = true;
    this.saveState();

    // Create warning modal
    this.createWarningModal();

    // Log warning
    this.logSessionEvent('warning_shown');
  }

  private createWarningModal(): void {
    // Remove existing modal if present
    const existingModal = document.getElementById(this.WARNING_MODAL_ID);
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = this.WARNING_MODAL_ID;
    modal.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';

    // Create modal content using safe DOM methods
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl';

    // Header with icon and title
    const header = document.createElement('div');
    header.className = 'flex items-center mb-4';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'w-6 h-6 text-yellow-500 mr-3');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z');
    icon.appendChild(path);

    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-gray-900';
    title.textContent = 'Sessão Expirando';

    header.appendChild(icon);
    header.appendChild(title);

    // Message
    const message = document.createElement('p');
    message.className = 'text-gray-600 mb-6';
    const messageText = document.createElement('span');
    messageText.textContent = 'Sua sessão expirará em ';
    const strong = document.createElement('strong');
    strong.textContent = this.config.warningMinutes.toString();
    const restText = document.createTextNode(' minutos por inatividade. Deseja continuar?');
    message.appendChild(messageText);
    message.appendChild(strong);
    message.appendChild(restText);

    // Buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex space-x-3';

    const extendBtn = document.createElement('button');
    extendBtn.id = 'session-extend-btn';
    extendBtn.className = 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500';
    extendBtn.textContent = 'Continuar Sessão';

    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'session-logout-btn';
    logoutBtn.className = 'flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500';
    logoutBtn.textContent = 'Sair Agora';

    buttonsContainer.appendChild(extendBtn);
    buttonsContainer.appendChild(logoutBtn);

    // Countdown
    const countdownContainer = document.createElement('div');
    countdownContainer.className = 'mt-4 text-center';

    const countdownText = document.createElement('p');
    countdownText.className = 'text-xs text-gray-500';
    countdownText.textContent = 'Tempo restante: ';

    const countdownSpan = document.createElement('span');
    countdownSpan.id = 'session-countdown';
    countdownSpan.textContent = this.formatTime(this.state.timeRemaining);

    countdownText.appendChild(countdownSpan);
    countdownContainer.appendChild(countdownText);

    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(message);
    modalContent.appendChild(buttonsContainer);
    modalContent.appendChild(countdownContainer);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);

    // Setup event handlers
    const countdown = modal.querySelector('#session-countdown') as HTMLSpanElement;

    extendBtn?.addEventListener('click', () => {
      this.extendSessionPublic();
      modal.remove();
    });

    logoutBtn?.addEventListener('click', () => {
      this.logoutPublic();
      modal.remove();
    });

    // Update countdown
    const countdownInterval = setInterval(() => {
      if (countdown && this.state.timeRemaining > 0) {
        countdown.textContent = this.formatTime(this.state.timeRemaining);
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  private extendSessionPrivate(): void {
    this.onActivity();
    this.logSessionEvent('session_extended');

    // Show success message
    this.showToast('Sessão estendida com sucesso!', 'success');
  }

  private async expireSession(): void {
    if (!this.state.isActive) {
      return;
    }

    this.state.isActive = false;

    // Log expiry
    await this.logSessionEvent('session_expired');

    // Clean up
    this.cleanup();

    // Show expiry message
    this.showToast('Sua sessão expirou por inatividade. Faça login novamente.', 'warning');

    // Redirect to login after a delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  private async logoutPrivate(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await this.logSessionEvent('session_logout');
    } catch (error) {
      logger.error('Error during logout:', error);
    }

    this.cleanup();
    window.location.href = '/login';
  }

  private cleanup(): void {
    // Clear timers
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
    }
    if (this.expiryTimeout) {
      clearTimeout(this.expiryTimeout);
    }

    // Remove event listeners
    this.activityEventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.activityEventListeners = [];

    // Clear storage
    this.clearStorage();

    // Remove modal if present
    const modal = document.getElementById(this.WARNING_MODAL_ID);
    if (modal) {
      modal.remove();
    }
  }

  private saveState(): void {
    localStorage.setItem(this.STORAGE_KEYS.LAST_ACTIVITY, this.state.lastActivity.toISOString());
    localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, this.state.sessionId);
    localStorage.setItem(this.STORAGE_KEYS.WARNING_SHOWN, this.state.warningShown.toString());
  }

  private clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEYS.LAST_ACTIVITY);
    localStorage.removeItem(this.STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(this.STORAGE_KEYS.WARNING_SHOWN);
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  private showToast(message: string, type: 'success' | 'warning' | 'error' = 'info'): void {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-300 translate-x-full`;

    const bgColor =
      type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
    toast.classList.add(bgColor, 'text-white');

    // Clear existing content
    toast.innerHTML = '';

    // Create toast content using safe DOM methods
    const content = document.createElement('div');
    content.className = 'flex items-center';

    const icon = document.createElement('span');
    icon.className = 'mr-2';
    icon.textContent = type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕';

    const text = document.createElement('span');
    text.textContent = message;

    content.appendChild(icon);
    content.appendChild(text);
    toast.appendChild(content);

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
      toast.classList.add('translate-x-0');
    }, 100);

    // Remove after delay
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  private async logSessionEvent(event: string): Promise<void> {
    try {
      // Temporarily commented out to avoid 401 error
      // await supabase.from('audit_logs').insert({
      //   action: event,
      //   details: {
      //     last_activity: this.state.lastActivity.toISOString(),
      //     session_id: this.state.sessionId,
      //     time_remaining: this.state.timeRemaining,
      //     warning_shown: this.state.warningShown,
      //   },
      //   resource_type: 'session',
      //   user_id: (await supabase.auth.getUser()).data.user?.id,
      // });
    } catch (error) {
      logger.error('Error logging session event:', error);
    }
  }

  // Public API methods

  public getState(): SessionState {
    return { ...this.state };
  }

  public isSessionActive(): boolean {
    return this.state.isActive;
  }

  public getTimeRemaining(): number {
    return this.state.timeRemaining;
  }

  public getSessionId(): string {
    return this.state.sessionId;
  }

  public extendSession(): void {
    this.extendSessionPrivate();
  }

  public async logout(): Promise<void> {
    await this.logoutPrivate();
  }

  public extendSessionPublic(): void {
    this.extendSessionPrivate();
  }

  public async logoutPublic(): Promise<void> {
    await this.logoutPrivate();
  }

  public updateConfig(newConfig: Partial<SessionConfig>): void {
    Object.assign(this.config, newConfig);
    this.resetTimers();
    logger.info('Session manager config updated', newConfig);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
