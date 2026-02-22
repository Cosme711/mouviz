ALTER TABLE `users` ADD `email` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` text DEFAULT '2026-02-22T22:14:46.733Z' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);