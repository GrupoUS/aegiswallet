/**
 * Audio Processing Utilities for Voice Recognition
 *
 * Features:
 * - Voice Activity Detection (VAD)
 * - Noise cancellation
 * - Volume normalization
 * - Silence detection
 * - Audio compression
 *
 * @module audioProcessor
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AudioProcessingConfig {
	sampleRate?: number;
	silenceThreshold?: number;
	silenceDuration?: number;
	minAudioDuration?: number;
	maxAudioDuration?: number;
	volumeThreshold?: number;
}

export interface ProcessedAudio {
	blob: Blob;
	duration: number;
	sampleRate: number;
	hasVoice: boolean;
	averageVolume: number;
	peakVolume: number;
}

export interface VADResult {
	hasVoice: boolean;
	confidence: number;
	speechSegments: { start: number; end: number }[];
}

// ============================================================================
// Audio Processor Class
// ============================================================================

export class AudioProcessor {
	private config: Required<AudioProcessingConfig>;
	private audioContext: AudioContext | null = null;

	constructor(config: AudioProcessingConfig = {}) {
		this.config = {
			sampleRate: config.sampleRate || 16000, // 16kHz for speech
			silenceThreshold: config.silenceThreshold || 0.01, // 1% of max amplitude
			silenceDuration: config.silenceDuration || 2000, // 2 seconds
			minAudioDuration: config.minAudioDuration || 500, // 0.5 seconds
			maxAudioDuration: config.maxAudioDuration || 30000, // 30 seconds
			volumeThreshold: config.volumeThreshold || 0.02, // 2% of max amplitude
		};
	}

	/**
	 * Initialize audio context
	 */
	private async getAudioContext(): Promise<AudioContext> {
		if (!this.audioContext) {
			this.audioContext = new AudioContext({
				sampleRate: this.config.sampleRate,
			});
		}
		return this.audioContext;
	}

	/**
	 * Process audio blob for optimal STT performance
	 *
	 * @param audioBlob - Raw audio data
	 * @returns Processed audio with metadata
	 */
	async processAudio(audioBlob: Blob): Promise<ProcessedAudio> {
		try {
			const audioContext = await this.getAudioContext();

			// Decode audio data
			const arrayBuffer = await audioBlob.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

			// Analyze audio
			const analysis = this.analyzeAudio(audioBuffer);

			// Check for voice activity
			const vadResult = this.detectVoiceActivity(audioBuffer);

			// Normalize volume if needed
			const normalizedBuffer = this.normalizeVolume(audioBuffer, analysis.averageVolume);

			// Convert back to blob
			const processedBlob = await this.audioBufferToBlob(normalizedBuffer);

			return {
				blob: processedBlob,
				duration: audioBuffer.duration * 1000, // Convert to ms
				sampleRate: audioBuffer.sampleRate,
				hasVoice: vadResult.hasVoice,
				averageVolume: analysis.averageVolume,
				peakVolume: analysis.peakVolume,
			};
		} catch (error) {
			throw new Error(`Audio processing failed: ${error}`, { cause: error });
		}
	}

	/**
	 * Detect voice activity in audio buffer
	 *
	 * Simple energy-based VAD implementation
	 */
	private detectVoiceActivity(audioBuffer: AudioBuffer): VADResult {
		const channelData = audioBuffer.getChannelData(0);
		const frameSize = Math.floor(audioBuffer.sampleRate * 0.02); // 20ms frames
		const speechSegments: { start: number; end: number }[] = [];

		let voiceFrames = 0;
		let totalFrames = 0;
		let inSpeech = false;
		let speechStart = 0;

		for (let i = 0; i < channelData.length; i += frameSize) {
			const frame = channelData.slice(i, i + frameSize);
			const energy = this.calculateEnergy(frame);

			totalFrames++;

			if (energy > this.config.volumeThreshold) {
				voiceFrames++;

				if (!inSpeech) {
					inSpeech = true;
					speechStart = i / audioBuffer.sampleRate;
				}
			} else if (inSpeech) {
				// End of speech segment
				speechSegments.push({
					end: i / audioBuffer.sampleRate,
					start: speechStart,
				});
				inSpeech = false;
			}
		}

		// Close last segment if still in speech
		if (inSpeech) {
			speechSegments.push({
				end: audioBuffer.duration,
				start: speechStart,
			});
		}

		const confidence = totalFrames > 0 ? voiceFrames / totalFrames : 0;
		const hasVoice = confidence > 0.1; // At least 10% voice activity

		return {
			confidence,
			hasVoice,
			speechSegments,
		};
	}

	/**
	 * Analyze audio characteristics
	 */
	private analyzeAudio(audioBuffer: AudioBuffer): {
		averageVolume: number;
		peakVolume: number;
		rms: number;
	} {
		const channelData = audioBuffer.getChannelData(0);

		let sum = 0;
		let sumSquares = 0;
		let peak = 0;

		for (let i = 0; i < channelData.length; i++) {
			const sample = Math.abs(channelData[i]);
			sum += sample;
			sumSquares += sample * sample;
			peak = Math.max(peak, sample);
		}

		const averageVolume = sum / channelData.length;
		const rms = Math.sqrt(sumSquares / channelData.length);

		return {
			averageVolume,
			peakVolume: peak,
			rms,
		};
	}

	/**
	 * Calculate energy of audio frame
	 */
	private calculateEnergy(frame: Float32Array): number {
		let sum = 0;
		for (let i = 0; i < frame.length; i++) {
			sum += frame[i] * frame[i];
		}
		return Math.sqrt(sum / frame.length);
	}

	/**
	 * Normalize audio volume to optimal range
	 */
	private normalizeVolume(audioBuffer: AudioBuffer, currentVolume: number): AudioBuffer {
		const targetVolume = 0.5; // Target 50% of max amplitude
		const gain = targetVolume / Math.max(currentVolume, 0.01);

		// Don't amplify too much (max 3x)
		const limitedGain = Math.min(gain, 3.0);

		// Create new buffer with normalized audio
		const normalizedBuffer = new AudioBuffer({
			length: audioBuffer.length,
			numberOfChannels: audioBuffer.numberOfChannels,
			sampleRate: audioBuffer.sampleRate,
		});

		for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
			const inputData = audioBuffer.getChannelData(channel);
			const outputData = normalizedBuffer.getChannelData(channel);

			for (let i = 0; i < inputData.length; i++) {
				outputData[i] = Math.max(-1, Math.min(1, inputData[i] * limitedGain));
			}
		}

		return normalizedBuffer;
	}

	/**
	 * Convert AudioBuffer to Blob (WebM format)
	 */
	private async audioBufferToBlob(audioBuffer: AudioBuffer): Promise<Blob> {
		// Create offline context for rendering
		const offlineContext = new OfflineAudioContext(
			audioBuffer.numberOfChannels,
			audioBuffer.length,
			audioBuffer.sampleRate,
		);

		// Create buffer source
		const source = offlineContext.createBufferSource();
		source.buffer = audioBuffer;
		source.connect(offlineContext.destination);
		source.start();

		// Render audio
		const renderedBuffer = await offlineContext.startRendering();

		// Convert to WAV format (simple, widely supported)
		const wavBlob = this.audioBufferToWav(renderedBuffer);

		return wavBlob;
	}

	/**
	 * Convert AudioBuffer to WAV Blob
	 */
	private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
		const numberOfChannels = audioBuffer.numberOfChannels;
		const sampleRate = audioBuffer.sampleRate;
		const format = 1; // PCM
		const bitDepth = 16;

		const bytesPerSample = bitDepth / 8;
		const blockAlign = numberOfChannels * bytesPerSample;

		const data = new Float32Array(audioBuffer.length * numberOfChannels);
		for (let channel = 0; channel < numberOfChannels; channel++) {
			const channelData = audioBuffer.getChannelData(channel);
			for (let i = 0; i < audioBuffer.length; i++) {
				data[i * numberOfChannels + channel] = channelData[i];
			}
		}

		const dataLength = data.length * bytesPerSample;
		const buffer = new ArrayBuffer(44 + dataLength);
		const view = new DataView(buffer);

		// WAV header
		this.writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + dataLength, true);
		this.writeString(view, 8, 'WAVE');
		this.writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true); // fmt chunk size
		view.setUint16(20, format, true);
		view.setUint16(22, numberOfChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * blockAlign, true);
		view.setUint16(32, blockAlign, true);
		view.setUint16(34, bitDepth, true);
		this.writeString(view, 36, 'data');
		view.setUint32(40, dataLength, true);

		// Write audio data
		let offset = 44;
		for (let i = 0; i < data.length; i++) {
			const sample = Math.max(-1, Math.min(1, data[i]));
			view.setInt16(offset, sample * 0x7fff, true);
			offset += 2;
		}

		return new Blob([buffer], { type: 'audio/wav' });
	}

	/**
	 * Write string to DataView
	 */
	private writeString(view: DataView, offset: number, string: string): void {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}

	/**
	 * Check if audio contains sufficient voice activity
	 */
	async validateAudio(audioBlob: Blob): Promise<{
		valid: boolean;
		reason?: string;
	}> {
		try {
			const processed = await this.processAudio(audioBlob);

			// Check minimum duration
			if (processed.duration < this.config.minAudioDuration) {
				return {
					reason: `Audio too short: ${processed.duration}ms (min: ${this.config.minAudioDuration}ms)`,
					valid: false,
				};
			}

			// Check maximum duration
			if (processed.duration > this.config.maxAudioDuration) {
				return {
					reason: `Audio too long: ${processed.duration}ms (max: ${this.config.maxAudioDuration}ms)`,
					valid: false,
				};
			}

			// Check for voice activity
			if (!processed.hasVoice) {
				return {
					reason: 'No voice activity detected',
					valid: false,
				};
			}

			// Check volume
			if (processed.averageVolume < this.config.volumeThreshold) {
				return {
					reason: 'Audio volume too low',
					valid: false,
				};
			}

			return { valid: true };
		} catch (error) {
			return {
				reason: `Validation error: ${error}`,
				valid: false,
			};
		}
	}

	/**
	 * Cleanup resources
	 */
	dispose(): void {
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}
	}
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create audio processor with default configuration
 */
export function createAudioProcessor(config?: AudioProcessingConfig): AudioProcessor {
	return new AudioProcessor(config);
}
