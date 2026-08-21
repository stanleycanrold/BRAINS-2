ALTER TABLE "brains"."ideas" ADD COLUMN "founder_read_only_token" text;
ALTER TABLE "brains"."ideas" ADD COLUMN "founder_editor_token" text;
ALTER TABLE "brains"."ideas" ADD CONSTRAINT "ideas_founder_read_only_token_unique" UNIQUE("founder_read_only_token");
ALTER TABLE "brains"."ideas" ADD CONSTRAINT "ideas_founder_editor_token_unique" UNIQUE("founder_editor_token");
CREATE INDEX IF NOT EXISTS "ideas_founder_read_only_token_idx" ON "brains"."ideas" ("founder_read_only_token");
CREATE INDEX IF NOT EXISTS "ideas_founder_editor_token_idx" ON "brains"."ideas" ("founder_editor_token");