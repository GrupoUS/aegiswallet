// Debug script for STT service
// Note: This script requires proper TypeScript compilation to work
// Run with: bun debug-stt.js or node debug-stt.js after building

console.log('Debug STT service script')
console.log('Note: This script needs proper setup to work with TypeScript modules')
console.log('Consider running the actual tests instead: bun test')

// Mock fetch for Node.js environment
if (typeof global !== 'undefined' && !global.fetch) {
  global.fetch = async (url, options) => {
    console.log('Mock fetch called:', url, options)
    return {
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
    }
  }
}

console.log('Debug script loaded successfully')
