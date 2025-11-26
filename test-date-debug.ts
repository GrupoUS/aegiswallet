import { createEntityExtractor } from './src/lib/nlu/entityExtractor';

const e = createEntityExtractor();

// Exact test cases from the test file
const tests = [
  'pagar conta amanhã',
  'receber na próxima sexta-feira',
  'projeção para o próximo mês',
  'saldo hoje',
];

for (const t of tests) {
  const r = e.extract(t);
  console.log('\n---');
  console.log('Input:', t);
  console.log('All entities:', r);
  const dateEntities = r.filter(x => x.type === 'date');
  console.log('Date entities:', dateEntities.length > 0 ? dateEntities.map(x => x.value) : 'NO DATE FOUND');
}
