-- Where the founder wants interviewees drawn from. Free text: a country list
-- cannot express "US healthcare admins" or "anywhere, English-speaking", and
-- both are useful answers.
ALTER TABLE "brains"."fast_track_orders" ADD COLUMN "location_preference" text NOT NULL DEFAULT '';
