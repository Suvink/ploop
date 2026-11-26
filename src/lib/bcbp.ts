/**
 * IATA BCBP (Resolution 792) parser, format "M".
 * Privacy: passenger name, PNR and check-in sequence are read past but never returned.
 */
import type { Cabin } from './types';

export class NotBcbpError extends Error {
  constructor(message = 'Not an IATA boarding pass barcode') {
    super(message);
    this.name = 'NotBcbpError';
  }
}

export interface ParsedLeg {
  from: string;
  to: string;
  carrier: string | null;
  flightNumber: string | null;
  dayOfYear: number | null;
  compartment: string | null;
  seat: string | null;
}

export interface ParsedBoardingPass {
  legs: ParsedLeg[];
  partial: boolean;
  /**
   * "Date of issue of boarding pass" from the conditional section, when present:
   * the last digit of the year plus a day of year. Lets us work out the flight's year.
   */
  issued?: { yearDigit: number; dayOfYear: number } | null;
}

const FIRST_LEG_START = 23;
const LEG_FIXED_LEN = 37;

function slice(raw: string, start: number, len: number): string | null {
  if (start + len > raw.length) return null;
  return raw.substr(start, len);
}

export function normaliseSeat(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim().toUpperCase();
  if (!t || t === 'INF' || t === 'GATE' || /^0+$/.test(t)) return null;
  const m = t.match(/^0*(\d+)([A-Z])$/);
  if (m) return `${m[1]}${m[2]}`;
  return /^[0-9A-Z]+$/.test(t) ? t : null;
}

export function normaliseBcbpFlightNumber(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim().toUpperCase();
  const m = t.match(/^0*(\d+)\s*([A-Z]?)$/);
  if (!m) return t || null;
  return `${m[1] || '0'}${m[2]}`;
}

/**
 * Scanners sometimes prepend a symbology identifier (e.g. "]L2"), a BOM or whitespace.
 * Returns the string from the "M<legs>" header, or null if there is none near the start.
 */
function normalise(input: string): string | null {
  const upper = input.toUpperCase();
  const idx = upper.search(/M[1-4]/);
  if (idx < 0 || idx > 6) return null;
  return upper.slice(idx);
}

/** Strict parse using the fixed IATA field offsets. */
function parseStrict(raw: string, legCount: number): ParsedBoardingPass {
  const legs: ParsedLeg[] = [];
  let partial = false;
  let start = FIRST_LEG_START;

  for (let i = 0; i < legCount; i++) {
    const from = slice(raw, start + 7, 3);
    const to = slice(raw, start + 10, 3);
    const flightRaw = slice(raw, start + 16, 5);
    const doyRaw = slice(raw, start + 21, 3);
    const plausible =
      from &&
      to &&
      /^[A-Z]{3}$/.test(from) &&
      /^[A-Z]{3}$/.test(to) &&
      // Flight number and date must look right too, otherwise offsets are off.
      (flightRaw === null || /^[ 0-9]{1,4}[0-9][A-Z ]?$|^[ 0-9]{4}[A-Z ]$/.test(flightRaw)) &&
      (doyRaw === null || /^(\d{3}| {3})$/.test(doyRaw));
    if (!plausible) {
      partial = true;
      break;
    }
    const carrier = slice(raw, start + 13, 3)?.trim() || null;
    const doy = doyRaw && /^\d{3}$/.test(doyRaw) ? Number(doyRaw) : NaN;
    legs.push({
      from: from!,
      to: to!,
      carrier,
      flightNumber: normaliseBcbpFlightNumber(flightRaw),
      dayOfYear: doy >= 1 && doy <= 366 ? doy : null,
      compartment: slice(raw, start + 24, 1)?.trim() || null,
      seat: normaliseSeat(slice(raw, start + 25, 4)),
    });

    const sizeHex = slice(raw, start + 35, 2);
    if (sizeHex === null) {
      partial = true;
      break;
    }
    const varSize = /^[0-9A-F]{2}$/.test(sizeHex) ? parseInt(sizeHex, 16) : 0;
    start = start + LEG_FIXED_LEN + varSize;
  }
  if (legs.length < legCount) partial = true;
  return { legs, partial };
}

