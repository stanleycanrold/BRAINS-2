-- Studio real-data wiring: structured answers, respondent profile, ICP fit and
-- per-respondent WTP on the unified response pool. (The fast_track_orders and
-- ideas token statements drizzle regenerated here were already applied by
-- hand-written migrations 0007/0008 and are intentionally omitted.)
ALTER TABLE "brains"."validation_responses" ADD COLUMN "answers_json" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "brains"."validation_responses" ADD COLUMN "respondent_profile" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "brains"."validation_responses" ADD COLUMN "icp_fit" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "brains"."validation_responses" ADD COLUMN "icp_fit_reasoning" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "brains"."validation_responses" ADD COLUMN "wtp_estimate" integer DEFAULT 0 NOT NULL;