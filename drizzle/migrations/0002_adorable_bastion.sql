CREATE TYPE "public"."member_role" AS ENUM('admin', 'member', 'viewer', 'finance_manager', 'compliance_officer');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('active', 'invited', 'suspended', 'removed');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('active', 'inactive', 'suspended', 'pending_verification');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('individual', 'mei', 'limited_company', 'corporation', 'association', 'foundation');--> statement-breakpoint
CREATE TYPE "public"."pix_key_status" AS ENUM('active', 'inactive', 'pending', 'revoked');--> statement-breakpoint
CREATE TABLE "organization_consent_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"consent_type" text NOT NULL,
	"title_pt" text NOT NULL,
	"description_pt" text NOT NULL,
	"full_text_pt" text NOT NULL,
	"title_en" text,
	"description_en" text,
	"full_text_en" text,
	"is_mandatory" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"legal_basis" text,
	"retention_months" integer,
	"display_on_signup" boolean DEFAULT false,
	"display_in_settings" boolean DEFAULT true,
	"require_explicit_acceptance" boolean DEFAULT true,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"purposes" jsonb DEFAULT '[]'::jsonb,
	"effective_from" timestamp with time zone DEFAULT now(),
	"effective_until" timestamp with time zone,
	"created_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" NOT NULL,
	"status" "member_status" DEFAULT 'invited',
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"restricted_resources" jsonb DEFAULT '[]'::jsonb,
	"invited_by" text,
	"invite_token" text,
	"invite_expires_at" timestamp with time zone,
	"invited_at" timestamp with time zone DEFAULT now(),
	"title" text,
	"department" text,
	"cost_center" text,
	"last_login" timestamp with time zone,
	"two_factor_required" boolean DEFAULT false,
	"suspended_by" text,
	"suspended_at" timestamp with time zone,
	"suspension_reason" text,
	"removed_by" text,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_pix_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"key_type" "pix_key_type" NOT NULL,
	"key_value" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_code" text NOT NULL,
	"agency_number" text,
	"account_number" text NOT NULL,
	"account_type" text,
	"display_name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"status" "pix_key_status" DEFAULT 'pending',
	"daily_limit" numeric(15, 2),
	"transaction_limit" numeric(15, 2),
	"owner_id" text,
	"created_by" text NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" text,
	"revoked_at" timestamp with time zone,
	"revoked_by" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"default_language" text DEFAULT 'pt-BR',
	"timezone" text DEFAULT 'America/Sao_Paulo',
	"currency" text DEFAULT 'BRL',
	"date_format" text DEFAULT 'dd/MM/yyyy',
	"default_transaction_category" text,
	"budget_alerts_enabled" boolean DEFAULT true,
	"auto_categorization_enabled" boolean DEFAULT true,
	"pix_daily_limit" numeric(15, 2),
	"pix_nighttime_limit" numeric(15, 2),
	"pix_nighttime_start" text DEFAULT '20:00',
	"pix_nighttime_end" text DEFAULT '06:00',
	"pix_require_approval" boolean DEFAULT false,
	"pix_approval_threshold" numeric(15, 2),
	"plaid_enabled" boolean DEFAULT false,
	"open_banking_enabled" boolean DEFAULT false,
	"two_factor_required" boolean DEFAULT false,
	"session_timeout_minutes" integer DEFAULT 30,
	"ip_whitelist" jsonb DEFAULT '[]'::jsonb,
	"lgpd_retention_months" integer DEFAULT 60,
	"data_export_enabled" boolean DEFAULT true,
	"audit_log_enabled" boolean DEFAULT true,
	"email_notifications_enabled" boolean DEFAULT true,
	"sms_notifications_enabled" boolean DEFAULT false,
	"push_notifications_enabled" boolean DEFAULT true,
	"theme" text DEFAULT 'light',
	"compact_mode" boolean DEFAULT false,
	"accessibility_high_contrast" boolean DEFAULT false,
	"accessibility_large_text" boolean DEFAULT false,
	"custom_css" text,
	"custom_scripts" text,
	"features" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "organization_settings_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trade_name" text,
	"fantasy_name" text,
	"cnpj" text,
	"state_registration" text,
	"municipal_registration" text,
	"organization_type" "organization_type" NOT NULL,
	"status" "organization_status" DEFAULT 'pending_verification',
	"email" text,
	"phone" text,
	"website" text,
	"address" jsonb DEFAULT '{}'::jsonb,
	"annual_revenue" numeric(15, 2),
	"employee_count" integer,
	"industry" text,
	"lgpd_officer_id" text,
	"compliance_framework" text,
	"member_limit" integer DEFAULT 5,
	"transaction_limit" numeric(15, 2),
	"primary_color" text,
	"secondary_color" text,
	"logo_url" text,
	"favicon_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"verified_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	CONSTRAINT "organizations_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "chat_context_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text,
	"recent_transactions" jsonb,
	"account_balances" jsonb,
	"upcoming_events" jsonb,
	"user_preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "organization_consent_templates" ADD CONSTRAINT "organization_consent_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_consent_templates" ADD CONSTRAINT "organization_consent_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_consent_templates" ADD CONSTRAINT "organization_consent_templates_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_suspended_by_users_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_pix_keys" ADD CONSTRAINT "organization_pix_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_pix_keys" ADD CONSTRAINT "organization_pix_keys_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_pix_keys" ADD CONSTRAINT "organization_pix_keys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_pix_keys" ADD CONSTRAINT "organization_pix_keys_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_pix_keys" ADD CONSTRAINT "organization_pix_keys_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_lgpd_officer_id_users_id_fk" FOREIGN KEY ("lgpd_officer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_context_snapshots" ADD CONSTRAINT "chat_context_snapshots_conversation_id_chat_sessions_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "org_members_org_user_idx" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_members_invite_token_idx" ON "organization_members" USING btree ("invite_token");--> statement-breakpoint
CREATE UNIQUE INDEX "org_pix_keys_org_key_idx" ON "organization_pix_keys" USING btree ("organization_id","key_value");