/**
 * Pattern-based fallback for passes whose spacing was altered (collapsed spaces, trimmed
 * name field, non-standard padding). Looks for FROM TO CARRIER FLIGHT DOY CLASS SEAT.
 */
const LOOSE_LEG =
  /([A-Z]{3})([A-Z]{3})([A-Z0-9]{2}[A-Z]?) *0*(\d{1,4}[A-Z]?) *(\d{3})([A-Z])(\d{0,3}[A-Z]|INF|GATE| {1,4})?/g;

function parseLoose(raw: string, legCount: number): ParsedBoardingPass {
  const legs: ParsedLeg[] = [];
  // Skip the header and the start of the name field so names can't match.
  const body = raw.slice(2);
  for (const m of body.matchAll(LOOSE_LEG)) {
    const doy = Number(m[5]);
    legs.push({
      from: m[1],
      to: m[2],
      carrier: m[3].trim() || null,
      flightNumber: normaliseBcbpFlightNumber(m[4]),
      dayOfYear: doy >= 1 && doy <= 366 ? doy : null,
      compartment: m[6],
      seat: normaliseSeat(m[7] ?? null),
    });
    if (legs.length >= legCount) break;
  }
  return { legs, partial: true };
}

const ISSUE_DATE_AT = FIRST_LEG_START + LEG_FIXED_LEN;

function parseIssued(raw: string): ParsedBoardingPass['issued'] {
  // Conditional unique section: '>' version size(2 hex) paxDesc srcCheckin srcIssue DATE(4)
  let m: RegExpMatchArray | null = null;
  if (raw[ISSUE_DATE_AT] === '>') {
    m = raw.slice(ISSUE_DATE_AT).match(/^>.([0-9A-F]{2})...(\d{4})/);
  }
  // Spacing may have been altered: look for the section marker anywhere after the first leg.
  if (!m) m = raw.slice(FIRST_LEG_START).match(/>[0-9A-Z]([0-9A-F]{2})...(\d{4})/);
  if (!m || parseInt(m[1], 16) < 7) return null;
  const yearDigit = Number(m[2][0]);
  const dayOfYear = Number(m[2].slice(1));
  return dayOfYear >= 1 && dayOfYear <= 366 ? { yearDigit, dayOfYear } : null;
}

export function parseBcbp(input: string): ParsedBoardingPass {
  const raw = normalise(input);
  if (!raw) throw new NotBcbpError();
  const legCount = Number(raw[1]);
  const issued = parseIssued(raw);

  const strict = parseStrict(raw, legCount);
  if (strict.legs.length > 0) return { ...strict, issued };
  const loose = parseLoose(raw, legCount);
  if (loose.legs.length > 0) return { ...loose, issued };
  throw new NotBcbpError('Boarding pass barcode has no readable flight');
}

/** Best-guess mapping; airlines vary, so the user can edit it. */
const FIRST = new Set(['F', 'A', 'P']);
const BUSINESS = new Set(['J', 'C', 'D', 'I', 'Z', 'R']);
const PREMIUM = new Set(['W', 'E']);

export function cabinFromCompartment(code: string | null): Cabin {
  const c = (code ?? '').trim().toUpperCase();
  if (FIRST.has(c)) return 'first';
  if (BUSINESS.has(c)) return 'business';
  if (PREMIUM.has(c)) return 'premium';
  return 'economy';
}

/** True when the string looks like it could be a BCBP and parses. */
export function tryParseBcbp(raw: string): ParsedBoardingPass | null {
  try {
    return parseBcbp(raw);
  } catch {
    return null;
  }
}
