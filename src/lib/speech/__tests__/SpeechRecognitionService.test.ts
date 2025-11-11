/**
 * Speech Recognition Service Tests
 * 
 * Story 1.1: Speech Recognition Service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SpeechRecognitionService, createSpeechRecognitionService } from '../SpeechRecognitionService';

// Mock Web Speech API
const mockSpeechRecognition = vi.fn();

// Mock global Web Speech API
Object.defineProperty(global, 'window', {
  value: {
    SpeechRecognition: mockSpeechRecognition,
    webkitSpeechRecognition: mockSpeechRecognition,
  },
  writable: true,
});

// Mock MediaDevices API
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(),
  },
  writable: true,
});

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;
  let mockInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful media access
    global.navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    // Mock SpeechRecognition
    mockInstance = {
      lang: '',
      maxAlternatives: 3,
      continuous: false,
      interimResults: true,
      grammars: null,
      start: vi.fn(),
      stop: vi.fn(),
      onresult: null,
      onerror: null,
      onend: null,
      onstart: null,
    };

    mockSpeechRecognition.mockReturnValue(mockInstance);
    service = new SpeechRecognitionService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with Brazilian Portuguese configuration', () => {
      const config = service.getConfig();
      expect(config.language).toBe('pt-BR');
      expect(config.confidenceThreshold).toBe(0.85);
      expect(config.maxAlternatives).toBe(3);
      expect(config.continuous).toBe(false);
      expect(config.interimResults).toBe(true);
    });

    it('should detect Web Speech API support', () => {
      expect(service.isWebSpeechSupported()).toBe(true);
    });

    it('should handle unsupported browsers gracefully', () => {
      delete (global as any).window.SpeechRecognition;
      delete (global as any).window.webkitSpeechRecognition;

      const unsupportedService = new SpeechRecognitionService();
      expect(unsupportedService.isWebSpeechSupported()).toBe(false);
    });
  });

  describe('Regional Accent Support', () => {
    it('should support Brazilian Portuguese regional variants', () => {
      service.configureRegionalVariant('pt-BR-SP');
      const config = service.getConfig();
      expect(config.language).toBe('pt-BR');
    });

    it('should add financial grammar without errors', () => {
      expect(() => service.addFinancialGrammar()).not.toThrow();
    });
  });

  describe('Factory Functions', () => {
    it('should create service with factory function', () => {
      const factoryService = createSpeechRecognitionService();
      expect(factoryService).toBeInstanceOf(SpeechRecognitionService);
      expect(factoryService.getConfig().language).toBe('pt-BR');
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      service.updateConfig({
        confidenceThreshold: 0.9,
        maxAlternatives: 5,
      });

      const config = service.getConfig();
      expect(config.confidenceThreshold).toBe(0.9);
      expect(config.maxAlternatives).toBe(5);
    });

    it('should reset performance metrics', () => {
      service.resetMetrics();
      const metrics = service.getPerformanceMetrics();
      expect(metrics.totalRecognitions).toBe(0);
      expect(metrics.successfulRecognitions).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.averageConfidence).toBe(0);
      expect(metrics.fallbackUsage).toBe(0);
    });
  });

  describe('Essential Voice Commands Support', () => {
    it('should have Brazilian Portuguese configuration', () => {
      const config = service.getConfig();
      expect(config.language).toBe('pt-BR');
      expect(config.confidenceThreshold).toBeGreaterThanOrEqual(0.8);
    });

    it('should support regional variants', () => {
      expect(() => service.configureRegionalVariant('pt-BR')).not.toThrow();
      expect(() => service.configureRegionalVariant('pt-BR-SP')).not.toThrow();
    });

    it('should provide performance metrics tracking', () => {
      const metrics = service.getPerformanceMetrics();
      expect(metrics).toHaveProperty('totalRecognitions');
      expect(metrics).toHaveProperty('successfulRecognitions');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('averageConfidence');
    });
  });
});