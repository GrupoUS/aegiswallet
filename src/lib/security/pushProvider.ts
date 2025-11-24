/**
 * Web Push Provider - Story 01.04
 *
 * Web Push notification system for authentication and security alerts
 * VAPID authentication with LGPD compliance
 */

import { supabase } from '@/integrations/supabase/client';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
interface JsonObject { [key: string]: JsonValue }

export interface PushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
  gcmApiKey?: string;
  ttl: number;
  urgency: 'very-low' | 'low' | 'normal' | 'high';
}

interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushMessage {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  url?: string;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  processingTime: number;
}

export interface AuthPushRequest {
  id: string;
  userId: string;
  pushToken: string;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  createdAt: Date;
  respondedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Web Push Provider Service
 */
export class PushProvider {
  private config: PushConfig;
  private subscriptions: Map<string, StoredPushSubscription> = new Map();

  constructor(config: PushConfig) {
    this.config = config;
    this.initializeServiceWorker();
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (_error) {}
  }

  /**
   * Convert base64 URL to Uint8Array
   */
  private base64UrlToUint8Array(base64UrlData: string): Uint8Array {
    const padding = '='.repeat((4 - (base64UrlData.length % 4)) % 4);
    const base64 = (base64UrlData + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const buffer = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      buffer[i] = rawData.charCodeAt(i);
    }
    return buffer;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<StoredPushSubscription | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    const registration = await navigator.serviceWorker.ready;
    const serverKey = this.base64UrlToUint8Array(this.config.vapidPublicKey);
    const normalizedServerKey =
      serverKey.buffer instanceof ArrayBuffer ? serverKey.buffer : serverKey.slice().buffer;
    const subscription = await registration.pushManager.subscribe({
      applicationServerKey: normalizedServerKey,
      userVisibleOnly: true,
    });

    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.keys?.auth || !subscriptionJson.keys?.p256dh) {
      throw new Error('Push subscription keys are missing');
    }

    // Store subscription in database
    await supabase.from('push_subscriptions').upsert({
      auth_key: subscriptionJson.keys.auth,
      created_at: new Date().toISOString(),
      endpoint: subscription.endpoint,
      is_active: true,
      p256dh_key: subscriptionJson.keys.p256dh,
      updated_at: new Date().toISOString(),
      user_id: userId,
    });

