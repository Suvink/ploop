CREATE TABLE `flights` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`from_iata` text NOT NULL,
	`to_iata` text NOT NULL,
	`airline_iata` text,
	`flight_number` text,
	`dep_local` text,
	`arr_local` text,
	`arr_day_offset` integer,
	`duration_min` integer,
	`seat` text,
	`cabin` text,
	`aircraft_type` text,
	`registration` text,
	`notes` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `flights_date_idx` ON `flights` (`date`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
