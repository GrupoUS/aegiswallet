const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
	console.error('❌ VITE_GEMINI_API_KEY is not set');
	process.exit(1);
}

async function listModels() {
	const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

	try {
		const response = await fetch(url);
		const data = await response.json();

		if (data.error) {
			console.error('❌ API Error:', JSON.stringify(data.error, null, 2));
			return;
		}

		if (!data.models) {
			console.log('No models found or unexpected format:', data);
			return;
		}

		const fs = require('node:fs');
		fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
		console.log('✅ Models saved to models.json');
	} catch (error) {
		console.error('❌ Network Error:', error);
	}
}

listModels().catch(console.error);
