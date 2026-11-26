import { DateTime } from 'luxon';
import { getAllFlights, insertFlights } from '@/db/repo';
import type { ParsedBoardingPass } from '@/lib/bcbp';
import { isDuplicate, validateFlightForm, type FlightFields } from '@/lib/flightForm';
import { legToForm } from '@/lib/scan';

export type SaveScanResult =
  | { kind: 'saved'; flights: FlightFields[]; ids: string[]; duplicates: number }
  | { kind: 'duplicates'; count: number }
  /** Something in the barcode didn't validate; let the user fix it on the review screen. */
  | { kind: 'review' };

/** Save every leg of a scanned pass straight away, skipping flights already in the log. */
export async function saveScannedPass(pass: ParsedBoardingPass): Promise<SaveScanResult> {
  const today = DateTime.local();
  const fields: FlightFields[] = [];
  for (const leg of pass.legs) {
    const r = validateFlightForm(legToForm(leg, today, pass.issued));
    if (!r.ok) return { kind: 'review' };
    fields.push(r.value);
  }
  const existing = await getAllFlights();
  const fresh = fields.filter(
    (f) => !isDuplicate(existing, f) && !isDuplicate(fields.slice(0, fields.indexOf(f)), f),
  );
  if (fresh.length === 0) return { kind: 'duplicates', count: fields.length };
  const ids = await insertFlights(fresh, 'scan');
  return { kind: 'saved', flights: fresh, ids, duplicates: fields.length - fresh.length };
}

export function savedMessage(r: Extract<SaveScanResult, { kind: 'saved' }>): string {
  const routes = r.flights.map((f) => `${f.fromIata} → ${f.toIata}`).join(', ');
  const needsYear = r.flights.some((f) => f.yearUnknown);
  return `Added ${routes}${needsYear ? ' · add the year in Flights' : ''}`;
}
