/**
 * AegisWallet Logger
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
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
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private sessionId: string;

  constructor(config?: Partial<LoggerConfig>) {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    this.config = {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: false,
      sanitizeData: false,
      maxEntries: 1000,
      ...config,
    };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    // Filter by configured minimum level when no specific level requested
    return this.logs.filter((log) => log.level >= this.config.level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) {
      return;
    }

    const msg = `[${entry.timestamp}] [${LogLevel[entry.level]}] ${entry.message}`;
    let context = '';

    if (entry.context) {
      try {
        context = JSON.stringify(entry.context);
      } catch {
        // Handle circular references or other JSON.stringify issues
        context = JSON.stringify(entry.context, (_key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (value.constructor && value.constructor.name === 'Object') {
              try {
                JSON.stringify(value);
                return value;
              } catch {
                return '[Circular Reference]';
              }
            }
            return '[Circular Reference]';
          }
          return value;
        });
      }
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        break;
      case LogLevel.INFO:
        // biome-ignore lint/suspicious/noConsole: Logger implementation
        console.info(msg, context);
        break;
      case LogLevel.WARN:
        // biome-ignore lint/suspicious/noConsole: Logger implementation
        console.warn(msg, context);
        break;
      case LogLevel.ERROR:
        // biome-ignore lint/suspicious/noConsole: Logger implementation
        console.error(msg, context);
        break;
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const sanitizedContext = this.config.sanitizeData ? this.sanitizeContext(context) : context;

    const entry: LogEntry = {
      context: sanitizedContext,
      level,
      message,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);
    if (this.logs.length > this.config.maxEntries) {
      this.logs.shift();
    }

    this.logToConsole(entry);
  }

  /**
   * Sanitize sensitive data from context
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return context;

    const sensitiveFields = [
      'password',
      'token',
      'cpf',
      'email',
      'balance',
      'secret',
      'key',
      'creditCard',
      'ssn',
      'accountNumber',
      'routingNumber',
    ];

    const sanitized = { ...context };

    const sanitizeValue = (value: unknown, seen = new WeakSet()): unknown => {
      if (typeof value === 'string') {
        // Check if the value looks like sensitive data
        if (sensitiveFields.some((field) => value.toLowerCase().includes(field))) {
          return '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle circular references
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);

        if (Array.isArray(value)) {
          const result = value.map((item) => sanitizeValue(item, seen));
          seen.delete(value);
          return result;
        }
        const sanitizedObj: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
            sanitizedObj[key] = '[REDACTED]';
          } else {
            sanitizedObj[key] = sanitizeValue(val, seen);
          }
        }
        seen.delete(value);
        return sanitizedObj;
      }
      return value;
    };

    return sanitizeValue(sanitized) as LogContext;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  // Specialized logging methods
  voiceCommand(command: string, confidence: number, context?: LogContext): void {
    this.info('Voice command processed', { ...context, command, confidence });
  }

  voiceError(error: string, context?: LogContext): void {
    this.error('Voice processing error', { ...context, error });
  }

  authEvent(event: string, userId?: string, context?: LogContext): void {
    // Truncate userId for privacy
    const sanitizedUserId = userId ? `${userId.slice(0, 8)}...` : undefined;
    this.info('Authentication event', { ...context, event, userId: sanitizedUserId });
  }

  securityEvent(event: string, context?: LogContext): void {
    this.warn('Security event', { event, ...context });
  }

  userAction(action: string, component: string, context?: LogContext): void {
    this.info('User action', { action, component, ...context });
  }
}

export const logger = new Logger();
export default logger;
