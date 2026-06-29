CREATE TABLE `gate_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`question` text NOT NULL,
	`options` text NOT NULL,
	`chosen` text,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`subtask` text NOT NULL,
	`candidate` text NOT NULL,
	`score` real,
	`chosen` integer DEFAULT 0 NOT NULL,
	`output` text,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`task` text NOT NULL,
	`project_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`output` text,
	`checkpoint` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`confidence` real DEFAULT 0.5 NOT NULL,
	`updated_at` integer NOT NULL
);
