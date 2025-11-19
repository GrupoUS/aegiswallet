export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  timestamp?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  command?: string;
  confidence?: number;
  processingTime?: number;
  language?: string;
  event?: string;
  method?: string;
  attempts?: number;
  buttonId?: string;
  error?: string;
  stack?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  sessionId: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  sanitizeData: boolean;
  maxEntries: number;
}

export class Logger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig;
  private circularRefs = new WeakSet();

  constructor() {
    this.config = {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: false,
      sanitizeData: false,
      maxEntries: 1000,
    };
  }

  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
  }

  private sanitizeData(data: any): any {
    if (!this.config.sanitizeData) return data;

    if (typeof data !== 'object' || data === null) return data;

    if (this.circularRefs.has(data)) {
      return '[CIRCULAR REFERENCE]';
    }

    this.circularRefs.add(data);

    const sanitized: Record<string, any> = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    this.circularRefs.delete(data);
    return sanitized;
  }

  private isSensitiveField(key: string): boolean {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'cpf', 'email', 'balance',
      'credit_card', 'ssn', 'phone', 'address', 'birth_date'
    ];
    return sensitiveFields.some(field => key.toLowerCase().includes(field));
  }

  private truncateUserId(userId: string): string {
    if (!userId) return '';
    return userId.length > 12 ? `${userId.substring(0, 12)}...` : userId;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level && this.config.level !== LogLevel.SILENT;
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const sessionId = context?.sessionId || this.generateSessionId();
    const sanitizedContext = context ? this.sanitizeData(context) : undefined;

    return {
      level,
      message,
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
      sessionId,
    };
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);

    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableRemote) {
      this.logToRemote(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level].toLowerCase();
    const message = `[${entry.timestamp}] ${levelName.toUpperCase()}: ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        break;
      case LogLevel.INFO:
      case LogLevel.WARN:
        console.warn(mess
        console.error(message, entry.context);
        break;

  private logToRemote(entry: LogEntry): void 

  debug(message: strin_entryntext?: LogContext): void 
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      this.addLog(entry);
    }

  info(message: string, context?: LogContext): void 
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      this.addLog(entry);
    }

  warn(message: string, context?: LogContext): void 
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context);
      this.addLog(entry);
    }

  error(message: string, context?: LogContext): void 
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context);
      this.addLog(entry);
    }

  voiceCommand(command: string, confidence: number, context?: Omit<LogContext, 'command' | 'confidence'>): void {
    const fullContext: LogContext = {
      ...context,
      command,
      confidence,
    };
    this.info('Voice command processed', fullContext);
  }

  authEvent(event: string, userId?: string, context?: Omit<LogContext, 'event' | 'userId'>): void {
    const fullContext: LogContext = {
      ...context,
      event,
      userId: userId ? this.truncateUserId(userId) : undefined,
    };
    this.info('Authentication event', fullContext);
  }

  securityEvent(event: string, context?: Omit<LogContext, 'event'>): void {
    const fullContext: LogContext = {
      ...context,
      event,
    };
    this.warn('Security event', fullContext);
  }

  userAction(action: string, component: string, context?: Omit<LogContext, 'action' | 'component'>): void {
    const fullContext: LogContext = {
      ...context,
      action,
      component,
    };
    this.info('User action', fullContext);
  }

  voiceError(error: string, context?: Omit<LogContext, 'error'>): void {
    const fullContext: LogContext = {
      ...context,
      error,
    };
    this.error('Voice processing error', fullContext);
  }
}
