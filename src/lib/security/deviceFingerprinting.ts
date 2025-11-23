/**
 * Device Fingerprinting System - Story 01.04
 *
 * Advanced device identification for security and fraud detection
 * LGPD-compliant device tracking with privacy preservation
 */

import type { NavigatorWithExtensions, WindowWithExtensions } from './browser-types';

export interface DeviceFingerprint {
  id: string;
  userAgent: string;
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  timezone: {
    offset: number;
    name: string;
  };
  language: string[];
  platform: string;
  hardware: {
    cores: number;
    memory: number;
    deviceMemory: number;
  };
  webgl: {
    vendor: string;
    renderer: string;
  };
  canvas: string;
  audio: string;
  fonts: string[];
  plugins: string[];
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  battery?: {
    level: number;
    charging: boolean;
  };
  created: Date;
  confidence: number;
}

export interface DeviceProfile {
  fingerprintId: string;
  userId: string;
  deviceFingerprint: DeviceFingerprint;
  firstSeen: Date;
  lastSeen: Date;
  frequency: number;
  isTrusted: boolean;
  riskScore: number;
  metadata?: Record<string, unknown>;
}

export interface FingerprintConfig {
  enableCanvas: boolean;
  enableWebGL: boolean;
  enableAudio: boolean;
  enableFonts: boolean;
  enableBattery: boolean;
  enableConnection: boolean;
  salt: string;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Device Fingerprinting Service
 */
export class DeviceFingerprintingService {
  private config: FingerprintConfig;
  private cachedFingerprint: DeviceFingerprint | null = null;

  constructor(config: Partial<FingerprintConfig> = {}) {
    this.config = {
      enableCanvas: true,
      enableWebGL: true,
      enableAudio: true,
      enableFonts: true,
      enableBattery: true,
      enableConnection: true,
      salt: 'aegiswallet-fingerprint-salt',
      riskThresholds: {
        high: 0.8,
        low: 0.3,
        medium: 0.6,
      },
      ...config,
    };
  }

  /**
   * Generate comprehensive device fingerprint
   */
  async generateFingerprint(): Promise<DeviceFingerprint> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    const fingerprint: Partial<DeviceFingerprint> = {
      confidence: 0,
      created: new Date(),
      userAgent: navigator.userAgent,
    };
    // Screen information
    fingerprint.screen = this.getScreenInfo();

    // Timezone information
    fingerprint.timezone = this.getTimezoneInfo();

    // Language information
    fingerprint.language = this.getLanguageInfo();

    // Platform information
    fingerprint.platform = this.getPlatformInfo();

    // Hardware information
    fingerprint.hardware = await this.getHardwareInfo();

    // WebGL fingerprint
    if (this.config.enableWebGL) {
      fingerprint.webgl = this.getWebGLFingerprint();
    }

    // Canvas fingerprint
    if (this.config.enableCanvas) {
      fingerprint.canvas = await this.getCanvasFingerprint();
    }

    // Audio fingerprint
    if (this.config.enableAudio) {
      fingerprint.audio = await this.getAudioFingerprint();
    }

    // Font detection
    if (this.config.enableFonts) {
      fingerprint.fonts = await this.getFontFingerprint();
    }

    // Plugin information
    fingerprint.plugins = this.getPluginInfo();

    // Network information
    if (this.config.enableConnection) {
      fingerprint.connection = this.getConnectionInfo();
    }

    // Battery information
    if (this.config.enableBattery) {
      fingerprint.battery = await this.getBatteryInfo();
    }

    // Generate unique ID and calculate confidence
    fingerprint.id = this.generateFingerprintId(fingerprint as DeviceFingerprint);
    fingerprint.confidence = this.calculateConfidence(fingerprint as DeviceFingerprint);

    this.cachedFingerprint = fingerprint as DeviceFingerprint;
    return fingerprint as DeviceFingerprint;
  }

  /**
   * Get screen information
   */
  private getScreenInfo(): DeviceFingerprint['screen'] {
    return {
      colorDepth: screen.colorDepth,
      height: screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      width: screen.width,
    };
  }

  /**
   * Get timezone information
   */
  private getTimezoneInfo(): DeviceFingerprint['timezone'] {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();

    return {
      offset: -offset, // Convert to UTC offset
      name: timezone,
    };
  }

  /**
   * Get language information
   */
  private getLanguageInfo(): string[] {
    return [navigator.language, ...(navigator.languages || [])];
  }

