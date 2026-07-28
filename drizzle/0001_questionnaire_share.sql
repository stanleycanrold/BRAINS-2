ALTER TABLE "brains"."idea_state_versions" ADD COLUMN "share_token" text;--> statement-breakpoint
CREATE INDEX "isv_share_token_idx" ON "brains"."idea_state_versions" USING btree ("share_token");--> statement-breakpoint
ALTER TABLE "brains"."idea_state_versions" ADD CONSTRAINT "idea_state_versions_share_token_unique" UNIQUE("share_token");