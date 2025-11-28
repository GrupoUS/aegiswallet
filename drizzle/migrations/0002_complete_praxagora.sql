CREATE TABLE "voice_transcriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"audio_storage_path" text NOT NULL,
	"transcript" text NOT NULL,
	"confidence_score" numeric(3, 2),
	"language" text NOT NULL,
	"processing_time_ms" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "organization_consent_templates" CASCADE;--> statement-breakpoint
DROP TABLE "organization_members" CASCADE;--> statement-breakpoint
DROP TABLE "organization_pix_keys" CASCADE;--> statement-breakpoint
DROP TABLE "organization_settings" CASCADE;--> statement-breakpoint
DROP TABLE "organizations" CASCADE;--> statement-breakpoint
ALTER TABLE "voice_transcriptions" ADD CONSTRAINT "voice_transcriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."member_role";--> statement-breakpoint
DROP TYPE "public"."member_status";--> statement-breakpoint
DROP TYPE "public"."organization_status";--> statement-breakpoint
DROP TYPE "public"."organization_type";--> statement-breakpoint
DROP TYPE "public"."pix_key_status";