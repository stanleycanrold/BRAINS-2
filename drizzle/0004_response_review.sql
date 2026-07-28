-- Quality screening for interview responses. Nothing is ever deleted: a
-- rejected response stays readable so a human can overturn the machine, and
-- so we can see later what the screen was getting wrong.
DO $$ BEGIN
  CREATE TYPE "brains"."review_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "brains"."validation_responses" ADD COLUMN "review_status" "brains"."review_status" NOT NULL DEFAULT 'pending';
ALTER TABLE "brains"."validation_responses" ADD COLUMN "quality_flags" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "brains"."validation_responses" ADD COLUMN "quality_reasoning" text NOT NULL DEFAULT '';
ALTER TABLE "brains"."validation_responses" ADD COLUMN "quality_confidence" real;
ALTER TABLE "brains"."validation_responses" ADD COLUMN "reviewed_at" timestamp with time zone;
ALTER TABLE "brains"."validation_responses" ADD COLUMN "reviewed_by" text NOT NULL DEFAULT '';

-- Everything already collected predates screening; treat it as approved
-- rather than silently zeroing existing scores.
UPDATE "brains"."validation_responses" SET "review_status" = 'approved';
