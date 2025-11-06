// Debug script for STT service
const { SpeechToTextService } = require('./src/lib/stt/speechToTextService.ts')

// Mock fetch
global.fetch = jest.fn()

async function debugSTT() {
  const sttService = new SpeechToTextService({
    apiKey: 'test-api-key-12345',
    language: 'pt',
    timeout: 5000,
  })

  // Mock successful response
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      text: 'Olá, como vai?',
      language: 'pt',
      duration: 2.5,
      segments: [
        {
          avg_logprob: -0.2,
        },
      ],
    }),
  })

  const audioBlob = new Blob([new Uint8Array(1024)], { type: 'audio/webm' })

  try {
    const result = await sttService.transcribe(audioBlob)
    console.log('Result:', result)
  } catch (error) {
    console.log('Error:', error)
  }
}

debugSTT()
