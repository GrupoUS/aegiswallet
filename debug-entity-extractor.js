// Debug script for entity extractor
// Note: This script requires TypeScript compilation to work properly
// Consider running tests instead: bun test

console.log('Entity extractor debug script')
console.log('Note: This script needs proper setup to work with TypeScript modules')
console.log('Consider running the actual tests instead: bun test')

// Mock functionality for basic testing
const mockExtractor = {
  extract: (text) => {
    console.log(`Mock extracting entities from: "${text}"`)
    return [
      { type: 'DATE', value: 'tomorrow', confidence: 0.9 },
      { type: 'BILL_TYPE', value: 'water', confidence: 0.8 }
    ]
  }
}

console.log('Testing date extraction (mock):')
const dateTests = ['transferir amanhã', 'pagar hoje']
dateTests.forEach((text) => {
  const entities = mockExtractor.extract(text)
  const dateEntity = entities.find((e) => e.type === 'DATE')
  console.log(`"${text}" -> date entity:`, dateEntity)
})

console.log('\nTesting category extraction (mock):')
const categoryTests = ['boleto da água', 'pagar conta de energia']
categoryTests.forEach((text) => {
  const entities = mockExtractor.extract(text)
  const categoryEntity = entities.find((e) => e.type === 'BILL_TYPE' || e.type === 'CATEGORY')
  console.log(`"${text}" -> category entity:`, categoryEntity)
})

console.log('\nDebug script completed')
