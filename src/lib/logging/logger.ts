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
  [key: string]: any;
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
    this.sessionId = "session_" + Date.now();
    this.config = {
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: false,
      sanitizeData: false,
      maxEntries: 1000,
      ...config,
    };
  }

  getConfig(): LoggerConfig { return { ...this.config }; }
  updateConfig(config: Partial<LoggerConfig>): void { this.config = { ...this.config, ...config }; }
  getLogs(): LogEntry[] { return [...this.logs]; }
  clearLogs(): void { this.logs = []; }
  exportLogs(): string { return JSON.stringify(this.logs, null, 2); }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;
    const msg = entry.message;
    switch (entry.level) {
      case LogLevel.DEBUG: console.debug(msg, entry.context); break;
      case LogLevel.INFO: console.info(msg, entry.context); break;
      case LogLevel.WARN: console.warn(msg, entry.context); break;
      case LogLevel.ERROR: console.error(msg, entry.context); break;
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.config.level) return;
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      sessionId: this.sessionId
    };
    this.logs.push(entry);
    this.logToConsole(entry);
  }

  debug(message: string, context?: LogContext): void { this.log(LogLevel.DEBUG, message, context); }
  info(message: string, context?: LogContext): void { this.log(LogLevel.INFO, message, context); }
  warn(message: string, context?: LogContext): void { this.log(LogLevel.WARN, message, context); }
  error(message: string, context?: LogContext): void { this.log(LogLevel.ERROR, message, context); }

  voiceCommand(command: string, confidence: number, context?: LogContext): void {
    this.info("Voice command processed", { ...context, command, confidence });
  }
  voiceError(error: string, context?: LogContext): void {
    this.error("Voice processing error", { ...context, error });
  }
  authEvent(event: string, userId?: string, context?: LogContext): void {
    this.info("Authentication event", { ...context, event, userId });
  }
  securityEvent(event: string, context?: LogContext): void {
    this.warn("Security event", { event, ...context });
  }
  userAction(action: string, component: string, context?: LogContext): void {
    this.info("User action", { action, component, ...context });
  }
}

export const logger = new Logger();
export default logger;
