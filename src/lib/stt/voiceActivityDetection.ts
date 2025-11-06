/**
 * Voice Activity Detection (VAD) for optimizing voice command processing
 * Detects when speech starts and ends to improve responsiveness
 */

export interface VADConfig {
  /**
   * Audio sample rate for analysis
   */
  sampleRate: number;

  /**
   * Energy threshold for detecting speech
   */
  energyThreshold: number;

  /**
   * Minimum speech duration in milliseconds
   */
  minSpeechDuration: number;

  /**
   * Silence duration before considering speech ended
   */
  silenceDuration: number;

  /**
   * Analysis window size in samples
   */
  frameSize: number;
}

export interface VADResult {
  /**
   * Whether speech is currently detected
   */
  isSpeaking: boolean;

  /**
   * Current energy level
   */
  energy: number;

  /**
   * Time when speech started (null if not speaking)
   */
  speechStartTime: number | null;

  /**
   * Duration of current speech segment
   */
  speechDuration: number;
}

export class VoiceActivityDetector {
  private config: Required<VADConfig>;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening = false;
  private speechStartTime: number | null = null;
  private lastSpeechTime: number = 0;
  private animationId: number | null = null;
  private onSpeechStart?: () => void;
  private onSpeechEnd?: () => void;

  constructor(config: Partial<VADConfig> = {}) {
    this.config = {
      sampleRate: 16000,
      energyThreshold: 0.01,
      minSpeechDuration: 300,
      silenceDuration: 1000,
      frameSize: 1024,
      ...config,
    };
  }

  /**
   * Initialize VAD with audio stream
   */
  async initialize(stream: MediaStream): Promise<void> {
    try {
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();

      this.analyser.fftSize = this.config.frameSize;
      this.analyser.smoothingTimeConstant = 0.8;

      source.connect(this.analyser);

      this.isListening = true;
      this.startAnalysis();
    } catch (error) {
      throw new Error(`VAD initialization failed: ${error}`);
    }
  }

  /**
   * Start voice activity analysis
   */
  private startAnalysis(): void {
    if (!this.analyser || !this.isListening) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!this.isListening || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calculate RMS energy
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = dataArray[i] / 255;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const energy = rms;

      const currentTime = Date.now();
      const isSpeaking = energy > this.config.energyThreshold;

      // Speech start detection
      if (isSpeaking && !this.speechStartTime) {
        this.speechStartTime = currentTime;
        this.lastSpeechTime = currentTime;
        this.onSpeechStart?.();
      }

      // Speech continuation
      else if (isSpeaking && this.speechStartTime) {
        this.lastSpeechTime = currentTime;
      }

      // Speech end detection
      else if (!isSpeaking && this.speechStartTime) {
        const silenceDuration = currentTime - this.lastSpeechTime;
        const totalSpeechDuration = currentTime - this.speechStartTime;

        if (silenceDuration > this.config.silenceDuration) {
          if (totalSpeechDuration > this.config.minSpeechDuration) {
            this.onSpeechEnd?.();
          }
          this.speechStartTime = null;
        }
      }

      this.animationId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  /**
   * Get current VAD state
   */
  getCurrentState(): VADResult {
    const currentTime = Date.now();
    const speechDuration = this.speechStartTime ? currentTime - this.speechStartTime : 0;

    return {
      isSpeaking: this.speechStartTime !== null,
      energy: this.calculateCurrentEnergy(),
      speechStartTime: this.speechStartTime,
      speechDuration,
    };
  }

  /**
   * Calculate current energy level
   */
  private calculateCurrentEnergy(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = dataArray[i] / 255;
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / bufferLength);
  }

  /**
   * Set speech start callback
   */
  onSpeechStartCallback(callback: () => void): void {
    this.onSpeechStart = callback;
  }

  /**
   * Set speech end callback
   */
  onSpeechEndCallback(callback: () => void): void {
    this.onSpeechEnd = callback;
  }

  /**
   * Adjust energy threshold dynamically
   */
  setEnergyThreshold(threshold: number): void {
    this.config.energyThreshold = Math.max(0.001, Math.min(1, threshold));
  }

  /**
   * Stop VAD analysis and clean up resources
   */
  stop(): void {
    this.isListening = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.speechStartTime = null;
    this.lastSpeechTime = 0;
  }

  /**
   * Check if VAD is currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }
}

/**
 * Factory function to create VAD instance
 */
export function createVAD(config?: Partial<VADConfig>): VoiceActivityDetector {
  return new VoiceActivityDetector(config);
}

/**
 * Utility for quick voice activity detection without ongoing analysis
 */
export async function detectVoiceActivity(
  audioBlob: Blob,
  options: Partial<VADConfig> = {}
): Promise<{
  hasVoice: boolean;
  confidence: number;
  duration: number;
}> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const audioContext = new AudioContext();

    audio.onloadedmetadata = () => {
      try {
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let totalEnergy = 0;
        let frameCount = 0;
        let maxEnergy = 0;

        const analyze = () => {
          if (audio.ended || audio.paused) {
            const avgEnergy = frameCount > 0 ? totalEnergy / frameCount : 0;
            const duration = audio.duration * 1000; // Convert to milliseconds

            resolve({
              hasVoice: avgEnergy > (options.energyThreshold || 0.01),
              confidence: Math.min(1, avgEnergy / (options.energyThreshold || 0.01)),
              duration,
            });

            audioContext.close();
            return;
          }

          analyser.getByteFrequencyData(dataArray);

          let frameEnergy = 0;
          for (let i = 0; i < bufferLength; i++) {
            const normalized = dataArray[i] / 255;
            frameEnergy += normalized * normalized;
          }

          const rms = Math.sqrt(frameEnergy / bufferLength);
          totalEnergy += rms;
          maxEnergy = Math.max(maxEnergy, rms);
          frameCount++;

          requestAnimationFrame(analyze);
        };

        audio.play();
        analyze();
      } catch (error) {
        reject(error);
        audioContext.close();
      }
    };

    audio.onerror = () => {
      reject(new Error('Audio loading failed'));
      audioContext.close();
    };

    audio.src = URL.createObjectURL(audioBlob);
  });
}
