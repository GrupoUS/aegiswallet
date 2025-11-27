/**
 * Speech-to-Text (STT) Module Exports
 *
 * Central export point for all STT-related functionality
 */

// Export types from audioProcessor
export type {
	AudioProcessingConfig,
	ProcessedAudio,
} from './audioProcessor';
// Explicitly re-export from audioProcessor to avoid VADResult conflict
export {
	AudioProcessor,
	createAudioProcessor,
} from './audioProcessor';
export * from './speechToTextService';
// Export types from voiceActivityDetection
// Resolve naming conflicts
export type {
	VADConfig,
	VADResult as VoiceActivityResult,
} from './voiceActivityDetection';
// Explicitly re-export from voiceActivityDetection (excluding VADResult to avoid conflict)
export {
	createVAD,
	detectVoiceActivity,
	VoiceActivityDetector,
} from './voiceActivityDetection';

// Import and re-export AudioVADResult to avoid conflicts
import type { VADResult } from './audioProcessor';
export type AudioVADResult = VADResult;
