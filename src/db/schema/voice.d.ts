/**
 * @fileoverview Voice assistant and biometrics schema
 * @module db/schema/voice
 */
/**
 * Voice consent - LGPD consent for voice data processing
 */
export declare const voiceConsent: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'voice_consent';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'voice_consent';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    userId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'user_id';
        tableName: 'voice_consent';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    consentGiven: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'consent_given';
        tableName: 'voice_consent';
        dataType: 'boolean';
        columnType: 'PgBoolean';
        data: boolean;
        driverParam: boolean;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    consentDate: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'consent_date';
        tableName: 'voice_consent';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at';
        tableName: 'voice_consent';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at';
        tableName: 'voice_consent';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
  };
  dialect: 'pg';
}>;
/**
 * Voice feedback - User feedback on voice recognition
 */
export declare const voiceFeedback: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'voice_feedback';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    userId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'user_id';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    sessionId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'session_id';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    commandText: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'command_text';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    recognizedText: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'recognized_text';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    confidenceScore: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'confidence_score';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgNumeric';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    rating: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'rating';
        tableName: 'voice_feedback';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    feedbackText: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'feedback_text';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    feedbackType: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'feedback_type';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgVarchar';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {
        length: 50;
      }
    >;
    audioFilePath: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'audio_file_path';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    transcriptionId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'transcription_id';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    wasCorrect: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'was_correct';
        tableName: 'voice_feedback';
        dataType: 'boolean';
        columnType: 'PgBoolean';
        data: boolean;
        driverParam: boolean;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    correctionMade: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'correction_made';
        tableName: 'voice_feedback';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at';
        tableName: 'voice_feedback';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
  };
  dialect: 'pg';
}>;
/**
 * Voice recordings - Temporary storage with retention policies
 */
export declare const voiceRecordings: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'voice_recordings';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'voice_recordings';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    userId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'user_id';
        tableName: 'voice_recordings';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    sessionId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'session_id';
        tableName: 'voice_recordings';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    filePath: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'file_path';
        tableName: 'voice_recordings';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    fileSize: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'file_size';
        tableName: 'voice_recordings';
        dataType: 'number';
        columnType: 'PgBigInt53';
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    durationMs: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'duration_ms';
        tableName: 'voice_recordings';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    format: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'format';
        tableName: 'voice_recordings';
        dataType: 'string';
        columnType: 'PgVarchar';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {
        length: 20;
      }
    >;
    sampleRate: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'sample_rate';
        tableName: 'voice_recordings';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    channels: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'channels';
        tableName: 'voice_recordings';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    transcriptionId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'transcription_id';
        tableName: 'voice_recordings';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    processed: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'processed';
        tableName: 'voice_recordings';
        dataType: 'boolean';
        columnType: 'PgBoolean';
        data: boolean;
        driverParam: boolean;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    retentionExpiresAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'retention_expires_at';
        tableName: 'voice_recordings';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at';
        tableName: 'voice_recordings';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    deletedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'deleted_at';
        tableName: 'voice_recordings';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
  };
  dialect: 'pg';
}>;
/**
 * Voice transcriptions - STT results
 */
export declare const voiceTranscriptions: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'voice_transcriptions';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'voice_transcriptions';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    userId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'user_id';
        tableName: 'voice_transcriptions';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    audioStoragePath: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'audio_storage_path';
        tableName: 'voice_transcriptions';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    transcript: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'transcript';
        tableName: 'voice_transcriptions';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    confidenceScore: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'confidence_score';
        tableName: 'voice_transcriptions';
        dataType: 'string';
        columnType: 'PgNumeric';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    language: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'language';
        tableName: 'voice_transcriptions';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    processingTimeMs: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'processing_time_ms';
        tableName: 'voice_transcriptions';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    expiresAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'expires_at';
        tableName: 'voice_transcriptions';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at';
        tableName: 'voice_transcriptions';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at';
        tableName: 'voice_transcriptions';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
  };
  dialect: 'pg';
}>;
/**
 * Voice audit logs - LGPD compliance
 */
export declare const voiceAuditLogs: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'voice_audit_logs';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'voice_audit_logs';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    userId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'user_id';
        tableName: 'voice_audit_logs';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    action: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'action';
        tableName: 'voice_audit_logs';
        dataType: 'string';
        columnType: 'PgText';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    audioId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'audio_id';
        tableName: 'voice_audit_logs';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    metadata: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'metadata';
        tableName: 'voice_audit_logs';
        dataType: 'json';
        columnType: 'PgJsonb';
        data: unknown;
        driverParam: unknown;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    timestamp: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'timestamp';
        tableName: 'voice_audit_logs';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
  };
  dialect: 'pg';
}>;
/**
 * Biometric patterns - Encrypted voice biometric data
 */
export declare const biometricPatterns: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'biometric_patterns';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'biometric_patterns';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: true;
        isPrimaryKey: true;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    userId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'user_id';
        tableName: 'biometric_patterns';
        dataType: 'string';
        columnType: 'PgUUID';
        data: string;
        driverParam: string;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    patternData: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'pattern_data';
        tableName: 'biometric_patterns';
        dataType: 'json';
        columnType: 'PgJsonb';
        data: unknown;
        driverParam: unknown;
        notNull: true;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    modelVersion: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'model_version';
        tableName: 'biometric_patterns';
        dataType: 'string';
        columnType: 'PgVarchar';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: [string, ...string[]];
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {
        length: 50;
      }
    >;
    confidenceThreshold: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'confidence_threshold';
        tableName: 'biometric_patterns';
        dataType: 'string';
        columnType: 'PgNumeric';
        data: string;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    isActive: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'is_active';
        tableName: 'biometric_patterns';
        dataType: 'boolean';
        columnType: 'PgBoolean';
        data: boolean;
        driverParam: boolean;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    lastUsedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'last_used_at';
        tableName: 'biometric_patterns';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at';
        tableName: 'biometric_patterns';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at';
        tableName: 'biometric_patterns';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: true;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    deletedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'deleted_at';
        tableName: 'biometric_patterns';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
    anonymizedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'anonymized_at';
        tableName: 'biometric_patterns';
        dataType: 'date';
        columnType: 'PgTimestamp';
        data: Date;
        driverParam: string;
        notNull: false;
        hasDefault: false;
        isPrimaryKey: false;
        isAutoincrement: false;
        hasRuntimeDefault: false;
        enumValues: undefined;
        baseColumn: never;
        identity: undefined;
        generated: undefined;
      },
      {},
      {}
    >;
  };
  dialect: 'pg';
}>;
export type VoiceConsent = typeof voiceConsent.$inferSelect;
export type VoiceFeedback = typeof voiceFeedback.$inferSelect;
export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type VoiceTranscription = typeof voiceTranscriptions.$inferSelect;
export type BiometricPattern = typeof biometricPatterns.$inferSelect;
