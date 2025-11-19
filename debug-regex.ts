
import { IntentType } from './src/lib/nlu/types';

const patterns = [
  /\b(quanto|qual)\s+(posso|consigo|dá|da|pode)\s+(gastar|usar|pegar)\b/i
];

const text = 'quanto posso gastar?';
console.log(`Testing '${text}' against patterns:`);
patterns.forEach(p => {
  console.log(`${p}: ${p.test(text)}`);
});

const balancePattern = /\bqual\s+é\s+(meu|o)?\s*saldo\?*$/i;
const balanceText = 'qual é meu saldo?';
console.log(`${balancePattern}: ${balancePattern.test(balanceText)}`);

const balanceText2 = 'qual e meu saldo?';
console.log(`${balancePattern} (normalized input): ${balancePattern.test(balanceText2)}`);

