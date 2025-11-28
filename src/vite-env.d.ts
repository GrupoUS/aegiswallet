/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CLERK_PUBLISHABLE_KEY: string;
	readonly VITE_NEON_DATABASE_URL: string;
	readonly VITE_APP_URL: string;
	readonly VITE_API_URL: string;
	readonly VITE_GOOGLE_CLIENT_ID?: string;
	readonly VITE_GOOGLE_CALENDAR_API_KEY?: string;
	readonly VITE_STT_PROVIDER: string;
	readonly VITE_TTS_PROVIDER: string;
	readonly VITE_OPENAI_API_KEY?: string;
	readonly VITE_ELEVENLABS_API_KEY?: string;
	readonly VITE_GROQ_API_KEY?: string;
	readonly VITE_DEEPGRAM_API_KEY?: string;
	readonly VITE_GOOGLE_CLOUD_API_KEY?: string;
	readonly VITE_AZURE_SPEECH_KEY?: string;
	readonly VITE_AZURE_SPEECH_REGION?: string;
	readonly VITE_LOG_LEVEL?: string;
	readonly MODE: string;
	readonly DEV: boolean;
	readonly PROD: boolean;
	readonly SSR: boolean;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
