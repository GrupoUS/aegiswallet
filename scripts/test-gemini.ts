import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
	console.error('❌ VITE_GEMINI_API_KEY is not set in environment variables.');
	process.exit(1);
}

console.log(`✅ API Key found (length: ${apiKey.length})`);

const modelsToTest = [
	'gemini-2.0-flash',
	'gemini-2.0-flash-lite',
	'gemini-flash-latest',
	'gemini-flash-lite-latest',
];

async function testModel(modelName: string) {
	console.log(`\nTesting model: ${modelName}...`);
	try {
		const genAI = new GoogleGenerativeAI(apiKey as string);
		const model = genAI.getGenerativeModel({ model: modelName });
		const result = await model.generateContent('Hello, are you working?');
		const response = await result.response;
		console.log(`✅ Success! Response: ${response.text().slice(0, 50)}...`);
		return true;
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`❌ Failed: ${errorMessage}`);
		return false;
	}
}

async function main() {
	console.log('Starting Gemini API Test...');

	for (const model of modelsToTest) {
		await testModel(model);
	}
}

main();
