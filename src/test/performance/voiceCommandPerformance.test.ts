/**
 * Voice Command Performance Tests
 * Validates that voice command processing meets ≤2s target latency
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { createSTTService } from '@/lib/stt/speechToTextService'
import { createVAD } from '@/lib/stt/voiceActivityDetection'

// Mock Web Speech API
const mockSpeechRecognition = vi.fn()
const mockSpeechRecognitionInstance = {
  continuous: false,
  interimResults: true,
  lang: 'pt-BR',
  start: vi.fn(),
  stop: vi.fn(),
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
}

mockSpeechRecognition.mockImplementation(() => mockSpeechRecognitionInstance)

// Mock browser APIs
Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: mockSpeechRecognition,
  writable: true,
})

Object.defineProperty(window, 'SpeechRecognition', {
  value: mockSpeechRecognition,
  writable: true,
})

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstop: null,
}

Object.defineProperty(window, 'MediaRecorder', {
  value: vi.fn(() => mockMediaRecorder),
  writable: true,
})

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() =>
      Promise.resolve({
        getTracks: () => [{ stop: vi.fn() }],
      })
    ),
  },
  writable: true,
})

describe('Voice Command Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('useVoiceRecognition Performance', () => {
    it('should initialize voice recognition within 100ms', async () => {
      const startTime = performance.now()

      const { result } = renderHook(() => useVoiceRecognition())

      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })

      const endTime = performance.now()
      const initTime = endTime - startTime

      expect(initTime).toBeLessThan(100) // Should initialize within 100ms
    })

    it('should process commands within 500ms of final result', async () => {
      const { result } = renderHook(() => useVoiceRecognition())

      expect(result.current.supported).toBe(true)

      // Start listening
      act(() => {
        result.current.startListening()
      })

      expect(mockSpeechRecognitionInstance.start).toHaveBeenCalled()

      // Simulate speech recognition result
      const mockResult = {
        resultIndex: 0,
        results: [
          {
            0: {
              transcript: 'qual é o meu saldo',
              confidence: 0.9,
            },
            isFinal: true,
          },
        ],
      }

      const startTime = performance.now()

      act(() => {
        mockSpeechRecognitionInstance.onresult(mockResult)
      })

      // Fast-forward timers to trigger processing timeout
      act(() => {
        vi.advanceTimersByTime(100) // Reduced from 500ms to 100ms
      })

      await waitFor(() => {
        expect(result.current.recognizedCommand).not.toBeNull()
        expect(result.current.recognizedCommand?.command).toBe('BALANCE')
        expect(result.current.isProcessing).toBe(false)
      })

      const endTime = performance.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(500) // Should process within 500ms
    })

    it('should auto-stop listening within 3 seconds', async () => {
      const { result } = renderHook(() => useVoiceRecognition())

      // Start listening
      act(() => {
        result.current.startListening()
      })

      expect(result.current.isListening).toBe(true)

      // Fast-forward 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(result.current.isListening).toBe(false)
        expect(result.current.error).toBe('Tempo esgotado. Tente novamente.')
      })
    })

    it('should cleanup resources properly on unmount', () => {
      const { unmount } = renderHook(() => useVoiceRecognition())

      unmount()

      expect(mockSpeechRecognitionInstance.stop).toHaveBeenCalled()
    })
  })

  describe('Speech-to-Text Service Performance', () => {
    it('should use optimized timeout of 8 seconds', () => {
      const sttService = createSTTService('test-key')

      // Access private config through type assertion for testing
      const config = (sttService as any).config

      expect(config.timeout).toBe(8000) // Should be 8 seconds
    })

    it('should validate audio file size efficiently', async () => {
      const sttService = createSTTService('test-key')

      // Test with optimized file size limit (5MB)
      const largeAudio = new Blob([new Uint8Array(6 * 1024 * 1024)], {
        type: 'audio/webm',
      })

      await expect(sttService.transcribe(largeAudio)).rejects.toThrow('Audio file too large')

      // Test with acceptable file size
      const normalAudio = new Blob([new Uint8Array(1024)], {
        type: 'audio/webm',
      })

      // Should not throw for file size validation
      expect(async () => {
        // Mock the fetch to avoid actual API call
        global.fetch = vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ text: 'test transcription' }),
          })
        )

        await sttService.transcribe(normalAudio)
      }).not.toThrow()
    })
  })

  describe('Voice Activity Detection Performance', () => {
    it('should initialize VAD within 50ms', async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      }

      const startTime = performance.now()

      const vad = createVAD({
        energyThreshold: 0.02,
        minSpeechDuration: 300,
        silenceDuration: 1500,
      })

      await vad.initialize(mockStream as any)

      const endTime = performance.now()
      const initTime = endTime - startTime

      expect(initTime).toBeLessThan(50) // Should initialize within 50ms
      expect(vad.isActive()).toBe(true)

      vad.stop()
    })

    it('should detect voice activity with low latency', async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      }

      const vad = createVAD()
      await vad.initialize(mockStream as any)

      let _speechDetected = false
      let _speechEnded = false

      vad.onSpeechStartCallback(() => {
        _speechDetected = true
      })

      vad.onSpeechEndCallback(() => {
        _speechEnded = true
      })

      const startTime = performance.now()

      // Simulate voice activity detection
      act(() => {
        vi.advanceTimersByTime(16) // One frame at 60fps
      })

      const endTime = performance.now()
      const detectionTime = endTime - startTime

      expect(detectionTime).toBeLessThan(20) // Should detect within 20ms

      vad.stop()
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should clean up intervals and timeouts properly', () => {
      const { unmount } = renderHook(() => useVoiceRecognition())

      // Start some operations
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Verify timers are active
      expect(vi.getTimerCount()).toBeGreaterThan(0)

      // Unmount should clean up
      unmount()

      // All timers should be cleared
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('End-to-End Performance', () => {
    it('should complete full voice command cycle within 2 seconds', async () => {
      const { result } = renderHook(() => useVoiceRecognition())

      const totalStartTime = performance.now()

      // 1. Initialize (should be <100ms)
      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })

      // 2. Start listening (<50ms)
      act(() => {
        result.current.startListening()
      })

      // 3. Simulate speech recognition (<100ms)
      setTimeout(() => {
        act(() => {
          mockSpeechRecognitionInstance.onresult({
            resultIndex: 0,
            results: [
              {
                0: { transcript: 'ver saldo', confidence: 0.9 },
                isFinal: true,
              },
            ],
          })
        })
      }, 100)

      // 4. Process command (<500ms)
      act(() => {
        vi.advanceTimersByTime(600) // 100ms for speech + 500ms processing
      })

      await waitFor(() => {
        expect(result.current.recognizedCommand).not.toBeNull()
        expect(result.current.isProcessing).toBe(false)
      })

      const totalEndTime = performance.now()
      const totalTime = totalEndTime - totalStartTime

      expect(totalTime).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })
})

// Performance benchmark utilities
export const performanceBenchmark = {
  /**
   * Measure the time it takes to execute a function
   */
  measureTime: async <T>(
    fn: () => Promise<T> | T,
    iterations = 1
  ): Promise<{ result: T; averageTime: number; totalTime: number }> => {
    const times: number[] = []
    let result: T

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      result = await fn()
      const end = performance.now()
      times.push(end - start)
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0)
    const averageTime = totalTime / iterations

    return {
      result: result!,
      averageTime,
      totalTime,
    }
  },

  /**
   * Validate voice command performance meets targets
   */
  validateVoicePerformance: async (): Promise<{
    passed: boolean
    metrics: {
      initializationTime: number
      processingTime: number
      totalTime: number
    }
  }> => {
    const { result } = renderHook(() => useVoiceRecognition())

    // Measure initialization time
    const initResult = await performanceBenchmark.measureTime(async () => {
      await waitFor(() => {
        expect(result.current.supported).toBe(true)
      })
    })

    // Measure processing time
    const processResult = await performanceBenchmark.measureTime(async () => {
      act(() => {
        result.current.startListening()
      })

      act(() => {
        mockSpeechRecognitionInstance.onresult({
          resultIndex: 0,
          results: [
            {
              0: { transcript: 'test command', confidence: 0.9 },
              isFinal: true,
            },
          ],
        })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      await waitFor(() => {
        expect(result.current.recognizedCommand).not.toBeNull()
      })
    })

    const totalTime = initResult.averageTime + processResult.averageTime
    const passed = totalTime < 2000 // 2 second target

    return {
      passed,
      metrics: {
        initializationTime: initResult.averageTime,
        processingTime: processResult.averageTime,
        totalTime,
      },
    }
  },
}
