ALTER TABLE "resources" ADD COLUMN "source_type" varchar(10) DEFAULT 'text';--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "source_id" varchar(191);