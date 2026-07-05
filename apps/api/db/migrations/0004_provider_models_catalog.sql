CREATE TABLE `provider_models` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_config_id` text NOT NULL,
	`model_id` text NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`provider_config_id`) REFERENCES `provider_configs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `provider_models_config_id_idx` ON `provider_models` (`provider_config_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `provider_models_config_model_unique` ON `provider_models` (`provider_config_id`,`model_id`);