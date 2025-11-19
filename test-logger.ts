#!/usr/bin/env bun

// Test script for logger import and basic usage
import { logger } from './src/lib/logging/logger';

console.log('Testing logger import...');

// Test basic logging
logger.info('Logger test started', { test: true });
logger.debug('Debug message');
logger.warn('Warning message');
logger.error('Error message');

console.log('Logger test completed successfully');