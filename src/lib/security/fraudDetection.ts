/**
 * Enhanced Fraud Detection System - Story 01.04
 *
 * Advanced fraud detection with machine learning-inspired patterns
 * LGPD-compliant security monitoring for Brazilian financial operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface FraudDetectionConfig {
  riskThresholds: {
    low: number; // 0.0 - 0.3
    medium: number; // 0.3 - 0.7
    high: number; // 0.7 - 1.0
    critical: number; // 1.0
  };
  timeWindows: {
    short: number; // 1 hour
    medium: number; // 24 hours
    long: number; // 7 days
  };
  maxFailedAttempts: number;
  locationAnomalyThreshold: number;
  deviceAnomalyThreshold: number;
  behaviorAnomalyThreshold: number;
}

export interface SecurityEvent {
  userId: string;
  eventType:
    | 'login_attempt'
    | 'auth_success'
    | 'auth_failure'
    | 'account_locked'
    | 'suspicious_activity';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  location?: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
}

export interface FraudDetectionResult {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedAnomalies: string[];
  recommendations: string[];
  shouldBlock: boolean;
  requiresReview: boolean;
  processingTime: number;
}

export interface FraudPattern {
  id: string;
  name: string;
  description: string;
  type: 'frequency' | 'location' | 'device' | 'behavior' | 'velocity';
  threshold: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface UserBehaviorProfile {
  userId: string;
  knownLocations: Array<{
    country: string;
    city: string;
    frequency: number;
    lastSeen: Date;
  }>;
  knownDevices: Array<{
    fingerprint: string;
    userAgent: string;
    frequency: number;
    lastSeen: Date;
  }>;
  typicalBehavior: {
    loginFrequency: number; // logins per day
    activeHours: Array<number>; // hours of day when typically active
    averageSessionDuration: number; // minutes
    preferredAuthMethods: Array<string>;
  };
  lastUpdated: Date;
}

/**
 * Enhanced Fraud Detection Service
 */
export class FraudDetectionService {
  private config: FraudDetectionConfig;
  private patterns: Map<string, FraudPattern> = new Map();
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();

