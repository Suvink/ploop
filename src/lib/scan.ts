import { DateTime } from 'luxon';
import {
  cabinFromCompartment,
  tryParseBcbp,
  type ParsedBoardingPass,
  type ParsedLeg,
} from './bcbp';
import { inferDate } from './dates';
import type { FlightFormValues } from './flightForm';
import { emptyForm } from './flightForm';

/** Try each decoded barcode string until one parses as BCBP. */
export function firstBoardingPass(raws: string[]): ParsedBoardingPass | null {
  for (const r of raws) {
    const p = tryParseBcbp(r);
    if (p) return p;
  }
  return null;
}

/**
 * The full date of a leg, using the pass's issue date to pin the year.
 * Returns null when the pass carries no issue date (the year is then unknown).
 */
export function dateFromIssue(
  dayOfYear: number,
  issued: NonNullable<ParsedBoardingPass['issued']>,
  today: DateTime,
): string | null {
  // Most recent year ending in the issue digit that isn't in the future.
  let issueYear = today.year - ((((today.year - issued.yearDigit) % 10) + 10) % 10);
  const issueDate = DateTime.fromObject({ year: issueYear, ordinal: issued.dayOfYear });
  if (!issueDate.isValid || issueDate > today.plus({ days: 2 })) issueYear -= 10;
  // Passes are issued before the flight; a smaller day of year means it rolls into the next year.
  const year = dayOfYear >= issued.dayOfYear - 7 ? issueYear : issueYear + 1;
  const d = DateTime.fromObject({ year, ordinal: dayOfYear });
  return d.isValid ? d.toISODate() : null;
}

/**
 * Convert a parsed leg into form values. Only parsed flight fields are carried over —
 * never passenger name, PNR, check-in sequence or the raw barcode.
 * The year comes from the pass's issue date; passes without one get the current year.
 */
export function legToForm(
  leg: ParsedLeg,
  today: DateTime,
  issued?: ParsedBoardingPass['issued'],
): FlightFormValues {
  let date: string | null = null;
  if (leg.dayOfYear && issued) {
    date = dateFromIssue(leg.dayOfYear, issued, today);
    // Airlines often leave junk in the issue-date field (a "0" reads as 2020). Only trust it
    // when it lands within a year of today; otherwise use the current year.
    if (date && Math.abs(DateTime.fromISO(date).diff(today, 'days').days) > 366) date = null;
  }
  if (!date && leg.dayOfYear) {
    const d = DateTime.fromObject({ year: today.year, ordinal: leg.dayOfYear });
    date = d.isValid ? d.toISODate() : inferDate(leg.dayOfYear, today);
  }
  if (!date) date = today.toISODate()!;
  return {
    ...emptyForm(date),
    fromIata: leg.from,
    toIata: leg.to,
    airlineIata: leg.carrier ?? '',
    flightNumber: leg.flightNumber ?? '',
    seat: leg.seat ?? '',
    cabin: cabinFromCompartment(leg.compartment),
    yearUnknown: false,
  };
}
