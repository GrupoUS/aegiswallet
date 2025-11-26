// Test script to debug Gemini API connection
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VITE_GEMINI_API_KEY || '';

console.log('🔑 API Key configured:', API_KEY ? `Yes (${API_KEY.substring(0, 10)}...)` : 'No');

if (!API_KEY) {
  console.error('❌ VITE_GEMINI_API_KEY not found in environment');
  process.exit(1);
}

const models = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3-pro-preview'];

async function testModel(modelName: string) {
  console.log(`\n🧪 Testing model: ${modelName}`);

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(`   ⏳ Generating response...`);
    const result = await model.generateContent('Hello, respond with just "OK"');
    const response = await result.response;
    const text = response.text();

    console.log(`   ✅ SUCCESS - Response: "${text}"`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ FAILED - Error:`, error.message || error);
    if (error.status) {
      console.error(`   📊 Status:`, error.status);
    }
    if (error.statusText) {
      console.error(`   📝 Status Text:`, error.statusText);
    }
    return false;
  }
}

async function testAll() {
  console.log('🚀 Starting Gemini API Test Suite\n');
  console.log('='.repeat(60));

  const results: Record<string, boolean> = {};

  for (const modelName of models) {
    results[modelName] = await testModel(modelName);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Test Results Summary:\n');

  for (const [model, success] of Object.entries(results)) {
    console.log(`${success ? '✅' : '❌'} ${model}`);
  }

  const workingModels = Object.entries(results).filter(([_, success]) => success);
  if (workingModels.length > 0) {
    console.log(`\n✨ Working models: ${workingModels.map(([name]) => name).join(', ')}`);
    console.log(`\n💡 Recommended: Use "${workingModels[0][0]}" as default model`);
  } else {
    console.log('\n❌ No working models found. Check your API key and billing status.');
  }
}

testAll().catch(console.error);
