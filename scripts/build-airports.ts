/**
 * Builds assets/data/airports.json and assets/data/countries.json from OurAirports (public domain).
 * Run: npx tsx scripts/build-airports.ts
 *
 * AirportRow = [iata, icao, name, city, countryCode, lat, lon, tz, size]   size: 'L'|'M'|'S'
 */
import fs from 'node:fs';
import path from 'node:path';
import { find as findTz } from 'geo-tz';

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(__dirname, '.cache');
const OUT = path.join(ROOT, 'assets', 'data');
const BASE = 'https://davidmegginson.github.io/ourairports-data/';

async function download(name: string): Promise<string> {
  const file = path.join(CACHE, name);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  fs.mkdirSync(CACHE, { recursive: true });
  console.log(`Downloading ${name}…`);
  const res = await fetch(BASE + name);
  if (!res.ok) throw new Error(`Failed to download ${name}: ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(file, text);
  return text;
}

/** Minimal RFC 4180 CSV parser (handles quoted fields with commas, quotes and newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toObjects(rows: string[][]): Record<string, string>[] {
  const [header, ...body] = rows;
  return body
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;
const SIZE: Record<string, 'L' | 'M' | 'S'> = {
  large_airport: 'L',
  medium_airport: 'M',
  small_airport: 'S',
};

async function main() {
  const airports = toObjects(parseCsv(await download('airports.csv')));
  const countries = toObjects(parseCsv(await download('countries.csv')));
  const overrides = new Set<string>(
    JSON.parse(fs.readFileSync(path.join(__dirname, 'airport-overrides.json'), 'utf8')),
  );

  const byIata = new Map<string, (string | number)[]>();
  for (const a of airports) {
    const iata = a.iata_code?.trim().toUpperCase();
    if (!iata || !/^[A-Z0-9]{3}$/.test(iata)) continue;
    const keep = overrides.has(iata) || (a.type in SIZE && a.scheduled_service === 'yes');
    if (!keep) continue;
    const lat = Number(a.latitude_deg);
    const lon = Number(a.longitude_deg);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const size = SIZE[a.type] ?? 'S';
    const prev = byIata.get(iata);
    // Prefer the larger airport if an IATA code is duplicated.
    if (prev && 'LMS'.indexOf(prev[8] as string) <= 'LMS'.indexOf(size)) continue;
    const tz = findTz(lat, lon)[0] ?? 'UTC';
    const icao = (a.icao_code || a.gps_code || '').trim();
    byIata.set(iata, [
      iata,
      icao,
      a.name.trim(),
      (a.municipality || '').trim(),
      a.iso_country,
      round4(lat),
      round4(lon),
      tz,
      size,
    ]);
  }

  const rows = [...byIata.values()].sort((a, b) => (a[0] as string).localeCompare(b[0] as string));
  fs.mkdirSync(OUT, { recursive: true });
  const airportsFile = path.join(OUT, 'airports.json');
  fs.writeFileSync(airportsFile, JSON.stringify(rows));

  const countryMap: Record<string, { name: string; continent: string }> = {};
  for (const c of countries) countryMap[c.code] = { name: c.name, continent: c.continent };
  const countriesFile = path.join(OUT, 'countries.json');
  fs.writeFileSync(countriesFile, JSON.stringify(countryMap));

  const kb = (f: string) => (fs.statSync(f).size / 1024).toFixed(1) + ' KB';
  console.log(`airports.json: ${rows.length} airports, ${kb(airportsFile)}`);
  console.log(`countries.json: ${Object.keys(countryMap).length} countries, ${kb(countriesFile)}`);
}

if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
