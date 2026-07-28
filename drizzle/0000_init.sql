CREATE SCHEMA "brains";
--> statement-breakpoint
CREATE TYPE "brains"."channel" AS ENUM('interview', 'survey', 'social');--> statement-breakpoint
CREATE TYPE "brains"."confirmed" AS ENUM('yes', 'no', 'unsure');--> statement-breakpoint
CREATE TYPE "brains"."draft_status" AS ENUM('drafted', 'edited', 'posted', 'reply_logged');--> statement-breakpoint
CREATE TYPE "brains"."idea_status" AS ENUM('draft', 'researching', 'validating_normal', 'validating_fast', 'gate_review', 'passed', 'needs_rework', 'killed');--> statement-breakpoint
CREATE TYPE "brains"."interview_status" AS ENUM('scheduled', 'completed', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TYPE "brains"."niche_tier" AS ENUM('general_consumer', 'vertical_b2b', 'highly_specialized');--> statement-breakpoint
CREATE TYPE "brains"."order_status" AS ENUM('pending_sourcing', 'scheduling', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "brains"."payment_status" AS ENUM('pending', 'paid', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "brains"."problem_strength" AS ENUM('weak', 'moderate', 'strong');--> statement-breakpoint
CREATE TYPE "brains"."signal" AS ENUM('go_ahead', 'rethink');--> statement-breakpoint
CREATE TYPE "brains"."subscription_status" AS ENUM('none', 'active', 'cancelled', 'past_due');--> statement-breakpoint
CREATE TYPE "brains"."track" AS ENUM('normal', 'fast');--> statement-breakpoint
CREATE TYPE "brains"."user_decision" AS ENUM('proceed', 'rework', 'kill');--> statement-breakpoint
CREATE TABLE "brains"."agent_run_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_state_version_id" uuid,
	"agent_name" text NOT NULL,
	"prompt_version" text NOT NULL,
	"input_json" jsonb NOT NULL,
	"output_json" jsonb,
	"model_used" text NOT NULL,
	"provider" text NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."decision_gates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_state_version_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"signal" "brains"."signal" NOT NULL,
	"reasoning" text DEFAULT '' NOT NULL,
	"risk_factors_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"improvement_proposal_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"diagnostic_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"user_decision" "brains"."user_decision",
	"kill_reason" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."experts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"niche_tags" text[] DEFAULT '{}' NOT NULL,
	"contact_info" text DEFAULT '' NOT NULL,
	"rate_per_interview" numeric(10, 2) DEFAULT '0' NOT NULL,
	"availability_notes" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."fast_track_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fast_track_order_id" uuid NOT NULL,
	"expert_id" uuid,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"status" "brains"."interview_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"validation_response_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."fast_track_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_state_version_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"n_requested" integer NOT NULL,
	"cost_per_interview_cents" integer NOT NULL,
	"analysis_fee_cents" integer NOT NULL,
	"total_cost_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"niche_tier" "brains"."niche_tier" DEFAULT 'general_consumer' NOT NULL,
	"payment_status" "brains"."payment_status" DEFAULT 'pending' NOT NULL,
	"payment_ref" text,
	"simulated_payment" boolean DEFAULT false NOT NULL,
	"status" "brains"."order_status" DEFAULT 'pending_sourcing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "brains"."idea_state_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"parent_version_id" uuid,
	"status" "brains"."idea_status" DEFAULT 'draft' NOT NULL,
	"version_note" text DEFAULT '' NOT NULL,
	"state_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'Untitled idea' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"current_version_id" uuid,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."pricing_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niche_tier" "brains"."niche_tier" NOT NULL,
	"cost_per_interview_cents" integer NOT NULL,
	"analysis_fee_base_cents" integer NOT NULL,
	"analysis_fee_per_unit_cents" integer NOT NULL,
	"min_interviews" integer DEFAULT 3 NOT NULL,
	"max_interviews" integer DEFAULT 25 NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."research_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_state_version_id" uuid NOT NULL,
	"problem_strength" "brains"."problem_strength" DEFAULT 'moderate' NOT NULL,
	"competitors_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"proposed_changes_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."social_engagement_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_state_version_id" uuid NOT NULL,
	"kind" text DEFAULT 'post' NOT NULL,
	"community_name" text DEFAULT '' NOT NULL,
	"community_url" text DEFAULT '' NOT NULL,
	"thread_url" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"drafted_text" text NOT NULL,
	"edited_text" text,
	"rationale" text DEFAULT '' NOT NULL,
	"status" "brains"."draft_status" DEFAULT 'drafted' NOT NULL,
	"validation_response_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brains"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"social_scan_status" "brains"."subscription_status" DEFAULT 'none' NOT NULL,
	"social_scan_customer_id" text,
	"social_scan_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "brains"."validation_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_state_version_id" uuid NOT NULL,
	"track" "brains"."track" DEFAULT 'normal' NOT NULL,
	"channel" "brains"."channel" NOT NULL,
	"confirmed" "brains"."confirmed" NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"expert_id" uuid,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brains"."agent_run_logs" ADD CONSTRAINT "agent_run_logs_idea_state_version_id_idea_state_versions_id_fk" FOREIGN KEY ("idea_state_version_id") REFERENCES "brains"."idea_state_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."decision_gates" ADD CONSTRAINT "decision_gates_idea_state_version_id_idea_state_versions_id_fk" FOREIGN KEY ("idea_state_version_id") REFERENCES "brains"."idea_state_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."fast_track_interviews" ADD CONSTRAINT "fast_track_interviews_fast_track_order_id_fast_track_orders_id_fk" FOREIGN KEY ("fast_track_order_id") REFERENCES "brains"."fast_track_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."fast_track_interviews" ADD CONSTRAINT "fast_track_interviews_expert_id_experts_id_fk" FOREIGN KEY ("expert_id") REFERENCES "brains"."experts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."fast_track_interviews" ADD CONSTRAINT "fast_track_interviews_validation_response_id_validation_responses_id_fk" FOREIGN KEY ("validation_response_id") REFERENCES "brains"."validation_responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."fast_track_orders" ADD CONSTRAINT "fast_track_orders_idea_state_version_id_idea_state_versions_id_fk" FOREIGN KEY ("idea_state_version_id") REFERENCES "brains"."idea_state_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."fast_track_orders" ADD CONSTRAINT "fast_track_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brains"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."idea_state_versions" ADD CONSTRAINT "idea_state_versions_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "brains"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."ideas" ADD CONSTRAINT "ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brains"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."research_reports" ADD CONSTRAINT "research_reports_idea_state_version_id_idea_state_versions_id_fk" FOREIGN KEY ("idea_state_version_id") REFERENCES "brains"."idea_state_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."social_engagement_posts" ADD CONSTRAINT "social_engagement_posts_idea_state_version_id_idea_state_versions_id_fk" FOREIGN KEY ("idea_state_version_id") REFERENCES "brains"."idea_state_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."social_engagement_posts" ADD CONSTRAINT "social_engagement_posts_validation_response_id_validation_responses_id_fk" FOREIGN KEY ("validation_response_id") REFERENCES "brains"."validation_responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."validation_responses" ADD CONSTRAINT "validation_responses_idea_state_version_id_idea_state_versions_id_fk" FOREIGN KEY ("idea_state_version_id") REFERENCES "brains"."idea_state_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brains"."validation_responses" ADD CONSTRAINT "validation_responses_expert_id_experts_id_fk" FOREIGN KEY ("expert_id") REFERENCES "brains"."experts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arl_version_idx" ON "brains"."agent_run_logs" USING btree ("idea_state_version_id");--> statement-breakpoint
CREATE INDEX "arl_agent_idx" ON "brains"."agent_run_logs" USING btree ("agent_name");--> statement-breakpoint
CREATE INDEX "arl_created_idx" ON "brains"."agent_run_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dg_version_idx" ON "brains"."decision_gates" USING btree ("idea_state_version_id");--> statement-breakpoint
CREATE INDEX "fti_order_idx" ON "brains"."fast_track_interviews" USING btree ("fast_track_order_id");--> statement-breakpoint
CREATE INDEX "fto_version_idx" ON "brains"."fast_track_orders" USING btree ("idea_state_version_id");--> statement-breakpoint
CREATE INDEX "fto_user_idx" ON "brains"."fast_track_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fto_status_idx" ON "brains"."fast_track_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "isv_idea_id_idx" ON "brains"."idea_state_versions" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "isv_idea_version_idx" ON "brains"."idea_state_versions" USING btree ("idea_id","version_number");--> statement-breakpoint
CREATE INDEX "ideas_user_id_idx" ON "brains"."ideas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rr_version_idx" ON "brains"."research_reports" USING btree ("idea_state_version_id");--> statement-breakpoint
CREATE INDEX "sep_version_idx" ON "brains"."social_engagement_posts" USING btree ("idea_state_version_id");--> statement-breakpoint
CREATE INDEX "users_clerk_id_idx" ON "brains"."users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "vr_version_idx" ON "brains"."validation_responses" USING btree ("idea_state_version_id");