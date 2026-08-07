-- A public, read-only link to a whole idea's journey: every round, how the
-- idea changed between them, and what each concluded.
--
-- The token lives on `ideas` rather than on a version, unlike the
-- questionnaire and panel tokens. Those are per-round jobs. This one exists
-- precisely to span rounds, so hanging it off a version would share whichever
-- round happened to be current and strand the rest of the history.
--
-- `share_includes_responses` is off by default. Respondents answered a
-- questionnaire so one founder could research an idea; publishing what they
-- wrote at a public URL is a different thing to have agreed to. See
-- schema.ts for the full reasoning.
ALTER TABLE "brains"."ideas" ADD COLUMN "share_token" text;
ALTER TABLE "brains"."ideas" ADD CONSTRAINT "ideas_share_token_unique" UNIQUE("share_token");
CREATE INDEX IF NOT EXISTS "ideas_share_token_idx" ON "brains"."ideas" ("share_token");

ALTER TABLE "brains"."ideas" ADD COLUMN "share_includes_responses" boolean DEFAULT false NOT NULL;
