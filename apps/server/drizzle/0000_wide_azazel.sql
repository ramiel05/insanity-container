CREATE TABLE `blueshift_stars` (
	`id` text PRIMARY KEY NOT NULL,
	`blueshift_id` text NOT NULL,
	`title` text NOT NULL,
	`completed_at` integer,
	`north_star` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`blueshift_id`) REFERENCES `blueshifts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `blueshifts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`goal` text,
	`magnitude` integer DEFAULT 4 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `redshift_stars` (
	`id` text PRIMARY KEY NOT NULL,
	`redshift_id` text NOT NULL,
	`title` text NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`redshift_id`) REFERENCES `redshifts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `redshifts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`goal` text,
	`magnitude` integer DEFAULT 4 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`timezone` text
);
