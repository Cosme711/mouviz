ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT '2026-03-12T21:04:12.987Z';--> statement-breakpoint
ALTER TABLE "films" ADD COLUMN "country" text DEFAULT '' NOT NULL;