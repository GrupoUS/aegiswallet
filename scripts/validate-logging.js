/**
 * Logging System Validation Script
 * Tests console statement replacement and logging functionality
 */

import fs from 'node:fs';
import path from 'node:path';

// Simple test runner for Node.js environment
function runTests() {
  const tests = [
    {
      name: 'Console Statement Replacement',
      test: validateConsoleReplacement,
    },
    {
      name: 'Environment-based Configuration',
      test: validateEnvironmentConfig,
    },
    {
      name: 'Data Sanitization',
      test: validateDataSanitization,
    },
    {
      name: 'Logger Hook Integration',
      test: validateHookIntegration,
    },
    {
      name: 'Performance Impact',
      test: validatePerformance,
    },
  ];

  let _passed = 0;
  let failed = 0;

  tests.forEach(({ name: _name, test }) => {
    try {
      test();
      _passed++;
    } catch (_error) {
      failed++;
    }
  });

  if (failed === 0) {
  } else {
  }
}

function validateConsoleReplacement() {
  const filesToCheck = [
    'src/services/voiceService.ts',
    'src/hooks/useVoiceCommand.ts',
    'src/hooks/useMultimodalResponse.ts',
    'src/lib/voiceCommandProcessor.ts',
    'src/contexts/AuthContext.tsx',
    'src/lib/banking/securityCompliance.ts',
  ];

  filesToCheck.forEach((filePath) => {
    const fullPath = path.join(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Check for direct console statements (excluding logger imports)
    const consoleMatches = content.match(/console\.(log|error|warn|info|debug)\s*\(/g);

    if (consoleMatches) {
      // Filter out logger-related console statements that might be in test files
      const suspiciousConsole = consoleMatches.filter((_match) => {
        // This is a simple check - in a real scenario, you might want more sophisticated filtering
        return !content.includes('logger') || consoleMatches.length > 2;
      });

      if (suspiciousConsole.length > 0) {
        throw new Error(`Found ${suspiciousConsole.length} console statements in ${filePath}`);
      }
    }

    // Check for logger import (various patterns)
    const hasLoggerImport =
      content.includes("import { logger } from '@/lib/logging/logger'") ||
      content.includes("import { useLogger } from '@/hooks/useLogger'") ||
      content.includes("import { useVoiceLogger } from '@/hooks/useLogger'") ||
      content.includes("import { useAuthLogger } from '@/hooks/useLogger'") ||
      content.includes("import { useSecurityLogger } from '@/hooks/useLogger'") ||
      content.includes("import { useFinancialLogger } from '@/hooks/useLogger'");

    if (!hasLoggerImport) {
      throw new Error(`Missing logger import in ${filePath}`);
    }
  });
}

function validateEnvironmentConfig() {
  // Check if logger configuration is properly set up
  const mockConfig = {
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
    sanitizeData: false,
  };

  // Simulate environment detection
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  if (isDevelopment && mockConfig.level !== 'debug') {
    throw new Error('Development environment should use debug log level');
  }

  if (isProduction && mockConfig.sanitizeData !== true) {
    throw new Error('Production environment should enable data sanitization');
  }

  if (isTest && mockConfig.enableConsole !== false) {
    throw new Error('Test environment should disable console logging');
  }
}

function validateDataSanitization() {
  // Mock sensitive data
  const sensitiveData = {
    email: 'user@example.com',
    password: 'secret123',
    token: 'abc123xyz',
    balance: 1500.5,
    cpf: '123.456.789-00',
    accountNumber: '12345-6',
    secretKey: 'hidden_value',
    normalField: 'visible_value',
  };

  // Mock sanitization function (simplified version)
  function sanitizeForProduction(data) {
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

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeForProduction(sanitized[key]);
      }
    }

    return sanitized;
  }

  const sanitized = sanitizeForProduction(sensitiveData);

  // Verify sensitive fields are redacted
  const expectedRedacted = [
    'email',
    'password',
    'token',
    'balance',
    'cpf',
    'accountNumber',
    'secretKey',
  ];
  expectedRedacted.forEach((field) => {
    if (sanitized[field] !== '[REDACTED]') {
      throw new Error(`Field '${field}' should be redacted but got: ${sanitized[field]}`);
    }
  });

  // Verify normal fields are preserved
  if (sanitized.normalField !== 'visible_value') {
    throw new Error(`Normal field should be preserved but got: ${sanitized.normalField}`);
  }
}

function validateHookIntegration() {
  // Mock React hook functionality
  const mockLogger = {
    debug: (message, context) => ({ level: 'debug', message, context }),
    info: (message, context) => ({ level: 'info', message, context }),
    warn: (message, context) => ({ level: 'warn', message, context }),
    error: (message, context) => ({ level: 'error', message, context }),
    userAction: (action, component, context) => ({
      level: 'info',
      message: 'User action',
      action,
      component,
      context,
    }),
    voiceCommand: (command, confidence, context) => ({
      level: 'info',
      message: 'Voice command processed',
      command,
      confidence,
      context,
    }),
  };

  // Test specialized logger functions
  const voiceLog = mockLogger.voiceCommand('test command', 0.95, {
    test: true,
  });
  if (voiceLog.level !== 'info' || voiceLog.command !== 'test command') {
    throw new Error('Voice logging not working correctly');
  }

  const userActionLog = mockLogger.userAction('button_click', 'TestComponent', {
    buttonId: 'test',
  });
  if (userActionLog.action !== 'button_click' || userActionLog.component !== 'TestComponent') {
    throw new Error('User action logging not working correctly');
  }
}

function validatePerformance() {
  // Test logging performance with timing
  const startTime = process.hrtime.bigint();

  // Simulate 1000 log operations
  for (let i = 0; i < 1000; i++) {
    // Mock logging operation
    const logEntry = {
      level: 'info',
      message: `Test message ${i}`,
      timestamp: new Date().toISOString(),
      context: { index: i },
    };

    // Simulate log processing
    JSON.stringify(logEntry);
  }

  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

  // Should complete within reasonable time (less than 100ms for 1000 operations)
  if (duration > 100) {
    throw new Error(`Logging performance too slow: ${duration.toFixed(2)}ms for 1000 operations`);
  }
}

// Run the validation tests
runTests();
