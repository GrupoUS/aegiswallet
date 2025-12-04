CREATE TYPE "public"."extracted_transaction_type" AS ENUM('CREDIT', 'DEBIT');--> statement-breakpoint
CREATE TYPE "public"."import_file_type" AS ENUM('PDF', 'CSV');--> statement-breakpoint
CREATE TYPE "public"."import_session_status" AS ENUM('PROCESSING', 'REVIEW', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "extracted_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"type" "extracted_transaction_type" NOT NULL,
	"balance" numeric(15, 2),
	"raw_text" text NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"line_number" integer,
	"is_possible_duplicate" boolean DEFAULT false,
	"duplicate_reason" text,
	"duplicate_transaction_id" text,
	"is_selected" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "import_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" "import_file_type" NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text,
	"bank_detected" text,
	"status" "import_session_status" DEFAULT 'PROCESSING' NOT NULL,
	"error_message" text,
	"transactions_extracted" integer DEFAULT 0,
	"transactions_imported" integer DEFAULT 0,
	"duplicates_found" integer DEFAULT 0,
	"average_confidence" numeric(3, 2),
	"processing_time_ms" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "extracted_transactions" ADD CONSTRAINT "extracted_transactions_session_id_import_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."import_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;