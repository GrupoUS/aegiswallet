/**
 * @fileoverview Payments schema - PIX, boletos, scheduled payments
 * @module db/schema/payments
 */
/**
 * PIX keys registered by users
 */
export declare const pixKeys: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'pix_keys';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'pix_keys';
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
        tableName: 'pix_keys';
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
    keyType: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'key_type';
        tableName: 'pix_keys';
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
    keyValue: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'key_value';
        tableName: 'pix_keys';
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
    label: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'label';
        tableName: 'pix_keys';
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
    isFavorite: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'is_favorite';
        tableName: 'pix_keys';
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
    isActive: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'is_active';
        tableName: 'pix_keys';
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
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at';
        tableName: 'pix_keys';
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
        tableName: 'pix_keys';
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
 * Payment rules for autonomous payments
 */
export declare const paymentRules: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'payment_rules';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'payment_rules';
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
        tableName: 'payment_rules';
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
    payeeName: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payee_name';
        tableName: 'payment_rules';
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
    payeeType: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payee_type';
        tableName: 'payment_rules';
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
    payeeKey: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payee_key';
        tableName: 'payment_rules';
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
    maxAmount: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'max_amount';
        tableName: 'payment_rules';
        dataType: 'string';
        columnType: 'PgNumeric';
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
    tolerancePercentage: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'tolerance_percentage';
        tableName: 'payment_rules';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
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
    preferredTime: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'preferred_time';
        tableName: 'payment_rules';
        dataType: 'string';
        columnType: 'PgTime';
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
    autonomyLevel: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'autonomy_level';
        tableName: 'payment_rules';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
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
    category: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'category';
        tableName: 'payment_rules';
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
    description: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'description';
        tableName: 'payment_rules';
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
    metadata: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'metadata';
        tableName: 'payment_rules';
        dataType: 'json';
        columnType: 'PgJsonb';
        data: unknown;
        driverParam: unknown;
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
    isActive: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'is_active';
        tableName: 'payment_rules';
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
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at';
        tableName: 'payment_rules';
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
        tableName: 'payment_rules';
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
 * Scheduled payments for autonomous execution
 */
export declare const scheduledPayments: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'scheduled_payments';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'scheduled_payments';
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
        tableName: 'scheduled_payments';
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
    ruleId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'rule_id';
        tableName: 'scheduled_payments';
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
    payeeName: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payee_name';
        tableName: 'scheduled_payments';
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
    payeeKey: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payee_key';
        tableName: 'scheduled_payments';
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
    amount: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'amount';
        tableName: 'scheduled_payments';
        dataType: 'string';
        columnType: 'PgNumeric';
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
    paymentType: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payment_type';
        tableName: 'scheduled_payments';
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
    dueDate: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'due_date';
        tableName: 'scheduled_payments';
        dataType: 'string';
        columnType: 'PgDateString';
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
    scheduledTime: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'scheduled_time';
        tableName: 'scheduled_payments';
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
    status: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'status';
        tableName: 'scheduled_payments';
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
    executionAttempts: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'execution_attempts';
        tableName: 'scheduled_payments';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
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
    maxAttempts: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'max_attempts';
        tableName: 'scheduled_payments';
        dataType: 'number';
        columnType: 'PgInteger';
        data: number;
        driverParam: string | number;
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
    lastAttemptAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'last_attempt_at';
        tableName: 'scheduled_payments';
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
    executedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'executed_at';
        tableName: 'scheduled_payments';
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
    errorCode: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'error_code';
        tableName: 'scheduled_payments';
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
    errorMessage: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'error_message';
        tableName: 'scheduled_payments';
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
    requiresApproval: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'requires_approval';
        tableName: 'scheduled_payments';
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
    approvedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'approved_at';
        tableName: 'scheduled_payments';
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
    approvedBy: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'approved_by';
        tableName: 'scheduled_payments';
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
    approvalMethod: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'approval_method';
        tableName: 'scheduled_payments';
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
    transactionId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'transaction_id';
        tableName: 'scheduled_payments';
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
    metadata: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'metadata';
        tableName: 'scheduled_payments';
        dataType: 'json';
        columnType: 'PgJsonb';
        data: unknown;
        driverParam: unknown;
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
        tableName: 'scheduled_payments';
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
        tableName: 'scheduled_payments';
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
 * PIX transfers initiated by user
 */
