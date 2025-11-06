/**
 * AegisWallet Logger - Environment-based logging system
 * Provides secure, production-ready logging with development debugging capabilities
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  sanitizeData: boolean;
  maxEntries: number;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.config = this.getDefaultConfig();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultConfig(): LoggerConfig {
    // Environment detection using process.env (Node.js/Bun compatible)
    const nodeEnv = typeof process !== 'undefined' ? process.env?.NODE_ENV : undefined;
    const isDevelopment = nodeEnv === 'development';
    const isTest = nodeEnv === 'test';

    return {
      level: isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR,
      enableConsole: isDevelopment && !isTest,
      enableRemote: !isDevelopment,
      sanitizeData: !isDevelopment,
      maxEntries: isDevelopment ? 1000 : 100,
      remoteEndpoint:
        typeof process !== 'undefined' ? process.env?.VITE_LOGGING_ENDPOINT || '' : '',
    };
  }

  private sanitizeForProduction(data: any): any {
    if (!this.config.sanitizeData) return data;

    if (typeof data !== 'object' || data === null) return data;

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'session',
      'user',
      'email',
      'phone',
      'cpf',
      'account',
      'balance',
    ];

    const sanitized = { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForProduction(sanitized[key]);
      }
    }

    return sanitized;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeForProduction(context) : undefined,
      sessionId: this.sessionId,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private addToMemory(entry: LogEntry): void {
    this.logs.push(entry);

    // Keep only the most recent entries
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (_error) {}
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);
    this.addToMemory(entry);

    // Console logging in development
    if (this.config.enableConsole) {
      const consoleMethod = this.getConsoleMethod(level);
      const logMessage = this.formatConsoleMessage(entry);
      consoleMethod(logMessage, entry.context || '');
    }

    // Remote logging in production
    if (this.config.enableRemote) {
      this.sendToRemote(entry);
    }
  }

  private getConsoleMethod(level: LogLevel): Console['log' | 'info' | 'warn' | 'error'] {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const levelName = LogLevel[entry.level];
    const component = entry.component ? `[${entry.component}]` : '';
    const action = entry.action ? `(${entry.action})` : '';

    return `${time} ${levelName} ${component} ${entry.message} ${action}`.trim();
  }

  // Public API methods
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  // Voice-specific logging
  voiceCommand(command: string, confidence: number, context?: Record<string, any>): void {
    this.info('Voice command processed', {
      command: command.substring(0, 50), // Limit command length for privacy
      confidence,
      ...context,
    });
  }

  voiceError(error: string, context?: Record<string, any>): void {
    this.error('Voice processing error', { error, ...context });
  }

  // Authentication logging (without sensitive data)
  authEvent(event: string, userId?: string, context?: Record<string, any>): void {
    this.info('Authentication event', {
      event,
      userId: userId ? `${userId.substring(0, 8)}...` : undefined,
      ...context,
    });
  }

  // Security events
  securityEvent(event: string, context?: Record<string, any>): void {
    this.warn('Security event', { event, ...context });
  }

  // User action tracking
  userAction(action: string, component: string, context?: Record<string, any>): void {
    this.info('User action', {
      action,
      component,
      ...context,
    });
  }

  // Configuration methods
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Memory methods for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter((log) => log.level >= level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const logger = new Logger();

// Export Logger class for testing
export { Logger };

// Export types and create logger instance
export default logger;
