ALTER TABLE `provider_configs` ADD `status` text;--> statement-breakpoint
ALTER TABLE `provider_configs` ADD `latency_ms` integer;--> statement-breakpoint
ALTER TABLE `provider_configs` ADD `last_checked_at` integer;--> statement-breakpoint
ALTER TABLE `provider_configs` ADD `status_message` text;