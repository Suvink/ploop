import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Privacy rule: never add columns for passenger name, PNR, check-in sequence or raw barcode.
export const flights = sqliteTable(
  'flights',
  {
    id: text('id').primaryKey(), // uuid v4
    date: text('date').notNull(), // 'YYYY-MM-DD', local date at departure airport
    fromIata: text('from_iata').notNull(),
    toIata: text('to_iata').notNull(),
    airlineIata: text('airline_iata'),
    flightNumber: text('flight_number'),
    depLocal: text('dep_local'),
    arrLocal: text('arr_local'),
    arrDayOffset: integer('arr_day_offset'),
    durationMin: integer('duration_min'),
    seat: text('seat'),
    cabin: text('cabin'),
    aircraftType: text('aircraft_type'),
    registration: text('registration'),
    notes: text('notes'),
    // 1 when the boarding pass had no year: `date` holds a best guess until the user sets it.
    yearUnknown: integer('year_unknown', { mode: 'boolean' }).notNull().default(false),
    source: text('source').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('flights_date_idx').on(t.date)],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON-encoded
});

export type FlightRow = typeof flights.$inferSelect;
export type NewFlightRow = typeof flights.$inferInsert;
