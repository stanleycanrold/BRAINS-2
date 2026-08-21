ALTER TABLE "brains"."fast_track_orders"
ADD COLUMN "customer_email" text NOT NULL DEFAULT '';
ALTER TABLE "brains"."fast_track_orders"
ADD COLUMN "payment_reported_at" timestamp with time zone;