    const stored: StoredPushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        auth: subscriptionJson.keys.auth,
        p256dh: subscriptionJson.keys.p256dh,
      },
    };

    this.subscriptions.set(userId, stored);
    return stored;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    try {
        this.subscriptions.delete(userId);

      // Deactivate in database
      await supabase.from('push_subscriptions').update({ is_active: false }).eq('user_id', userId);

      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get user's subscription
   */
  async getUserSubscription(userId: string): Promise<StoredPushSubscription | null> {
    // Check in-memory cache first
    if (this.subscriptions.has(userId)) {
      return this.subscriptions.get(userId) as StoredPushSubscription;
    }

    // Fetch from database
    const { data } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (data) {
      const subscription: StoredPushSubscription = {
        endpoint: data.endpoint,
        keys: {
          auth: data.auth_key,
          p256dh: data.p256dh_key,
        },
      };
      this.subscriptions.set(userId, subscription);
      return subscription;
    }

    return null;
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId: string, message: PushMessage): Promise<PushResult> {
    const startTime = Date.now();

    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return {
          error: 'No active push subscription found',
          processingTime: Date.now() - startTime,
          success: false,
        };
      }

      const sanitizedData = this.sanitizeData(message.data) ?? {};

      // Prepare payload
      const payload = JSON.stringify({
        actions: message.actions,
        badge: message.badge || '/badge-72x72.png',
        body: message.body,
        data: {
          ...sanitizedData,
          url: message.url || '/',
          timestamp: Date.now(),
        },
        icon: message.icon || '/icon-192x192.png',
        image: message.image,
        requireInteraction: message.requireInteraction || false,
        silent: message.silent || false,
        tag: message.tag,
        title: message.title,
      });

      // Send via backend API
      const response = await fetch('/api/push/send', {
        body: JSON.stringify({
          options: {
            ttl: this.config.ttl,
            urgency: this.config.urgency,
            vapidDetails: {
              privateKey: this.config.vapidPrivateKey,
              publicKey: this.config.vapidPublicKey,
              subject: this.config.vapidSubject,
            },
          },
          payload,
          subscription,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Push notification failed');
      }

      const data = await response.json();

      // Log push notification
      await this.logPushNotification(userId, message, data.messageId, 'sent');

      return {
        messageId: data.messageId,
        processingTime: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed push notification
      await this.logPushNotification(userId, message, undefined, 'failed', errorMessage);

      return {
        error: errorMessage,
        processingTime: Date.now() - startTime,
        success: false,
      };
    }
  }

  /**
   * Log push notification to database for LGPD compliance
   */
  private async logPushNotification(
    userId: string,
    message: PushMessage,
    messageId?: string,
    status: 'sent' | 'failed' | 'delivered' = 'sent',
    error?: string
  ): Promise<void> {
    try {
      const serializedData = this.sanitizeData(message.data);

      await supabase.from('push_logs').insert({
        created_at: new Date().toISOString(),
        data: serializedData,
        error,
        message_body: message.body,
        message_id: messageId,
        message_title: message.title,
        status,
        tag: message.tag,
        user_id: userId,
      });
    } catch (_logError) {}
  }

  /**
   * Create authentication push request
   */
  async createAuthPushRequest(userId: string): Promise<AuthPushRequest> {
    const pushToken = this.generateSecureToken(16);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const request: AuthPushRequest = {
      createdAt: new Date(),
      expiresAt,
      id: this.generateSecureToken(8),
      pushToken,
      status: 'pending',
      userId,
    };

    // Store in database
    await supabase.from('push_auth_requests').insert({
      created_at: request.createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      id: request.id,
      push_token: pushToken,
      status: 'pending',
      user_id: userId,
    });

    return request;
  }

  /**
   * Send authentication push notification
   */
  async sendAuthPush(userId: string, phoneNumber: string): Promise<PushResult> {
    try {
      const authRequest = await this.createAuthPushRequest(userId);

      const message: PushMessage = {
        actions: [
          {
            action: 'approve',
            icon: '/icons/checkmark.png',
            title: 'Aprovar',
          },
          {
            action: 'deny',
            icon: '/icons/close.png',
            title: 'Negar',
          },
        ],
        badge: '/badge-72x72.png',
        body: 'Nova tentativa de login detectada. Aprove ou negue para continuar.',
        data: {
          phoneNumber,
          requestId: authRequest.id,
          type: 'auth-request',
        },
        icon: '/icon-192x192.png',
        requireInteraction: true,
        tag: 'auth-request',
        title: 'AegisWallet - Aprovação de Login',
      };

      return this.sendPushNotification(userId, message);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: 0,
        success: false,
      };
    }
  }

  /**
   * Handle push notification response
   */
  async handlePushResponse(requestId: string, approved: boolean, userId: string): Promise<void> {
    try {
      // Update request status
      await supabase
        .from('push_auth_requests')
        .update({
          responded_at: new Date().toISOString(),
          status: approved ? 'approved' : 'denied',
        })
        .eq('id', requestId);

      // Log response
      await this.logPushNotification(
        userId,
        {
          body: `Authentication ${approved ? 'approved' : 'denied'}`,
          data: { approved, requestId },
          title: 'Auth Response',
        },
        undefined,
        'delivered'
      );
    } catch (_error) {}
  }

  private sanitizeData(data?: Record<string, unknown>): JsonObject | null {
    if (!data) {
      return null;
    }

    const result: JsonObject = {};
    for (const [key, value] of Object.entries(data)) {
      const jsonValue = this.toJsonValue(value);
      if (jsonValue !== undefined) {
        result[key] = jsonValue;
      }
    }
    return result;
  }

  private toJsonValue(value: unknown): JsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      const arrayValues = value
        .map((item) => this.toJsonValue(item))
        .filter((item): item is JsonValue => item !== undefined);
      return arrayValues;
    }

    if (typeof value === 'object') {
      const record: JsonObject = {};
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        const jsonValue = this.toJsonValue(nestedValue);
        if (jsonValue !== undefined) {
          record[nestedKey] = jsonValue;
        }
      }
      return record;
    }

    return String(value);
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);

    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomValues);
    } else {
      for (let i = 0; i < length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
    }

    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }

    return result;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PushConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PushConfig {
    return { ...this.config };
  }

  /**
   * Clean up expired push requests
   */
  async cleanupExpiredRequests(): Promise<void> {
    try {
      await supabase
        .from('push_auth_requests')
        .update({ status: 'expired' })
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'pending');
    } catch (_error) {}
  }
}

/**
 * Create push provider instance
 */
export function createPushProvider(config: PushConfig): PushProvider {
  return new PushProvider(config);
}

/**
 * Quick auth push function
 */
export async function sendAuthPushNotification(
  userId: string,
  phoneNumber: string,
  config: PushConfig
): Promise<PushResult> {
  const provider = createPushProvider(config);
  return provider.sendAuthPush(userId, phoneNumber);
}
