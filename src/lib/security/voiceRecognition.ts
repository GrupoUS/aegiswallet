/**
 * Voice Recognition Service with Multi-Provider Fallback
 *
 * Story: 01.04 - Segurança e Confirmação por Voz
 *
 * Multi-provider voice recognition for secure confirmations:
 * - Primary: OpenAI Whisper API (already integrated)
 * - Secondary: Google Gemini API (fallback)
 * - Tertiary: ElevenLabs API (final fallback)
 *
 * Features:
 * - 80% confidence threshold
 * - Levenshtein distance similarity matching
 * - Automatic provider fallback
 * - Performance tracking
 *
 * @module security/voiceRecognition
 */

// ============================================================================
// Types
// ============================================================================

export type VoiceProvider = 'openai' | 'gemini' | 'elevenlabs';

export interface VoiceRecognitionConfig {
	primaryProvider: VoiceProvider;
	fallbackProviders: VoiceProvider[];
	confidenceThreshold: number; // 0.80 default
	timeout: number; // milliseconds
}

export interface VoiceConfirmationResult {
	isConfirmed: boolean;
	transcription: string;
	confidence: number;
	provider: VoiceProvider;
	processingTime: number;
	similarity: number;
}

export interface TranscriptionResult {
	transcription: string;
	confidence: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: VoiceRecognitionConfig = {
	confidenceThreshold: 0.8,
	fallbackProviders: ['gemini', 'elevenlabs'],
	primaryProvider: 'openai',
	timeout: 10000, // 10s
};

// ============================================================================
// Voice Recognition Service
// ============================================================================

export class VoiceRecognitionService {
	private config: VoiceRecognitionConfig;
	private openaiKey: string;
	private geminiKey: string;
	private elevenlabsKey: string;

	constructor(config: Partial<VoiceRecognitionConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };

		// Get API keys from environment
		this.openaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
		this.geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
		this.elevenlabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
	}

	/**
	 * Confirm voice command with multi-provider fallback
	 */
	async confirmVoiceCommand(
		audioBlob: Blob,
		expectedPhrase: string,
	): Promise<VoiceConfirmationResult> {
		const startTime = Date.now();

		// Try primary provider
		try {
			const result = await this.transcribeWithProvider(
				audioBlob,
				this.config.primaryProvider,
			);

			const similarity = this.calculateSimilarity(
				result.transcription,
				expectedPhrase,
			);
			const isConfirmed = similarity >= this.config.confidenceThreshold;

			return {
				confidence: result.confidence,
				isConfirmed,
				processingTime: Date.now() - startTime,
				provider: this.config.primaryProvider,
				similarity,
				transcription: result.transcription,
			};
		} catch (_error) {}

		// Try fallback providers
		for (const provider of this.config.fallbackProviders) {
			try {
				const result = await this.transcribeWithProvider(audioBlob, provider);

				const similarity = this.calculateSimilarity(
					result.transcription,
					expectedPhrase,
				);
				const isConfirmed = similarity >= this.config.confidenceThreshold;

				return {
					confidence: result.confidence,
					isConfirmed,
					processingTime: Date.now() - startTime,
					provider,
					similarity,
					transcription: result.transcription,
				};
			} catch (_error) {}
		}

		// All providers failed
		throw new Error('All voice recognition providers failed');
	}

	/**
	 * Transcribe with specific provider
	 */
	private async transcribeWithProvider(
		audioBlob: Blob,
		provider: VoiceProvider,
	): Promise<TranscriptionResult> {
		switch (provider) {
			case 'openai':
				return this.transcribeWithOpenAI(audioBlob);
			case 'gemini':
				return this.transcribeWithGemini(audioBlob);
			case 'elevenlabs':
				return this.transcribeWithElevenLabs(audioBlob);
			default:
				throw new Error(`Unknown provider: ${provider}`);
		}
	}

