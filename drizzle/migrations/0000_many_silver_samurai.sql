CREATE TYPE "public"."boleto_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."collection_method" AS ENUM('signup', 'settings', 'settings_toggle', 'prompt', 'api', 'import', 'explicit_form', 'terms_acceptance', 'voice_command');--> statement-breakpoint
CREATE TYPE "public"."compliance_event_type" AS ENUM('consent_granted', 'consent_revoked', 'data_export_requested', 'data_export_completed', 'data_deletion_requested', 'data_deletion_completed', 'data_accessed', 'data_modified', 'limit_updated', 'policy_acknowledged');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('data_processing', 'marketing', 'analytics', 'third_party', 'third_party_sharing', 'voice_data', 'voice_recording', 'biometric', 'financial_data', 'location', 'open_banking');--> statement-breakpoint
CREATE TYPE "public"."deletion_request_status" AS ENUM('pending', 'verified', 'approved', 'processing', 'completed', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."deletion_request_type" AS ENUM('full_account', 'full_deletion', 'specific_data', 'anonymization', 'partial_deletion', 'consent_withdrawal');--> statement-breakpoint
CREATE TYPE "public"."export_format" AS ENUM('json', 'csv', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."export_request_type" AS ENUM('full_data', 'full_export', 'transactions', 'profile', 'consents', 'audit_logs', 'financial_only', 'voice_commands', 'specific_period');--> statement-breakpoint
CREATE TYPE "public"."export_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."limit_type" AS ENUM('pix_daily', 'pix_daytime', 'pix_nighttime', 'pix_transaction', 'pix_total_daily', 'boleto_daily', 'ted_daily', 'transfer_daily', 'withdrawal_daily', 'total_daily', 'total_monthly');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('PIX', 'BANK_ACCOUNT', 'BOLETO');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('succeeded', 'failed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."pix_key_type" AS ENUM('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM');--> statement-breakpoint
CREATE TYPE "public"."pix_transaction_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."pix_transaction_type_enum" AS ENUM('sent', 'received', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('free', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');--> statement-breakpoint
CREATE TABLE "account_balance_history" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text,
	"balance" numeric(15, 2) NOT NULL,
	"available_balance" numeric(15, 2),
	"recorded_at" timestamp with time zone DEFAULT now(),
	"source" text DEFAULT 'sync'
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"insight_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"recommendation" text,
	"impact_level" text DEFAULT 'medium',
	"category_id" text,
	"data" jsonb,
	"is_read" boolean DEFAULT false,
	"is_actioned" boolean DEFAULT false,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"rule_name" text NOT NULL,
	"rule_type" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"session_id" text,
	"success" boolean DEFAULT true,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"belvo_account_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"institution_name" text NOT NULL,
	"account_type" text NOT NULL,
	"account_number" text,
	"account_mask" text NOT NULL,
	"account_holder_name" text,
	"balance" numeric(15, 2) DEFAULT '0',
	"available_balance" numeric(15, 2) DEFAULT '0',
	"currency" text DEFAULT 'BRL',
	"is_active" boolean DEFAULT true,
	"is_primary" boolean DEFAULT false,
	"last_sync" timestamp with time zone,
	"sync_status" text DEFAULT 'pending',
	"sync_error_message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "bank_accounts_belvo_account_id_unique" UNIQUE("belvo_account_id")
);
--> statement-breakpoint
CREATE TABLE "bank_sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"account_id" text,
	"sync_type" text NOT NULL,
	"status" text NOT NULL,
	"records_synced" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "boleto_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"boleto_id" text,
	"amount" numeric(15, 2) NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now(),
	"payment_method" text NOT NULL,
	"transaction_id" text,
	"status" text DEFAULT 'processing',
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "boletos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"barcode" text NOT NULL,
	"line_id_digitable" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"due_date" date NOT NULL,
	"beneficiary_name" text NOT NULL,
	"beneficiary_cnpj" text,
	"description" text,
	"status" text DEFAULT 'pending',
	"payment_date" timestamp with time zone,
	"paid_amount" numeric(15, 2),
	"paid_with" text,
	"transaction_id" text,
	"fine_amount" numeric(15, 2) DEFAULT '0',
	"interest_amount" numeric(15, 2) DEFAULT '0',
	"discount_amount" numeric(15, 2) DEFAULT '0',
	"pdf_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "boletos_barcode_unique" UNIQUE("barcode"),
	CONSTRAINT "boletos_line_id_digitable_unique" UNIQUE("line_id_digitable")
);
--> statement-breakpoint
CREATE TABLE "budget_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"category_id" text,
	"budget_amount" numeric(15, 2) NOT NULL,
	"period_type" text NOT NULL,
	"alert_threshold" numeric(5, 2) DEFAULT '80',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"title" text,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "command_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"intent_name" text NOT NULL,
	"description" text,
	"example_phrases" text[],
	"required_entities" text[],
	"action_handler" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "command_intents_intent_name_unique" UNIQUE("intent_name")
);
--> statement-breakpoint
CREATE TABLE "compliance_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event_type" "compliance_event_type" NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"previous_state" jsonb,
	"new_state" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"session_id" text,
	"retention_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consent_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"title_pt" text NOT NULL,
	"description_pt" text NOT NULL,
	"full_text_pt" text NOT NULL,
	"title_en" text,
	"description_en" text,
	"full_text_en" text,
	"is_mandatory" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"legal_basis" text,
	"effective_from" timestamp with time zone DEFAULT now(),
	"effective_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text,
	"method_type" text NOT NULL,
	"method_details" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"cpf" text,
	"cnpj" text,
	"notes" text,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_deletion_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_type" "deletion_request_type" NOT NULL,
	"scope" jsonb DEFAULT '{}'::jsonb,
	"reason" text,
	"status" "deletion_request_status" DEFAULT 'pending',
	"verification_code" text,
	"verified_at" timestamp with time zone,
	"review_deadline" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"processed_by" text,
	"processing_notes" text,
	"legal_hold" boolean DEFAULT false,
	"legal_hold_reason" text,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_export_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"request_type" text NOT NULL,
	"status" text DEFAULT 'pending',
	"processed_at" timestamp with time zone,
	"download_url" text,
	"expires_at" timestamp with time zone,
	"ip_address" "inet",
	"user_agent" text,
	"requested_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_retention_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"data_type" text NOT NULL,
	"description" text,
	"description_pt" text,
	"retention_months" integer NOT NULL,
	"retention_period_label" text,
	"auto_delete" boolean DEFAULT false,
	"deletion_method" text DEFAULT 'hard_delete',
	"legal_hold" boolean DEFAULT false,
	"legal_basis" text,
	"legal_requirement" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "data_retention_policies_data_type_unique" UNIQUE("data_type")
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"error_type" text NOT NULL,
	"error_code" text,
	"error_message" text NOT NULL,
	"stack_trace" text,
	"context" jsonb,
	"user_agent" text,
	"ip_address" "inet",
	"session_id" text,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event_id" text,
	"remind_at" timestamp with time zone NOT NULL,
	"reminder_type" text DEFAULT 'notification',
	"message" text,
	"is_sent" boolean DEFAULT false,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"icon" text DEFAULT 'calendar',
	"is_system" boolean DEFAULT true,
	"default_reminder_hours" integer DEFAULT 24,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "event_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "financial_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text,
	"category_id" text,
	"event_type_id" text,
	"title" text NOT NULL,
	"description" text,
	"amount" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false,
	"color" text DEFAULT 'blue' NOT NULL,
	"icon" text,
	"is_income" boolean DEFAULT false,
	"is_completed" boolean DEFAULT false,
	"is_recurring" boolean DEFAULT false,
	"recurrence_rule" text,
	"parent_event_id" text,
	"location" text,
	"notes" text,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"priority" text DEFAULT 'normal',
	"tags" text[],
	"attachments" text[],
	"brazilian_event_type" text,
	"installment_info" jsonb,
	"merchant_category" text,
	"metadata" jsonb,
	"transaction_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legal_holds" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"reference_number" text,
	"data_types" jsonb DEFAULT '[]'::jsonb,
	"all_data" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"started_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"released_by" text,
	"release_reason" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lgpd_consent_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"consent_type" text NOT NULL,
	"consent_given" boolean NOT NULL,
	"consent_version" text NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"consented_at" timestamp with time zone DEFAULT now(),
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lgpd_consents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"purpose" text NOT NULL,
	"legal_basis" text NOT NULL,
	"granted" boolean DEFAULT false NOT NULL,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"consent_version" text NOT NULL,
	"consent_text_hash" text,
	"collection_method" "collection_method" NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lgpd_export_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_type" "export_request_type" NOT NULL,
	"format" "export_format" DEFAULT 'json',
	"date_from" date,
	"date_to" date,
	"status" "export_status" DEFAULT 'pending',
	"processed_at" timestamp with time zone,
	"download_url" text,
	"download_expires_at" timestamp with time zone,
	"file_size_bytes" integer,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"requested_via" text DEFAULT 'app',
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"notification_id" text,
	"delivery_method" text NOT NULL,
	"status" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now(),
	"delivered_at" timestamp with time zone,
	"error_message" text,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"category" text,
	"priority" text DEFAULT 'normal',
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"action_url" text,
	"action_text" text,
	"metadata" jsonb,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" uuid,
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"stripe_charge_id" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"status" "payment_status" NOT NULL,
	"description" text,
	"receipt_url" text,
	"invoice_pdf" text,
	"failure_code" text,
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pix_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"key_type" text NOT NULL,
	"key_value" text NOT NULL,
	"key_name" text NOT NULL,
	"bank_name" text,
	"is_favorite" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"verification_status" text DEFAULT 'pending',
	"last_used" timestamp with time zone,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pix_qr_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"qr_code_data" text NOT NULL,
	"pix_copy_paste" text NOT NULL,
	"amount" numeric(15, 2),
	"description" text,
	"recipient_name" text,
	"recipient_pix_key" text,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"is_single_use" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"max_usage" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pix_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"transaction_id" text,
	"end_to_end_id" text,
	"pix_key" text NOT NULL,
	"pix_key_type" text NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_document" text,
	"recipient_bank" text,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"transaction_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending',
	"transaction_type" text DEFAULT 'sent',
	"scheduled_for" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"qr_code_id" text,
	"external_id" text,
	"error_message" text,
	"fee_amount" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pix_transactions_end_to_end_id_unique" UNIQUE("end_to_end_id")
);
--> statement-breakpoint
CREATE TABLE "spending_patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"category_id" text,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"period_type" text NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"transaction_count" integer NOT NULL,
	"average_transaction" numeric(15, 2),
	"trend_percentage" numeric(5, 2),
	"pattern_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"interval" text,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"features" jsonb DEFAULT '[]'::jsonb,
	"ai_models" jsonb DEFAULT '[]'::jsonb,
	"max_bank_accounts" integer DEFAULT 1,
	"max_transactions_per_month" integer,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"plan_id" text DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'free' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "transaction_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"color" text DEFAULT '#6B7280',
	"icon" text DEFAULT 'circle',
	"is_system" boolean DEFAULT false,
	"parent_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"limit_type" "limit_type" NOT NULL,
	"daily_limit" numeric(15, 2) NOT NULL,
	"transaction_limit" numeric(15, 2),
	"monthly_limit" numeric(15, 2),
	"current_daily_used" numeric(15, 2) DEFAULT '0',
	"current_monthly_used" numeric(15, 2) DEFAULT '0',
	"last_reset_at" timestamp with time zone DEFAULT now(),
	"nighttime_limit" numeric(15, 2),
	"nighttime_start" text DEFAULT '20:00',
	"nighttime_end" text DEFAULT '06:00',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"account_id" text,
	"category_id" text,
	"amount" numeric(15, 2) NOT NULL,
	"description" text NOT NULL,
	"recipient_name" text,
	"recipient_account" text,
	"recipient_pix_key" text,
	"scheduled_date" date NOT NULL,
	"recurrence_rule" text,
	"is_active" boolean DEFAULT true,
	"auto_execute" boolean DEFAULT false,
	"notification_sent" boolean DEFAULT false,
	"executed" boolean DEFAULT false,
	"executed_transaction_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"account_id" text,
	"category_id" text,
	"amount" numeric(15, 2) NOT NULL,
	"original_amount" numeric(15, 2),
	"currency" text DEFAULT 'BRL',
	"description" text NOT NULL,
	"merchant_name" text,
	"transaction_date" timestamp with time zone NOT NULL,
	"posted_date" timestamp with time zone,
	"transaction_type" text NOT NULL,
	"payment_method" text,
	"status" text DEFAULT 'posted',
	"is_recurring" boolean DEFAULT false,
	"recurring_rule" jsonb,
	"tags" text[],
	"notes" text,
	"attachments" text[],
	"confidence_score" numeric(3, 2),
	"is_categorized" boolean DEFAULT false,
	"is_manual_entry" boolean DEFAULT false,
	"external_id" text,
	"external_source" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"theme" text DEFAULT 'system',
	"notifications_email" boolean DEFAULT true,
	"notifications_push" boolean DEFAULT true,
	"notifications_sms" boolean DEFAULT false,
	"auto_categorize" boolean DEFAULT true,
	"budget_alerts" boolean DEFAULT true,
	"voice_feedback" boolean DEFAULT true,
	"accessibility_high_contrast" boolean DEFAULT false,
	"accessibility_large_text" boolean DEFAULT false,
	"accessibility_screen_reader" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_security" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"biometric_enabled" boolean DEFAULT false,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" text,
	"voice_biometric_enabled" boolean DEFAULT false,
	"voice_sample_encrypted" text,
	"session_timeout_minutes" integer DEFAULT 30,
	"max_failed_attempts" integer DEFAULT 5,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_token" text NOT NULL,
	"device_type" text,
	"device_id" text,
	"ip_address" "inet",
	"user_agent" text,
	"is_active" boolean DEFAULT true,
	"last_activity" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"phone" text,
	"cpf" text,
	"birth_date" date,
	"autonomy_level" integer DEFAULT 50,
	"voice_command_enabled" boolean DEFAULT true,
	"language" text DEFAULT 'pt-BR',
	"timezone" text DEFAULT 'America/Sao_Paulo',
	"currency" text DEFAULT 'BRL',
	"profile_image_url" text,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "voice_commands" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"command_text" text NOT NULL,
	"audio_file_url" text,
	"intent" text NOT NULL,
	"intent_confidence" numeric(3, 2),
	"entities" jsonb,
	"response_text" text,
	"response_audio_url" text,
	"processing_time_ms" integer,
	"status" text DEFAULT 'processed',
	"error_message" text,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account_balance_history" ADD CONSTRAINT "account_balance_history_account_id_bank_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_sync_logs" ADD CONSTRAINT "bank_sync_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_sync_logs" ADD CONSTRAINT "bank_sync_logs_account_id_bank_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boleto_payments" ADD CONSTRAINT "boleto_payments_boleto_id_boletos_id_fk" FOREIGN KEY ("boleto_id") REFERENCES "public"."boletos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boleto_payments" ADD CONSTRAINT "boleto_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boletos" ADD CONSTRAINT "boletos_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_audit_logs" ADD CONSTRAINT "compliance_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_payment_methods" ADD CONSTRAINT "contact_payment_methods_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_event_id_financial_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."financial_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_account_id_bank_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_events" ADD CONSTRAINT "financial_events_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lgpd_consent_logs" ADD CONSTRAINT "lgpd_consent_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lgpd_consents" ADD CONSTRAINT "lgpd_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lgpd_export_requests" ADD CONSTRAINT "lgpd_export_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_keys" ADD CONSTRAINT "pix_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_qr_codes" ADD CONSTRAINT "pix_qr_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_transactions" ADD CONSTRAINT "pix_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_transactions" ADD CONSTRAINT "pix_transactions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pix_transactions" ADD CONSTRAINT "pix_transactions_qr_code_id_pix_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."pix_qr_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_patterns" ADD CONSTRAINT "spending_patterns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_patterns" ADD CONSTRAINT "spending_patterns_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_limits" ADD CONSTRAINT "transaction_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_schedules" ADD CONSTRAINT "transaction_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_schedules" ADD CONSTRAINT "transaction_schedules_account_id_bank_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_schedules" ADD CONSTRAINT "transaction_schedules_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_schedules" ADD CONSTRAINT "transaction_schedules_executed_transaction_id_transactions_id_fk" FOREIGN KEY ("executed_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_bank_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_transaction_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."transaction_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_security" ADD CONSTRAINT "user_security_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_commands" ADD CONSTRAINT "voice_commands_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lgpd_consents_user_type_version_idx" ON "lgpd_consents" USING btree ("user_id","consent_type","consent_version");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_limits_user_type_idx" ON "transaction_limits" USING btree ("user_id","limit_type");