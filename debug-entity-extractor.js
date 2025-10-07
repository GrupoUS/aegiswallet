// Debug script for entity extractor
import { createEntityExtractor } from './src/lib/nlu/entityExtractor.ts';

// Test date extraction
const extractor = createEntityExtractor();

console.log('Testing date extraction:');
const dateTests = ['transferir amanhã', 'pagar hoje'];
dateTests.forEach(text => {
  const entities = extractor.extract(text);
  const dateEntity = entities.find(e => e.type === 'DATE');
  console.log(`"${text}" -> date entity:`, dateEntity);
});

console.log('\nTesting category extraction:');
const categoryTests = ['boleto da água', 'pagar conta de energia'];
categoryTests.forEach(text => {
  const entities = extractor.extract(text);
  const categoryEntity = entities.find(e => e.type === 'BILL_TYPE' || e.type === 'CATEGORY');
  console.log(`"${text}" -> category entity:`, categoryEntity);
});
