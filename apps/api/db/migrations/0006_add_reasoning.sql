ALTER TABLE `messages` ADD `reasoning` text;--> statement-breakpoint
ALTER TABLE `provider_models` ADD `reasoning` integer DEFAULT 0 NOT NULL;