export declare const pixTransfers: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'pix_transfers';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'pix_transfers';
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
        tableName: 'pix_transfers';
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
    pixKey: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'pix_key';
        tableName: 'pix_transfers';
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
    pixKeyType: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'pix_key_type';
        tableName: 'pix_transfers';
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
    recipientName: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'recipient_name';
        tableName: 'pix_transfers';
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
    recipientDocument: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'recipient_document';
        tableName: 'pix_transfers';
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
    recipientBank: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'recipient_bank';
        tableName: 'pix_transfers';
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
    amount: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'amount';
        tableName: 'pix_transfers';
        dataType: 'string';
        columnType: 'PgNumeric';
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
    description: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'description';
        tableName: 'pix_transfers';
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
    status: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'status';
        tableName: 'pix_transfers';
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
    initiationMethod: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'initiation_method';
        tableName: 'pix_transfers';
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
    requiresConfirmation: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'requires_confirmation';
        tableName: 'pix_transfers';
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
    confirmedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'confirmed_at';
        tableName: 'pix_transfers';
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
    confirmationMethod: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'confirmation_method';
        tableName: 'pix_transfers';
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
    executedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'executed_at';
        tableName: 'pix_transfers';
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
    transactionId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'transaction_id';
        tableName: 'pix_transfers';
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
    endToEndId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'end_to_end_id';
        tableName: 'pix_transfers';
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
    metadata: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'metadata';
        tableName: 'pix_transfers';
        dataType: 'json';
        columnType: 'PgJsonb';
        data: unknown;
        driverParam: unknown;
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
        tableName: 'pix_transfers';
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
        tableName: 'pix_transfers';
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
 * Boletos - Brazilian bank slips
 */
export declare const boletos: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'boletos';
  schema: undefined;
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id';
        tableName: 'boletos';
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
        tableName: 'boletos';
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
    barcode: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'barcode';
        tableName: 'boletos';
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
    digitableLine: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'digitable_line';
        tableName: 'boletos';
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
    payeeName: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payee_name';
        tableName: 'boletos';
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
    payeeDocument: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payee_document';
        tableName: 'boletos';
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
    amount: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'amount';
        tableName: 'boletos';
        dataType: 'string';
        columnType: 'PgNumeric';
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
    dueDate: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'due_date';
        tableName: 'boletos';
        dataType: 'string';
        columnType: 'PgDateString';
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
    discountAmount: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'discount_amount';
        tableName: 'boletos';
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
    interestAmount: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'interest_amount';
        tableName: 'boletos';
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
    fineAmount: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'fine_amount';
        tableName: 'boletos';
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
    status: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'status';
        tableName: 'boletos';
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
    captureMethod: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'capture_method';
        tableName: 'boletos';
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
    scheduledPaymentId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'scheduled_payment_id';
        tableName: 'boletos';
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
    paidAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'paid_at';
        tableName: 'boletos';
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
    paymentConfirmation: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'payment_confirmation';
        tableName: 'boletos';
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
    metadata: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'metadata';
        tableName: 'boletos';
        dataType: 'json';
        columnType: 'PgJsonb';
        data: unknown;
        driverParam: unknown;
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
        tableName: 'boletos';
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
        tableName: 'boletos';
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
export type PixKey = typeof pixKeys.$inferSelect;
export type PaymentRule = typeof paymentRules.$inferSelect;
export type ScheduledPayment = typeof scheduledPayments.$inferSelect;
export type PixTransfer = typeof pixTransfers.$inferSelect;
export type Boleto = typeof boletos.$inferSelect;
