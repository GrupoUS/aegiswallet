/**
 * LGPD-Compliant Audio Storage Service
 *
 * Features:
 * - Encrypted audio storage in Supabase
 * - Row Level Security (RLS) enforcement
 * - Automatic retention policy (12 months)
 * - Audit logging for compliance
 * - User consent management
 *
 * @module audioStorage
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EncryptedData } from '@/lib/security/audioEncryption';
import { AudioEncryptionService } from '@/lib/security/audioEncryption';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AudioStorageConfig {
  supabase: SupabaseClient;
  encryptionService: AudioEncryptionService;
  bucketName?: string;
  retentionDays?: number;
}

export interface StoredAudio {
  id: string;
  userId: string;
  storagePath: string;
  transcript: string;
  confidence: number;
  language: string;
  processingTimeMs: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface UserConsent {
  userId: string;
  consentGiven: boolean;
  consentDate: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: 'upload' | 'download' | 'delete' | 'access';
  audioId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Audio Storage Service
// ============================================================================

export class AudioStorageService {
  private config: Required<AudioStorageConfig>;

  constructor(config: AudioStorageConfig) {
    this.config = {
      bucketName: config.bucketName || 'voice-recordings',
      encryptionService: config.encryptionService,
      retentionDays: config.retentionDays || 365,
      supabase: config.supabase, // 12 months
    };
  }

  /**
   * Store audio with encryption and metadata
   *
   * @param userId - User ID
   * @param audioBlob - Audio data
   * @param transcript - Transcription text
   * @param metadata - Additional metadata
   * @returns Stored audio record
   */
  async storeAudio(
    userId: string,
    audioBlob: Blob,
    transcript: string,
    metadata: {
      confidence: number;
      language: string;
      processingTimeMs: number;
    }
  ): Promise<StoredAudio> {
    try {
      // Check user consent
      const hasConsent = await this.checkConsent(userId);
      if (!hasConsent) {
        throw new Error('User consent required for audio storage');
      }

      // Encrypt audio
      const encryptedAudio = await this.config.encryptionService.encryptAudio(audioBlob);

      // Anonymize transcript
      const anonymizedTranscript = AudioEncryptionService.anonymizeText(transcript);

      // Encrypt transcript
      const encryptedTranscript =
        await this.config.encryptionService.encryptText(anonymizedTranscript);

      // Generate storage path
      const audioId = crypto.randomUUID();
      const storagePath = `${userId}/${audioId}.enc`;

      // Upload encrypted audio to Supabase Storage
      const { error: uploadError } = await this.config.supabase.storage
        .from(this.config.bucketName)
        .upload(storagePath, JSON.stringify(encryptedAudio), {
          contentType: 'application/json',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.config.retentionDays);

      // Store metadata in database
      const { data, error: dbError } = await this.config.supabase
        .from('voice_transcriptions')
        .insert({
          audio_storage_path: storagePath,
          confidence_score: metadata.confidence,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          id: audioId,
          language: metadata.language,
          processing_time_ms: metadata.processingTimeMs,
          transcript: JSON.stringify(encryptedTranscript),
          user_id: userId,
        })
        .select()
        .single();

      if (dbError) {
        // Cleanup uploaded file
        await this.config.supabase.storage.from(this.config.bucketName).remove([storagePath]);

        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      // Log audit trail
      await this.logAudit(userId, 'upload', audioId, {
        confidence: metadata.confidence,
        storagePath,
      });

      return {
        confidence: metadata.confidence,
        createdAt: new Date(data.created_at),
        expiresAt,
        id: audioId,
        language: metadata.language,
        processingTimeMs: metadata.processingTimeMs,
        storagePath,
        transcript: anonymizedTranscript,
        userId,
      };
    } catch (error) {
      throw new Error(`Audio storage failed: ${error}`, { cause: error });
    }
  }

  /**
   * Retrieve and decrypt audio
   *
   * @param userId - User ID
   * @param audioId - Audio record ID
   * @returns Decrypted audio blob
   */
  async retrieveAudio(userId: string, audioId: string): Promise<Blob> {
    try {
      // Get metadata from database
      const { data, error: dbError } = await this.config.supabase
        .from('voice_transcriptions')
        .select('*')
        .eq('id', audioId)
        .eq('user_id', userId)
        .single();

      if (dbError || !data) {
        throw new Error('Audio not found or access denied');
      }

      // Download encrypted audio
      const { data: fileData, error: downloadError } = await this.config.supabase.storage
        .from(this.config.bucketName)
        .download(data.audio_storage_path);

      if (downloadError || !fileData) {
        throw new Error(`Download failed: ${downloadError?.message}`);
      }

      // Parse encrypted data
      const encryptedText = await fileData.text();
      const encryptedData: EncryptedData = JSON.parse(encryptedText);

      // Decrypt audio
      const audioBlob = await this.config.encryptionService.decryptAudio(encryptedData);

      // Log audit trail
      await this.logAudit(userId, 'download', audioId);

      return audioBlob;
    } catch (error) {
      throw new Error(`Audio retrieval failed: ${error}`, { cause: error });
    }
  }

  /**
   * Delete audio and metadata
   *
   * @param userId - User ID
   * @param audioId - Audio record ID
   */
  async deleteAudio(userId: string, audioId: string): Promise<void> {
    try {
      // Get metadata
      const { data, error: dbError } = await this.config.supabase
        .from('voice_transcriptions')
        .select('audio_storage_path')
        .eq('id', audioId)
        .eq('user_id', userId)
        .single();

      if (dbError || !data) {
        throw new Error('Audio not found or access denied');
      }

      // Delete from storage
      const { error: storageError } = await this.config.supabase.storage
        .from(this.config.bucketName)
        .remove([data.audio_storage_path]);

      if (storageError) {
      }

      // Delete from database
      const { error: deleteError } = await this.config.supabase
        .from('voice_transcriptions')
        .delete()
        .eq('id', audioId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Database deletion failed: ${deleteError.message}`);
      }

      // Log audit trail
      await this.logAudit(userId, 'delete', audioId);
    } catch (error) {
      throw new Error(`Audio deletion failed: ${error}`, { cause: error });
    }
  }

  /**
   * Check if user has given consent for audio storage
   */
  async checkConsent(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.config.supabase
        .from('voice_consent')
        .select('consent_given')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.consent_given === true;
    } catch {
      return false;
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(userId: string, consentGiven: boolean): Promise<void> {
    try {
      const { error } = await this.config.supabase.from('voice_consent').upsert({
        consent_date: new Date().toISOString(),
        consent_given: consentGiven,
        updated_at: new Date().toISOString(),
        user_id: userId,
      });

      if (error) {
        throw new Error(`Consent recording failed: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Consent recording failed: ${error}`, { cause: error });
    }
  }

  /**
   * Log audit trail for compliance
   */
  private async logAudit(
    userId: string,
    action: AuditLog['action'],
    audioId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.config.supabase.from('voice_audit_logs').insert({
        action,
        audio_id: audioId,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
        user_id: userId,
      });
    } catch (_error) {}
  }

  /**
   * Cleanup expired audio files (run periodically)
   */
  async cleanupExpiredAudio(): Promise<number> {
    try {
      // Get expired records
      const { data: expiredRecords, error: queryError } = await this.config.supabase
        .from('voice_transcriptions')
        .select('id, user_id, audio_storage_path')
        .lt('expires_at', new Date().toISOString());

      if (queryError || !expiredRecords) {
        throw new Error(`Query failed: ${queryError?.message}`);
      }

      let deletedCount = 0;

      // Delete each expired record
      for (const record of expiredRecords) {
        try {
          await this.deleteAudio(record.user_id, record.id);
          deletedCount++;
        } catch (_error) {}
      }

      return deletedCount;
    } catch (error) {
      throw new Error(`Cleanup failed: ${error}`, { cause: error });
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create audio storage service
 */
export function createAudioStorageService(
  supabase: SupabaseClient,
  encryptionService: AudioEncryptionService
): AudioStorageService {
  return new AudioStorageService({
    bucketName: 'voice-recordings',
    encryptionService,
    retentionDays: 365,
    supabase, // 12 months LGPD compliance
  });
}