  constructor(config: Partial<FraudDetectionConfig> = {}) {
    this.config = {
      riskThresholds: {
        low: 0.3,
        medium: 0.7,
        high: 0.9,
        critical: 1.0,
      },
      timeWindows: {
        short: 1 * 60 * 60 * 1000, // 1 hour
        medium: 24 * 60 * 60 * 1000, // 24 hours
        long: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      maxFailedAttempts: 5,
      locationAnomalyThreshold: 0.8,
      deviceAnomalyThreshold: 0.7,
      behaviorAnomalyThreshold: 0.6,
      ...config,
    };

    this.initializeFraudPatterns();
  }

  /**
   * Initialize default fraud detection patterns
   */
  private initializeFraudPatterns(): void {
    const defaultPatterns: FraudPattern[] = [
      {
        id: 'high_frequency_failures',
        name: 'High Frequency Authentication Failures',
        description: 'Multiple failed authentication attempts in short time',
        type: 'frequency',
        threshold: 5, // 5 failures in 1 hour
        enabled: true,
        severity: 'high',
      },
      {
        id: 'burst_attempts',
        name: 'Burst Authentication Attempts',
        description: 'Rapid successive authentication attempts',
        type: 'velocity',
        threshold: 10, // 10 attempts in 5 minutes
        enabled: true,
        severity: 'critical',
      },
      {
        id: 'impossible_travel',
        name: 'Impossible Travel',
        description: 'Login from geographically impossible locations',
        type: 'location',
        threshold: 1000, // km/hour
        enabled: true,
        severity: 'critical',
      },
      {
        id: 'new_device_location',
        name: 'New Device and Location',
        description: 'First time login from new device and new location',
        type: 'device',
        threshold: 0.9, // 90% confidence
        enabled: true,
        severity: 'medium',
      },
      {
        id: 'unusual_time',
        name: 'Unusual Login Time',
        description: 'Login outside typical user behavior hours',
        type: 'behavior',
        threshold: 0.7, // 70% confidence
        enabled: true,
        severity: 'low',
      },
      {
        id: 'multiple_locations',
        name: 'Multiple Geographic Locations',
        description: 'Simultaneous logins from different locations',
        type: 'location',
        threshold: 3, // 3+ locations in 1 hour
        enabled: true,
        severity: 'high',
      },
      {
        id: 'account_takeover_pattern',
        name: 'Account Takeover Pattern',
        description: 'Pattern indicative of account takeover attempts',
        type: 'behavior',
        threshold: 0.8, // 80% confidence
        enabled: true,
        severity: 'critical',
      },
    ];

    defaultPatterns.forEach((pattern) => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  /**
   * Analyze security event for fraud patterns
   */
  async analyzeSecurityEvent(event: SecurityEvent): Promise<FraudDetectionResult> {
    const startTime = Date.now();
    const detectedAnomalies: string[] = [];
    const recommendations: string[] = [];
    let totalRiskScore = 0;

    try {
      // Load user behavior profile
      const userProfile = await this.getUserBehaviorProfile(event.userId);

      // Frequency Analysis
      const frequencyRisk = await this.analyzeFrequencyPatterns(event);
      if (frequencyRisk.score > 0) {
        totalRiskScore += frequencyRisk.score * 0.3;
        detectedAnomalies.push(...frequencyRisk.anomalies);
        recommendations.push(...frequencyRisk.recommendations);
      }

      // Location Analysis
      const locationRisk = await this.analyzeLocationPatterns(event, userProfile);
      if (locationRisk.score > 0) {
        totalRiskScore += locationRisk.score * 0.25;
        detectedAnomalies.push(...locationRisk.anomalies);
        recommendations.push(...locationRisk.recommendations);
      }

      // Device Analysis
      const deviceRisk = await this.analyzeDevicePatterns(event, userProfile);
      if (deviceRisk.score > 0) {
        totalRiskScore += deviceRisk.score * 0.2;
        detectedAnomalies.push(...deviceRisk.anomalies);
        recommendations.push(...deviceRisk.recommendations);
      }

      // Behavior Analysis
      const behaviorRisk = await this.analyzeBehaviorPatterns(event, userProfile);
      if (behaviorRisk.score > 0) {
        totalRiskScore += behaviorRisk.score * 0.15;
        detectedAnomalies.push(...behaviorRisk.anomalies);
        recommendations.push(...behaviorRisk.recommendations);
      }

      // Velocity Analysis
      const velocityRisk = await this.analyzeVelocityPatterns(event);
      if (velocityRisk.score > 0) {
        totalRiskScore += velocityRisk.score * 0.1;
        detectedAnomalies.push(...velocityRisk.anomalies);
        recommendations.push(...velocityRisk.recommendations);
      }

      // Cap risk score at 1.0
      totalRiskScore = Math.min(totalRiskScore, 1.0);

      // Determine risk level
      const riskLevel = this.determineRiskLevel(totalRiskScore);

      // Determine if action should be taken
      const shouldBlock = totalRiskScore >= this.config.riskThresholds.critical;
      const requiresReview = totalRiskScore >= this.config.riskThresholds.high;

      // Update user behavior profile for successful events
      if (event.eventType === 'auth_success') {
        await this.updateUserProfile(event, userProfile);
      }

      // Log fraud detection result
      await this.logFraudDetection(event, {
        riskScore: totalRiskScore,
        riskLevel,
        detectedAnomalies,
        shouldBlock,
        requiresReview,
      });

      return {
        riskScore: totalRiskScore,
        riskLevel,
        detectedAnomalies,
        recommendations,
        shouldBlock,
        requiresReview,
        processingTime: Date.now() - startTime,
      };
    } catch (_error) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        detectedAnomalies: [],
        recommendations: [],
        shouldBlock: false,
        requiresReview: false,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze frequency patterns
   */
  private async analyzeFrequencyPatterns(event: SecurityEvent): Promise<{
    score: number;
    anomalies: string[];
    recommendations: string[];
  }> {
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check recent failed attempts
    const { data: recentFailures } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', event.userId)
      .eq('event_type', 'auth_failure')
      .gte('created_at', new Date(Date.now() - this.config.timeWindows.short).toISOString());

    if (recentFailures && recentFailures.length >= this.config.maxFailedAttempts) {
      score += 0.4;
      anomalies.push(`High frequency of failed attempts: ${recentFailures.length} in last hour`);
      recommendations.push('Consider temporary account lockout');
    }

    // Check burst attempts
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: burstAttempts } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', event.userId)
      .gte('created_at', fiveMinutesAgo);

    if (burstAttempts && burstAttempts.length >= 10) {
      score += 0.5;
      anomalies.push(`Burst authentication attempts: ${burstAttempts.length} in 5 minutes`);
      recommendations.push('Implement immediate rate limiting');
    }

    return { score, anomalies, recommendations };
  }

  /**
   * Analyze location patterns
   */
  private async analyzeLocationPatterns(
    event: SecurityEvent,
    userProfile: UserBehaviorProfile
  ): Promise<{
    score: number;
    anomalies: string[];
    recommendations: string[];
  }> {
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    if (!event.location) {
      return { score, anomalies, recommendations };
    }

    // Check if location is known
    const knownLocation = userProfile.knownLocations.find(
      (loc) => loc.country === event.location?.country && loc.city === event.location?.city
    );

    if (!knownLocation) {
      score += 0.3;
      anomalies.push(`New location detected: ${event.location.city}, ${event.location.country}`);
      recommendations.push('Send location verification notification');
    }

    // Check for impossible travel
    const recentLocations = await this.getRecentUserLocations(event.userId);
    for (const recentLocation of recentLocations) {
      const distance = this.calculateDistance(
        event.location.latitude,
        event.location.longitude,
        recentLocation.latitude,
        recentLocation.longitude
      );

      const timeDiff =
        (event.timestamp.getTime() - recentLocation.timestamp.getTime()) / (1000 * 60 * 60); // hours
      const speed = distance / timeDiff;

      const impossibleTravelThreshold =
        this.config.patterns.get('impossible_travel')?.threshold || 1000;
      if (speed > impossibleTravelThreshold) {
        score += 0.8;
        anomalies.push(`Impossible travel detected: ${speed.toFixed(0)} km/hour`);
        recommendations.push('Require additional authentication');
      }
    }

    // Check for multiple locations
    const { data: locationCount } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('user_id', event.userId)
      .gte('created_at', new Date(Date.now() - this.config.timeWindows.short).toISOString());

    if (locationCount) {
      const uniqueLocations = new Set(
        locationCount.map((event) => event.metadata?.location?.city).filter(Boolean)
      ).size;

      if (uniqueLocations >= 3) {
        score += 0.4;
        anomalies.push(`Multiple locations detected: ${uniqueLocations} in 1 hour`);
        recommendations.push('Verify user identity via additional factor');
      }
    }

    return { score, anomalies, recommendations };
  }

  /**
   * Analyze device patterns
   */
  private async analyzeDevicePatterns(
    event: SecurityEvent,
    userProfile: UserBehaviorProfile
  ): Promise<{
    score: number;
    anomalies: string[];
    recommendations: string[];
  }> {
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    if (!event.deviceFingerprint) {
      return { score, anomalies, recommendations };
    }

    // Check if device is known
    const knownDevice = userProfile.knownDevices.find(
      (device) => device.fingerprint === event.deviceFingerprint
    );

    if (!knownDevice) {
      score += 0.2;
      anomalies.push('New device detected');
      recommendations.push('Send device verification notification');
    }

    // Check for new device AND new location combination
    const isNewLocation =
      !event.location ||
      !userProfile.knownLocations.some(
        (loc) => loc.country === event.location?.country && loc.city === event.location?.city
      );

    if (!knownDevice && isNewLocation) {
      score += 0.4;
      anomalies.push('New device and new location combination');
      recommendations.push('Require step-up authentication');
    }

    // Check for multiple devices
    const { data: deviceCount } = await supabase
      .from('security_events')
      .select('device_fingerprint')
      .eq('user_id', event.userId)
      .gte('created_at', new Date(Date.now() - this.config.timeWindows.short).toISOString());

    if (deviceCount) {
      const uniqueDevices = new Set(
        deviceCount.map((event) => event.device_fingerprint).filter(Boolean)
      ).size;

      if (uniqueDevices >= 3) {
        score += 0.3;
        anomalies.push(`Multiple devices detected: ${uniqueDevices} in 1 hour`);
        recommendations.push('Monitor for account sharing or compromise');
      }
    }

    return { score, anomalies, recommendations };
  }

  /**
   * Analyze behavior patterns
   */
  private async analyzeBehaviorPatterns(
    event: SecurityEvent,
    userProfile: UserBehaviorProfile
  ): Promise<{
    score: number;
    anomalies: string[];
    recommendations: string[];
  }> {
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check unusual time
    const currentHour = event.timestamp.getHours();
    const isUnusualTime = !userProfile.typicalBehavior.activeHours.includes(currentHour);

    if (isUnusualTime) {
      score += 0.2;
      anomalies.push(`Login at unusual time: ${currentHour}:00`);
      recommendations.push('Send time-based security notification');
    }

    // Check authentication method changes
    const recentAuthMethods = await this.getRecentAuthMethods(event.userId);
    const authMethod = event.metadata?.authMethod;

    if (authMethod && recentAuthMethods.length > 0) {
      const isDifferentMethod = !recentAuthMethods.includes(authMethod);
      if (isDifferentMethod) {
        score += 0.1;
        anomalies.push(`Different authentication method: ${authMethod}`);
        recommendations.push('Monitor for method switching patterns');
      }
    }

    // Check for account takeover patterns
    const takeoverScore = await this.analyzeAccountTakeoverPatterns(event);
    if (takeoverScore > 0) {
      score += takeoverScore;
      anomalies.push('Account takeover pattern detected');
      recommendations.push('Immediate security review required');
    }

    return { score, anomalies, recommendations };
  }

  /**
   * Analyze velocity patterns
   */
  private async analyzeVelocityPatterns(event: SecurityEvent): Promise<{
    score: number;
    anomalies: string[];
    recommendations: string[];
  }> {
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    // Check rapid successive attempts
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: rapidAttempts } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', event.userId)
      .gte('created_at', oneMinuteAgo);

    if (rapidAttempts && rapidAttempts.length >= 5) {
      score += 0.3;
      anomalies.push(`Rapid successive attempts: ${rapidAttempts.length} in 1 minute`);
      recommendations.push('Implement stricter rate limiting');
    }

    return { score, anomalies, recommendations };
  }

  /**
   * Get user behavior profile
   */
  private async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    // Check cache first
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    // Fetch from database or create default
    const { data: profileData } = await supabase
      .from('user_behavior_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    let profile: UserBehaviorProfile;

    if (profileData) {
      profile = {
        userId: profileData.user_id,
        knownLocations: profileData.known_locations || [],
        knownDevices: profileData.known_devices || [],
        typicalBehavior: profileData.typical_behavior || {
          loginFrequency: 0,
          activeHours: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
          averageSessionDuration: 30,
          preferredAuthMethods: [],
        },
        lastUpdated: new Date(profileData.last_updated),
      };
    } else {
      profile = {
        userId,
        knownLocations: [],
        knownDevices: [],
        typicalBehavior: {
          loginFrequency: 0,
          activeHours: [9, 10, 11, 14, 15, 16, 17, 18, 19, 20],
          averageSessionDuration: 30,
          preferredAuthMethods: [],
        },
        lastUpdated: new Date(),
      };
    }

    this.userProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Update user behavior profile
   */
  private async updateUserProfile(
    event: SecurityEvent,
    profile: UserBehaviorProfile
  ): Promise<void> {
    // Update known locations
    if (event.location) {
      const existingLocation = profile.knownLocations.find(
        (loc) => loc.country === event.location?.country && loc.city === event.location?.city
      );

      if (existingLocation) {
        existingLocation.frequency += 1;
        existingLocation.lastSeen = event.timestamp;
      } else {
        profile.knownLocations.push({
          country: event.location.country,
          city: event.location.city,
          frequency: 1,
          lastSeen: event.timestamp,
        });
      }
    }

    // Update known devices
    if (event.deviceFingerprint) {
      const existingDevice = profile.knownDevices.find(
        (device) => device.fingerprint === event.deviceFingerprint
      );

      if (existingDevice) {
        existingDevice.frequency += 1;
        existingDevice.lastSeen = event.timestamp;
      } else {
        profile.knownDevices.push({
          fingerprint: event.deviceFingerprint,
          userAgent: event.userAgent,
          frequency: 1,
          lastSeen: event.timestamp,
        });
      }
    }

    // Update typical behavior
    const currentHour = event.timestamp.getHours();
    if (!profile.typicalBehavior.activeHours.includes(currentHour)) {
      profile.typicalBehavior.activeHours.push(currentHour);
    }

    profile.lastUpdated = new Date();

    // Update cache and database
    this.userProfiles.set(event.userId, profile);

    await supabase.from('user_behavior_profiles').upsert({
      user_id: profile.userId,
      known_locations: profile.knownLocations,
      known_devices: profile.knownDevices,
      typical_behavior: profile.typicalBehavior,
      last_updated: profile.lastUpdated.toISOString(),
    });
  }

  /**
   * Get recent user locations
   */
  private async getRecentUserLocations(userId: string): Promise<
    Array<{
      latitude: number;
      longitude: number;
      timestamp: Date;
    }>
  > {
    const { data } = await supabase
      .from('security_events')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - this.config.timeWindows.medium).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data) return [];

    return data
      .filter((event) => event.metadata?.location)
      .map((event) => ({
        latitude: event.metadata.location.latitude,
        longitude: event.metadata.location.longitude,
        timestamp: new Date(event.created_at),
      }));
  }

  /**
   * Get recent authentication methods
   */
  private async getRecentAuthMethods(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('security_events')
      .select('metadata')
      .eq('user_id', userId)
      .eq('event_type', 'auth_success')
      .gte('created_at', new Date(Date.now() - this.config.timeWindows.medium).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (!data) return [];

    return data.map((event) => event.metadata?.authMethod).filter(Boolean) as string[];
  }

  /**
   * Analyze account takeover patterns
   */
  private async analyzeAccountTakeoverPatterns(event: SecurityEvent): Promise<number> {
    let score = 0;

    // Multiple failed attempts followed by success from different location/device
    const { data: recentEvents } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', event.userId)
      .gte('created_at', new Date(Date.now() - this.config.timeWindows.short).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentEvents && recentEvents.length >= 3) {
      const failuresBeforeSuccess = recentEvents
        .slice(0, -1)
        .filter((e) => e.event_type === 'auth_failure');
      const lastEvent = recentEvents[0];

      if (failuresBeforeSuccess.length >= 2 && lastEvent.event_type === 'auth_success') {
        // Check if success is from different location/device than failures
        const failureLocation = failuresBeforeSuccess[0]?.metadata?.location;
        const successLocation = lastEvent?.metadata?.location;

        if (
          failureLocation &&
          successLocation &&
          (failureLocation.city !== successLocation.city ||
            failureLocation.country !== successLocation.country)
        ) {
          score += 0.7;
        }
      }
    }

    return score;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Determine risk level from score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= this.config.riskThresholds.critical) return 'critical';
    if (score >= this.config.riskThresholds.high) return 'high';
    if (score >= this.config.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Log fraud detection result
   */
  private async logFraudDetection(
    event: SecurityEvent,
    result: {
      riskScore: number;
      riskLevel: string;
      detectedAnomalies: string[];
      shouldBlock: boolean;
      requiresReview: boolean;
    }
  ): Promise<void> {
    try {
      await supabase.from('fraud_detection_logs').insert({
        user_id: event.userId,
        event_type: event.eventType,
        risk_score: result.riskScore,
        risk_level: result.riskLevel,
        detected_anomalies: result.detectedAnomalies,
        should_block: result.shouldBlock,
        requires_review: result.requiresReview,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        device_fingerprint: event.deviceFingerprint,
        location: event.location,
        metadata: event.metadata,
        created_at: new Date().toISOString(),
      });
    } catch (_error) {}
  }

  /**
   * Add custom fraud pattern
   */
  addPattern(pattern: FraudPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FraudDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): FraudDetectionConfig {
    return { ...this.config };
  }
}

/**
 * Create fraud detection service
 */
export function createFraudDetectionService(
  config?: Partial<FraudDetectionConfig>
): FraudDetectionService {
  return new FraudDetectionService(config);
}