  /**
   * Get platform information
   */
  private getPlatformInfo(): string {
    return navigator.platform || 'unknown';
  }

  /**
   * Get hardware information
   */
  private async getHardwareInfo(): Promise<DeviceFingerprint['hardware']> {
    const nav = navigator as NavigatorWithExtensions;
    return {
      cores: navigator.hardwareConcurrency || 4,
      deviceMemory: nav.deviceMemory || 4,
      memory: nav.deviceMemory || 4,
    };
  }

  /**
   * Get WebGL fingerprint
   */
  private getWebGLFingerprint(): DeviceFingerprint['webgl'] {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) {
        return { renderer: 'unknown', vendor: 'unknown' };
      }

      const context = gl as WebGLRenderingContext;
      const debugInfo = context.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        return { renderer: 'unknown', vendor: 'unknown' };
      }

      return {
        renderer: context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        vendor: context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      };
    } catch (_error) {
      return { renderer: 'unknown', vendor: 'unknown' };
    }
  }

  /**
   * Get canvas fingerprint
   */
  private async getCanvasFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve('canvas-not-supported');
          return;
        }

        // Draw complex shape
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Canvas fingerprint 🎨', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Canvas fingerprint 🎨', 4, 17);

        // Add some curves
        ctx.beginPath();
        ctx.arc(50, 25, 20, 0, Math.PI * 2);
        ctx.stroke();

        resolve(canvas.toDataURL());
      } catch (_error) {
        resolve('canvas-error');
      }
    });
  }

  /**
   * Get audio fingerprint
   */
  private async getAudioFingerprint(): Promise<string> {
    return new Promise((resolve) => {
      try {
        const win = window as unknown as WindowWithExtensions;
        const AudioContext = window.AudioContext || win.webkitAudioContext;
        if (!AudioContext) {
          resolve('audio-not-supported');
          return;
        }

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

        gainNode.gain.value = 0;
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(0);

        scriptProcessor.onaudioprocess = (event) => {
          const samples = event.inputBuffer.getChannelData(0);
          let sum = 0;

          for (let i = 0; i < samples.length; i++) {
            sum += Math.abs(samples[i]);
          }

          oscillator.stop();
          scriptProcessor.disconnect();
          analyser.disconnect();
          gainNode.disconnect();
          context.close();

          resolve(sum.toString());
        };
      } catch (_error) {
        resolve('audio-error');
      }
    });
  }

  /**
   * Get font fingerprint
   */
  private async getFontFingerprint(): Promise<string[]> {
    const testFonts = [
      'Arial',
      'Arial Black',
      'Comic Sans MS',
      'Courier New',
      'Georgia',
      'Helvetica',
      'Impact',
      'Times New Roman',
      'Trebuchet MS',
      'Verdana',
      'Roboto',
      'Open Sans',
      'Lato',
      'Montserrat',
      'Poppins',
      'Playfair Display',
      'Merriweather',
      'Oswald',
      'Raleway',
      'Nunito',
      'Ubuntu',
      'Droid Sans',
    ];

    const detectedFonts: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return [];
    }

    const testText = 'mmmmmmmmlli';
    const baselineSize = 100;

    // Get baseline measurement with default font
    ctx.font = `${baselineSize}px monospace`;
    const baselineWidth = ctx.measureText(testText).width;

    // Test each font
    for (const font of testFonts) {
      ctx.font = `${baselineSize}px "${font}", monospace`;
      const width = ctx.measureText(testText).width;

      if (width !== baselineWidth) {
        detectedFonts.push(font);
      }
    }

    return detectedFonts;
  }

  /**
   * Get plugin information
   */
  private getPluginInfo(): string[] {
    const plugins: string[] = [];

    if (navigator.plugins) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        plugins.push(plugin.name);
      }
    }

    return plugins;
  }

  /**
   * Get network connection information
   */
  private getConnectionInfo(): DeviceFingerprint['connection'] | undefined {
    const nav = navigator as NavigatorWithExtensions;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (!connection) {
      return undefined;
    }

    return {
      downlink: connection.downlink || 0,
      effectiveType: connection.effectiveType || 'unknown',
      rtt: connection.rtt || 0,
    };
  }

  /**
   * Get battery information
   */
  private async getBatteryInfo(): Promise<DeviceFingerprint['battery'] | undefined> {
    try {
      const nav = navigator as NavigatorWithExtensions;
      const battery = await nav.getBattery?.();

      if (!battery) {
        return undefined;
      }

      return {
        charging: battery.charging,
        level: battery.level,
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Generate unique fingerprint ID
   */
  private generateFingerprintId(fingerprint: DeviceFingerprint): string {
    const components = [
      fingerprint.userAgent,
      fingerprint.screen?.width,
      fingerprint.screen?.height,
      fingerprint.screen?.colorDepth,
      fingerprint.screen?.pixelRatio,
      fingerprint.timezone?.offset,
      fingerprint.timezone?.name,
      fingerprint.language?.join(','),
      fingerprint.platform,
      fingerprint.hardware?.cores,
      fingerprint.hardware?.memory,
      fingerprint.webgl?.vendor,
      fingerprint.webgl?.renderer,
      fingerprint.canvas,
      fingerprint.audio,
      fingerprint.fonts?.join(','),
      fingerprint.plugins?.join(','),
      this.config.salt,
    ].filter(Boolean);

    const dataString = components.join('|');

    // Simple hash function for fingerprint ID
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Calculate fingerprint confidence score
   */
  private calculateConfidence(fingerprint: DeviceFingerprint): number {
    let confidence = 0;
    let totalComponents = 0;

    // Weight different components
    const weights = {
      audio: 0.1,
      canvas: 0.15,
      fonts: 0.1,
      hardware: 0.1,
      language: 0.05,
      platform: 0.05,
      plugins: 0.05,
      screen: 0.1,
      timezone: 0.1,
      userAgent: 0.15,
      webgl: 0.15,
    };

    Object.entries(weights).forEach(([component, weight]) => {
      totalComponents += weight;

      if (fingerprint[component as keyof DeviceFingerprint]) {
        // Check if component has meaningful data
        const hasData = this.hasValidData(fingerprint, component);
        if (hasData) {
          confidence += weight;
        }
      }
    });

    return Math.min(confidence / totalComponents, 1.0);
  }

  /**
   * Check if component has valid data
   */
  private hasValidData(fingerprint: DeviceFingerprint, component: string): boolean {
    switch (component) {
      case 'userAgent':
        return fingerprint.userAgent !== 'unknown' && fingerprint.userAgent.length > 10;
      case 'screen':
        return fingerprint.screen && fingerprint.screen.width > 0;
      case 'timezone':
        return fingerprint.timezone && fingerprint.timezone.name !== 'unknown';
      case 'language':
        return fingerprint.language && fingerprint.language.length > 0;
      case 'platform':
        return fingerprint.platform !== 'unknown';
      case 'hardware':
        return fingerprint.hardware && fingerprint.hardware.cores > 0;
      case 'webgl':
        return (
          fingerprint.webgl &&
          fingerprint.webgl.vendor !== 'unknown' &&
          fingerprint.webgl.renderer !== 'unknown'
        );
      case 'canvas':
        return (
          fingerprint.canvas &&
          fingerprint.canvas !== 'canvas-not-supported' &&
          fingerprint.canvas !== 'canvas-error'
        );
      case 'audio':
        return Boolean(
          fingerprint.audio &&
            fingerprint.audio !== 'audio-not-supported' &&
            fingerprint.audio !== 'audio-error'
        );
      case 'fonts':
        return fingerprint.fonts && fingerprint.fonts.length > 0;
      case 'plugins':
        return fingerprint.plugins && fingerprint.plugins.length > 0;
      default:
        return false;
    }
  }

  /**
   * Compare two fingerprints for similarity
   */
  compareFingerprints(
    fp1: DeviceFingerprint,
    fp2: DeviceFingerprint
  ): {
    similarity: number;
    differences: string[];
  } {
    const differences: string[] = [];
    let similarity = 0;
    let totalComparisons = 0;

    // Compare individual components
    const comparisons = [
      {
        compare: () => fp1.userAgent === fp2.userAgent,
        name: 'userAgent',
        weight: 0.15,
      },
      {
        compare: () =>
          fp1.screen.width === fp2.screen.width && fp1.screen.height === fp2.screen.height,
        name: 'screen',
        weight: 0.1,
      },
      {
        compare: () => fp1.timezone.offset === fp2.timezone.offset,
        name: 'timezone',
        weight: 0.1,
      },
      {
        compare: () => fp1.language[0] === fp2.language[0],
        name: 'language',
        weight: 0.05,
      },
      {
        compare: () => fp1.platform === fp2.platform,
        name: 'platform',
        weight: 0.05,
      },
      {
        compare: () => fp1.hardware.cores === fp2.hardware.cores,
        name: 'hardware',
        weight: 0.1,
      },
      {
        compare: () =>
          fp1.webgl.vendor === fp2.webgl.vendor && fp1.webgl.renderer === fp2.webgl.renderer,
        name: 'webgl',
        weight: 0.15,
      },
      {
        compare: () => fp1.canvas === fp2.canvas,
        name: 'canvas',
        weight: 0.15,
      },
      {
        compare: () => fp1.audio === fp2.audio,
        name: 'audio',
        weight: 0.1,
      },
      {
        compare: () => {
          const set1 = new Set(fp1.fonts);
          const set2 = new Set(fp2.fonts);
          const intersection = new Set([...set1].filter((x) => set2.has(x)));
          const union = new Set([...set1, ...set2]);
          return intersection.size / union.size;
        },
        name: 'fonts',
        weight: 0.1,
      },
      {
        compare: () => {
          const set1 = new Set(fp1.plugins);
          const set2 = new Set(fp2.plugins);
          const intersection = new Set([...set1].filter((x) => set2.has(x)));
          const union = new Set([...set1, ...set2]);
          return intersection.size / union.size;
        },
        name: 'plugins',
        weight: 0.05,
      },
    ];

    comparisons.forEach(({ name, compare, weight }) => {
      totalComparisons += weight;
      const isSimilar = compare();
      if (typeof isSimilar === 'boolean') {
        if (isSimilar) {
          similarity += weight;
        } else {
          differences.push(name);
        }
      } else {
        // For similarity scores (fonts, plugins)
        similarity += weight * isSimilar;
        if (isSimilar < 0.8) {
          differences.push(name);
        }
      }
    });

    return {
      differences,
      similarity: similarity / totalComparisons,
    };
  }

  /**
   * Get device risk score based on fingerprint characteristics
   */
  getDeviceRiskScore(fingerprint: DeviceFingerprint): {
    score: number;
    level: 'low' | 'medium' | 'high';
    reasons: string[];
  } {
    const reasons: string[] = [];
    let score = 0;

    // Check for privacy/resistance tools
    if (fingerprint.userAgent.includes('Tor') || fingerprint.userAgent.includes('VPN')) {
      score += 0.3;
      reasons.push('Privacy or anonymity tools detected');
    }

    // Check for uncommon screen resolutions
    const isUncommonResolution =
      fingerprint.screen.width < 1024 ||
      fingerprint.screen.height < 768 ||
      (fingerprint.screen.width === 0 && fingerprint.screen.height === 0);

    if (isUncommonResolution) {
      score += 0.2;
      reasons.push('Uncommon screen resolution');
    }

    // Check for bot-like characteristics
    if (fingerprint.confidence < 0.5) {
      score += 0.3;
      reasons.push('Low fingerprint confidence - possible bot');
    }

    // Check for virtual/private browsing
    if (fingerprint.hardware.memory === 0) {
      score += 0.1;
      reasons.push('Hardware information unavailable');
    }

    // Check for WebGL not available
    if (fingerprint.webgl.vendor === 'unknown') {
      score += 0.1;
      reasons.push('WebGL not available');
    }

    // Determine risk level
    let level: 'low' | 'medium' | 'high' = 'low';
    if (score >= this.config.riskThresholds.high) {
      level = 'high';
    } else if (score >= this.config.riskThresholds.medium) {
      level = 'medium';
    }

    return {
      level,
      reasons,
      score,
    };
  }

  /**
   * Clear cached fingerprint
   */
  clearCache(): void {
    this.cachedFingerprint = null;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FingerprintConfig>): void {
    this.config = { ...this.config, ...config };
    this.clearCache(); // Clear cache when config changes
  }

  /**
   * Get current configuration
   */
  getConfig(): FingerprintConfig {
    return { ...this.config };
  }
}

/**
 * Create device fingerprinting service
 */
export function createDeviceFingerprintingService(
  config?: Partial<FingerprintConfig>
): DeviceFingerprintingService {
  return new DeviceFingerprintingService(config);
}

/**
 * Quick fingerprint generation function
 */
export async function generateDeviceFingerprint(
  config?: Partial<FingerprintConfig>
): Promise<DeviceFingerprint> {
  const service = createDeviceFingerprintingService(config);
  return service.generateFingerprint();
}