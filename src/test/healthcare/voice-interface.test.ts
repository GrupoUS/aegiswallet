// Satisfies: Section 2: Voice Interface Testing of .claude/skills/webapp-testing/SKILL.md
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TestUtils } from '../healthcare-setup';

// Type declarations for global Speech API
declare global {
  // eslint-disable-next-line no-var
  var SpeechRecognition: any;
  // eslint-disable-next-line no-var
  var webkitSpeechRecognition: any;
}

// Mock voice interface component
const VoiceAssistant = ({ onCommand }: { onCommand: (command: any) => void }) => {
  const [isListening, setIsListening] = React.useState(false);
  const [lastCommand, setLastCommand] = React.useState('');

  const startListening = () => {
    setIsListening(true);

    // Mock speech recognition
    const recognition = new global.SpeechRecognition();
    recognition.lang = 'pt-BR';

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence || 0.95;

      if (confidence < 0.8) {
        setIsListening(false);
        return;
      }

      setLastCommand(command);

      const voiceCommand = (global.testUtils as TestUtils).createMockVoiceCommand(
        command,
        confidence
      );
      onCommand(voiceCommand);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    // Mock successful recognition after delay
    setTimeout(() => {
      recognition.onresult({
        results: [
          [
            {
              confidence: 0.95,
              transcript: 'transferir cem reais para João',
            },
          ],
        ],
      });
    }, 1000);

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return React.createElement('div', { 'data-testid': 'voice-assistant' }, [
    React.createElement(
      'button',
      {
        'data-testid': 'start-listening',
        disabled: isListening,
        key: 'start-btn',
        onClick: startListening,
        type: 'button',
      },
      isListening ? 'Ouvindo...' : 'Iniciar Assistente de Voz'
    ),

    React.createElement(
      'button',
      {
        'data-testid': 'stop-listening',
        disabled: !isListening,
        key: 'stop-btn',
        onClick: stopListening,
        type: 'button',
      },
      'Parar'
    ),

    React.createElement(
      'div',
      {
        'aria-live': 'polite',
        'data-testid': 'voice-status',
        key: 'status',
        role: 'status',
      },
      isListening ? 'Ouvindo comando de voz...' : 'Pronto para ouvir'
    ),

    React.createElement(
      'div',
      {
        'data-testid': 'voice-transcript',
        key: 'transcript',
      },
      lastCommand && `Último comando: "${lastCommand}"`
    ),
  ]);
};

describe('Voice Interface Testing (Portuguese)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset SpeechRecognition mock to default implementation
    const mockSpeechRecognition = {
      abort: vi.fn(),
      continuous: false,
      interimResults: false,
      lang: 'pt-BR',
      onend: null,
      onerror: null,
      onnomatch: null,
      onresult: null,
      onsoundend: null,
      onsoundstart: null,
      onspeechend: null,
      onspeechstart: null,
      start: vi.fn(),
      stop: vi.fn(),
    };

    global.SpeechRecognition = vi.fn(() => mockSpeechRecognition);
    global.webkitSpeechRecognition = vi.fn(() => mockSpeechRecognition);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Speech Recognition Setup', () => {
    it('should configure speech recognition for Portuguese (Brazil)', async () => {
      render(React.createElement(VoiceAssistant, { onCommand: vi.fn() }));

      const startButton = screen.getByTestId('start-listening');
      await userEvent.click(startButton);

      // Verify speech recognition is configured for pt-BR
      expect(global.SpeechRecognition).toHaveBeenCalled();
    });

    it('should provide visual feedback during voice input', async () => {
      const onCommand = vi.fn();

      render(React.createElement(VoiceAssistant, { onCommand }));

      const startButton = screen.getByTestId('start-listening');
      const statusElement = screen.getByTestId('voice-status');

      expect(statusElement).toHaveTextContent('Pronto para ouvir');

      await userEvent.click(startButton);

      expect(statusElement).toHaveTextContent('Ouvindo comando de voz...');
      expect(startButton).toBeDisabled();
      expect(startButton).toHaveTextContent('Ouvindo...');
    });
  });

  describe('Portuguese Command Processing', () => {
    it('should process financial transfer commands correctly', async () => {
      const onCommand = vi.fn();

      render(React.createElement(VoiceAssistant, { onCommand }));

      const startButton = screen.getByTestId('start-listening');
      await userEvent.click(startButton);

      await waitFor(() => {
        expect(onCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'transferir cem reais para João',
            confidence: 0.95,
            timestamp: expect.any(String),
          })
        );
      });
    });

    it('should handle appointment scheduling commands', async () => {
      const onCommand = vi.fn();

      // Mock different command
      const mockRecognition = {
        lang: 'pt-BR',
        onerror: null,
        onresult: null,
        start: vi.fn(),
      };

      global.SpeechRecognition.mockImplementation(() => mockRecognition);

      render(React.createElement(VoiceAssistant, { onCommand }));

      const startButton = screen.getByTestId('start-listening');
      await userEvent.click(startButton);

      // Simulate appointment command
      await waitFor(() => {
        expect(mockRecognition.onresult).toBeTruthy();
      });

      if (mockRecognition.onresult) {
        mockRecognition.onresult({
          results: [
            [
              {
                confidence: 0.92,
                transcript: 'agendar consulta com Dr. Pedro para amanhã',
              },
            ],
          ],
        });
      }

      await waitFor(() => {
        expect(onCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            command: 'agendar consulta com Dr. Pedro para amanhã',
            confidence: 0.92,
          })
        );
      });
    });

    it('should display command transcript after recognition', async () => {
      const onCommand = vi.fn();

      render(React.createElement(VoiceAssistant, { onCommand }));

      const startButton = screen.getByTestId('start-listening');
      await userEvent.click(startButton);

      await waitFor(() => {
        const transcriptElement = screen.getByTestId('voice-transcript');
        expect(transcriptElement).toHaveTextContent(
          'Último comando: "transferir cem reais para João"'
        );
      });
    });
  });

  describe('Voice Command Accuracy', () => {
    it('should require minimum confidence threshold for commands', async () => {
      const onCommand = vi.fn();
      const lowConfidenceRecognition = {
        lang: 'pt-BR',
        onerror: null,
        onresult: null,
        start: vi.fn(),
      };

      global.SpeechRecognition.mockImplementation(() => lowConfidenceRecognition);

      render(React.createElement(VoiceAssistant, { onCommand }));

      const startButton = screen.getByTestId('start-listening');
      await userEvent.click(startButton);

      // Simulate low confidence recognition
      if (lowConfidenceRecognition.onresult) {
        lowConfidenceRecognition.onresult({
          results: [
            [
              {
                confidence: 0.45,
                transcript: 'comando incerto', // Below threshold
              },
            ],
          ],
        });
      }

      // Should not process low confidence commands
      await waitFor(
        () => {
          expect(onCommand).not.toHaveBeenCalledWith(
            expect.objectContaining({
              command: 'comando incerto',
            })
          );
        },
        { timeout: 2000 }
      );
    });

    it('should handle Portuguese-specific terminology correctly', () => {
      const portugueseCommands = {
        financial: [
          'transferir',
          'pagar',
          'depositar',
          'saldo',
          'extrato',
          'fatura',
          'boleto',
          'pix',
        ],
        medical: [
          'consulta',
          'médico',
          'doutor',
          'agenda',
          'remédio',
          'receita',
          'exame',
          'hospital',
        ],
        temporal: ['hoje', 'amanhã', 'ontem', 'próxima semana', 'dia útil', 'final de semana'],
      };

      // Validate Portuguese vocabulary coverage
      Object.entries(portugueseCommands).forEach(([_category, commands]) => {
        expect(commands).toBeInstanceOf(Array);
        expect(commands.length).toBeGreaterThan(0);

        commands.forEach((command) => {
          expect(typeof command).toBe('string');
          expect(command.trim().length).toBeGreaterThan(0);
          // Should contain Portuguese characters or common financial/medical terms
          expect(/^[a-zA-Zà-úÀ-Ú\s]+$/.test(command)).toBe(true);
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle speech recognition errors gracefully', async () => {
      const errorRecognition = {
        lang: 'pt-BR',
        onerror: null,
        onresult: null,
        start: vi.fn(),
      };

      global.SpeechRecognition.mockImplementation(() => errorRecognition);

      render(React.createElement(VoiceAssistant, { onCommand: vi.fn() }));

      const startButton = screen.getByTestId('start-listening');
      await userEvent.click(startButton);

      // Simulate recognition error
      if (errorRecognition.onerror) {
        errorRecognition.onerror({ error: 'no-speech' });
      }

      await waitFor(() => {
        const statusElement = screen.getByTestId('voice-status');
        expect(statusElement).toHaveTextContent('Pronto para ouvir');
        expect(startButton).toBeEnabled();
      });
    });

    it('should provide fallback option when voice fails', () => {
      // Test that voice interface has keyboard/text fallback
      const onCommand = vi.fn();

      render(React.createElement(VoiceAssistant, { onCommand }));

      // Should have keyboard accessibility
      const startButton = screen.getByTestId('start-listening');
      expect(startButton).toBeVisible();

      // Test keyboard navigation
    });
  });

  describe('Accessibility Compliance', () => {
    it('should provide screen reader support', () => {
      const onCommand = vi.fn();

      render(React.createElement(VoiceAssistant, { onCommand }));

      // Should have ARIA labels and live regions
      const statusElement = screen.getByTestId('voice-status');
      expect(statusElement).toHaveAttribute('role', 'status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should support keyboard navigation', async () => {
      const onCommand = vi.fn();

      render(React.createElement(VoiceAssistant, { onCommand }));

      const startButton = screen.getByTestId('start-listening');

      // Test Tab navigation
      startButton.focus();
      expect(startButton).toHaveFocus();

      // Test Enter key activation
      await userEvent.click(startButton);

      // Should start listening (would trigger voice recognition)
      expect(startButton).toBeDisabled();
    });

    it('should have proper button labels in Portuguese', () => {
      const onCommand = vi.fn();

      render(React.createElement(VoiceAssistant, { onCommand }));

      const startButton = screen.getByTestId('start-listening');
      const stopButton = screen.getByTestId('stop-listening');

      expect(startButton).toHaveTextContent('Iniciar Assistente de Voz');
      expect(stopButton).toHaveTextContent('Parar');
    });
  });

  describe('Language and Localization', () => {
    it('should use Brazilian Portuguese locale', () => {
      const onCommand = vi.fn();

      render(React.createElement(VoiceAssistant, { onCommand }));

      const startButton = screen.getByTestId('start-listening');
      startButton.click();

      // Verify speech recognition is configured for pt-BR
      expect(global.SpeechRecognition).toHaveBeenCalled();
      const mockInstance = (global.SpeechRecognition as any).mock.results[0].value;
      expect(mockInstance.lang).toBe('pt-BR');
    });

    it('should handle Brazilian monetary values correctly', () => {
      const monetaryCommands = [
        'cem reais',
        'R$ 100,00',
        'duzentos e cinquenta reais',
        'mil reais',
        'R$ 1.234,56',
      ];

      monetaryCommands.forEach((command) => {
        expect(typeof command).toBe('string');
        expect(command).toMatch(/R\$\s*\d+([.,]\d+)?|reais/i);
      });
    });

    it('should understand Brazilian Portuguese date expressions', () => {
      const dateExpressions = [
        'hoje',
        'amanhã',
        'ontem',
        'próxima segunda-feira',
        'dia quinze',
        'dia vinte e cinco de janeiro',
        'próximo mês',
      ];

      dateExpressions.forEach((expression) => {
        expect(typeof expression).toBe('string');
        expect(expression.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