	/**
	 * Transcribe with OpenAI Whisper API
	 */
	private async transcribeWithOpenAI(
		audioBlob: Blob,
	): Promise<TranscriptionResult> {
		if (!this.openaiKey) {
			throw new Error('OpenAI API key not configured');
		}

		const formData = new FormData();
		formData.append('file', audioBlob, 'audio.webm');
		formData.append('model', 'whisper-1');
		formData.append('language', 'pt');

		const response = await fetch(
			'https://api.openai.com/v1/audio/transcriptions',
			{
				body: formData,
				headers: {
					Authorization: `Bearer ${this.openaiKey}`,
				},
				method: 'POST',
			},
		);

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.statusText}`);
		}

		const data = await response.json();

		return {
			confidence: 0.95,
			transcription: data.text, // Whisper doesn't return confidence, assume high
		};
	}

	/**
	 * Transcribe with Google Gemini API
	 */
	private async transcribeWithGemini(
		audioBlob: Blob,
	): Promise<TranscriptionResult> {
		if (!this.geminiKey) {
			throw new Error('Gemini API key not configured');
		}

		// Convert audio to base64
		const arrayBuffer = await audioBlob.arrayBuffer();
		const base64Audio = btoa(
			String.fromCharCode(...new Uint8Array(arrayBuffer)),
		);

		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.geminiKey}`,
			{
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: `Transcreva o seguinte áudio em português brasileiro: ${base64Audio}`,
								},
							],
						},
					],
				}),
				headers: {
					'Content-Type': 'application/json',
				},
				method: 'POST',
			},
		);

		if (!response.ok) {
			throw new Error(`Gemini API error: ${response.statusText}`);
		}

		const data = await response.json();
		const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

		return {
			confidence: 0.92,
			transcription, // Gemini doesn't return confidence, assume good
		};
	}

	/**
	 * Transcribe with ElevenLabs API
	 */
	private async transcribeWithElevenLabs(
		audioBlob: Blob,
	): Promise<TranscriptionResult> {
		if (!this.elevenlabsKey) {
			throw new Error('ElevenLabs API key not configured');
		}

		const formData = new FormData();
		formData.append('audio', audioBlob);

		const response = await fetch(
			'https://api.elevenlabs.io/v1/speech-to-text',
			{
				body: formData,
				headers: {
					'xi-api-key': this.elevenlabsKey,
				},
				method: 'POST',
			},
		);

		if (!response.ok) {
			throw new Error(`ElevenLabs API error: ${response.statusText}`);
		}

		const data = await response.json();

		return {
			confidence: 0.9,
			transcription: data.text || '', // ElevenLabs doesn't return confidence, assume decent
		};
	}

	/**
	 * Calculate similarity between two strings using Levenshtein distance
	 */
	private calculateSimilarity(str1: string, str2: string): number {
		// Normalize strings
		const normalize = (str: string) =>
			str
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.trim();

		const normalized1 = normalize(str1);
		const normalized2 = normalize(str2);

		// Calculate Levenshtein distance
		const distance = this.levenshteinDistance(normalized1, normalized2);

		// Convert to similarity score (0-1)
		const maxLength = Math.max(normalized1.length, normalized2.length);
		if (maxLength === 0) {
			return 1.0;
		}

		return (maxLength - distance) / maxLength;
	}

	/**
	 * Calculate Levenshtein distance between two strings
	 */
	private levenshteinDistance(str1: string, str2: string): number {
		const matrix: number[][] = [];

		// Initialize matrix
		for (let i = 0; i <= str1.length; i++) {
			matrix[i] = [i];
		}
		for (let j = 0; j <= str2.length; j++) {
			matrix[0][j] = j;
		}

		// Fill matrix
		for (let i = 1; i <= str1.length; i++) {
			for (let j = 1; j <= str2.length; j++) {
				if (str1[i - 1] === str2[j - 1]) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1, // substitution
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1, // deletion
					);
				}
			}
		}

		return matrix[str1.length][str2.length];
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<VoiceRecognitionConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): VoiceRecognitionConfig {
		return { ...this.config };
	}
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create voice recognition service
 */
export function createVoiceRecognitionService(
	config?: Partial<VoiceRecognitionConfig>,
): VoiceRecognitionService {
	return new VoiceRecognitionService(config);
}

/**
 * Quick confirm function
 */
export async function confirmVoice(
	audioBlob: Blob,
	expectedPhrase: string,
): Promise<VoiceConfirmationResult> {
	const service = createVoiceRecognitionService();
	return service.confirmVoiceCommand(audioBlob, expectedPhrase);
}
