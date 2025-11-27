// Test file to verify STT exports are working correctly
import {
  // From voiceActivityDetection
  VoiceActivityDetector,
  VADConfig,
  VoiceActivityResult,
  createVAD,

  // From audioProcessor
  AudioProcessor,
  AudioProcessingConfig,
  ProcessedAudio,
  AudioVADResult,
  createAudioProcessor,

  // From speechToTextService
  SpeechToTextService
} from './src/lib/stt/index';

// Test that we can use the types without conflicts
const vadConfig: VADConfig = {
  sampleRate: 16000,
  energyThreshold: 0.01,
  minSpeechDuration: 300,
  silenceDuration: 1000,
  frameSize: 1024
};

const audioConfig: AudioProcessingConfig = {
  sampleRate: 16000,
  silenceThreshold: 0.01,
  silenceDuration: 2000,
  minAudioDuration: 500,
  maxAudioDuration: 30000,
  volumeThreshold: 0.02
};

// Test that VADResult types are properly differentiated
const voiceResult: VoiceActivityResult = {
  isSpeaking: true,
  energy: 0.5,
  speechStartTime: Date.now(),
  speechDuration: 1000
};

const audioResult: AudioVADResult = {
  hasVoice: true,
  confidence: 0.8,
  speechSegments: [{ start: 0, end: 1 }]
};

console.log('STT exports working correctly!');