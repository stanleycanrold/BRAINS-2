-- A separate public link for the interviews we run on a paid round, so that
-- responses can be attributed to what the founder paid for rather than to
-- their own outreach. See ideaStateVersions.panelToken.
ALTER TABLE "brains"."idea_state_versions" ADD COLUMN "panel_token" text;
ALTER TABLE "brains"."idea_state_versions" ADD CONSTRAINT "idea_state_versions_panel_token_unique" UNIQUE("panel_token");
CREATE INDEX IF NOT EXISTS "isv_panel_token_idx" ON "brains"."idea_state_versions" ("panel_token");
