/**
 * Development Debug Utility
 * Provides conditional logging that works in development but is removed in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface DebugContext {
  component?: string;
  action?: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, context?: DebugContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context
      ? `[${context.component}${context.action ? `::${context.action}` : ''}]`
      : '';
    return `${timestamp} ${level.toUpperCase()}${contextStr}: ${message}`;
  }

  private log(level: LogLevel, message: string, _data?: any, context?: DebugContext): void {
    if (!this.isDevelopment) return;

    const _formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        break;
      case 'info':
        break;
      case 'warn':
        break;
      case 'error':
        break;
    }
  }

  debug(message: string, data?: any, context?: DebugContext): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: DebugContext): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: DebugContext): void {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: Error | any, context?: DebugContext): void {
    this.log('error', message, error, context);
  }

  // Component-specific logging helpers
  component(componentName: string) {
    return {
      debug: (message: string, data?: any) =>
        this.debug(message, data, { component: componentName }),
      info: (message: string, data?: any) => this.info(message, data, { component: componentName }),
      warn: (message: string, data?: any) => this.warn(message, data, { component: componentName }),
      error: (message: string, error?: Error | any) =>
        this.error(message, error, { component: componentName }),
      action: (actionName: string) => ({
        debug: (message: string, data?: any) =>
          this.debug(message, data, {
            component: componentName,
            action: actionName,
          }),
        info: (message: string, data?: any) =>
          this.info(message, data, {
            component: componentName,
            action: actionName,
          }),
        warn: (message: string, data?: any) =>
          this.warn(message, data, {
            component: componentName,
            action: actionName,
          }),
        error: (message: string, error?: Error | any) =>
          this.error(message, error, {
            component: componentName,
            action: actionName,
          }),
      }),
    };
  }

  // Performance logging
  time(_label: string): void {
    if (this.isDevelopment) {
    }
  }

  timeEnd(_label: string): void {
    if (this.isDevelopment) {
    }
  }

  // Group logging
  group(_label: string): void {
    if (this.isDevelopment) {
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions for common patterns
export const createComponentLogger = (componentName: string) => logger.component(componentName);

// Development-only assertions
export const assert = (condition: boolean, message: string): void => {
  if (import.meta.env.DEV && !condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

// Development-only warnings
export const warnOnce = (message: string): void => {
  if (import.meta.env.DEV && !warnOnce.warnedMessages.has(message)) {
    logger.warn(message);
    warnOnce.warnedMessages.add(message);
  }
};

warnOnce.warnedMessages = new Set<string>();
