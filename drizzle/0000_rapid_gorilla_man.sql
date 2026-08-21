CREATE TYPE "public"."feature_name" AS ENUM('interKeyLatency', 'dwellTime', 'correctionRate', 'wpm');--> statement-breakpoint
CREATE TYPE "public"."insight_kind" AS ENUM('retention', 'focus', 'peak', 'general');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baseline_features" (
	"name" "feature_name" PRIMARY KEY NOT NULL,
	"mean" real NOT NULL,
	"variance" real NOT NULL,
	"stddev" real NOT NULL,
	"sample_count" integer NOT NULL,
	"last_updated" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"topic" text NOT NULL,
	"target_date" date,
	"created_at" timestamp with time zone NOT NULL,
	"interval" real NOT NULL,
	"repetitions" integer NOT NULL,
	"ease_factor" real NOT NULL,
	"due_date" date NOT NULL,
	"last_reviewed" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"statement" text NOT NULL,
	"stat" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"dismissed" boolean NOT NULL,
	"kind" "insight_kind" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"session_id" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"grade" integer NOT NULL,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "session_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"minute_index" integer NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"inter_key_latency" real NOT NULL,
	"dwell_time" real NOT NULL,
	"correction_rate" real NOT NULL,
	"wpm" real NOT NULL,
	"z_scores" jsonb
);
--> statement-breakpoint
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;