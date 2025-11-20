
import { buildMultimodalResponse } from './src/lib/multimodal/responseTemplates';
import { IntentType } from './src/lib/nlu/types';

console.log('Testing buildMultimodalResponse...');

const intents = [
  {
    intent: IntentType.CHECK_BALANCE,
    data: { balance: 1000, accountType: 'corrente' },
    expectedType: 'balance'
  },
  {
    intent: IntentType.CHECK_BUDGET,
    data: { available: 500, total: 1000, spent: 500 },
    expectedType: 'budget'
  },
  {
    intent: IntentType.PAY_BILL,
    data: { billName: 'Test', amount: 100, dueDate: new Date().toISOString() },
    expectedType: 'bills'
  },
  {
    intent: IntentType.CHECK_INCOME,
    data: { totalExpected: 5000, incoming: [] },
    expectedType: 'incoming'
  },
  {
    intent: IntentType.FINANCIAL_PROJECTION,
    data: { projectedBalance: 1000, variation: 100, period: 'mês' },
    expectedType: 'projection'
  },
  {
    intent: IntentType.TRANSFER_MONEY,
    data: { recipient: 'João', amount: 100, method: 'PIX', status: 'pending' },
    expectedType: 'transfer'
  },
];

for (const { intent, data, expectedType } of intents) {
  console.log(`\nTesting intent: ${intent}`);
  try {
    const response = buildMultimodalResponse(intent, data);
    console.log(`Result type: ${response.visual.type}`);

    if (response.visual.type !== expectedType) {
      console.error(`FAIL: Expected ${expectedType}, got ${response.visual.type}`);
      console.log('Response:', JSON.stringify(response, null, 2));
    } else {
      console.log('PASS');
    }
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    console.error(e);
  }
}
