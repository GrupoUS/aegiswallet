/**
 * @fileoverview Voice assistant and biometrics schema
 * @module db/schema/voice
 */

import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Voice consent - LGPD consent for voice data processing
 */
export const voiceConsent = pgTable('voice_consent', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id').unique().notNull(),
  consentGiven: boolean('consent_given').default(false).notNull(),
  consentDate: timestamp('consent_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Voice feedback - User feedback on voice recognition
 */
export const voiceFeedback = pgTable('voice_feedback', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  sessionId: uuid('session_id'),
  commandText: text('command_text').notNull(),
  recognizedText: text('recognized_text'),
  confidenceScore: numeric('confidence_score'),
  rating: integer('rating'), // 1-5
  feedbackText: text('feedback_text'),
  feedbackType: varchar('feedback_type', { length: 50 }), // accuracy, speed, clarity, language, general
  audioFilePath: text('audio_file_path'),
  transcriptionId: uuid('transcription_id'),
  wasCorrect: boolean('was_correct'),
  correctionMade: text('correction_made'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Voice recordings - Temporary storage with retention policies
 */
export const voiceRecordings = pgTable('voice_recordings', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  sessionId: uuid('session_id'),
  filePath: text('file_path').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  durationMs: integer('duration_ms'),
  format: varchar('format', { length: 20 }).default('webm'),
  sampleRate: integer('sample_rate'),
  channels: integer('channels'),
  transcriptionId: uuid('transcription_id'),
  processed: boolean('processed').default(false),
  retentionExpiresAt: timestamp('retention_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

/**
 * Voice transcriptions - STT results
 */
export const voiceTranscriptions = pgTable('voice_transcriptions', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  audioStoragePath: text('audio_storage_path').notNull(),
  transcript: text('transcript').notNull(),
  confidenceScore: numeric('confidence_score'),
  language: text('language').default('pt-BR'),
  processingTimeMs: integer('processing_time_ms').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Voice audit logs - LGPD compliance
 */
export const voiceAuditLogs = pgTable('voice_audit_logs', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(), // upload, download, delete, access
  audioId: uuid('audio_id').notNull(),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  timestamp: timestamp('timestamp', { withTimezone: true }).default(sql`now()`),
});

/**
 * Biometric patterns - Encrypted voice biometric data
 */
export const biometricPatterns = pgTable('biometric_patterns', {
  id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
  userId: uuid('user_id').notNull(),
  patternData: jsonb('pattern_data').notNull(),
  modelVersion: varchar('model_version', { length: 50 }),
  confidenceThreshold: numeric('confidence_threshold').default(sql`0.85`),
  isActive: boolean('is_active').default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  anonymizedAt: timestamp('anonymized_at', { withTimezone: true }),
});

// Type exports
export type VoiceConsent = typeof voiceConsent.$inferSelect;
export type VoiceFeedback = typeof voiceFeedback.$inferSelect;
export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type VoiceTranscription = typeof voiceTranscriptions.$inferSelect;
export type BiometricPattern = typeof biometricPatterns.$inferSelect;
