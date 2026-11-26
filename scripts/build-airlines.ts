/**
 * Builds assets/data/airlines.json from OpenFlights airlines.dat.
 * Licence: OpenFlights data is under the Open Database License (ODbL) — approved by the
 * project owner. Attribution is shown in Settings → About.
 * Run: npx tsx scripts/build-airlines.ts
 *
 * Output: [{ iata, icao, name, color }]
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseCsv } from './build-airports';

const URL = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat';
const CACHE = path.join(__dirname, '.cache', 'airlines.dat');
const OUT = path.join(__dirname, '..', 'assets', 'data', 'airlines.json');

/** Brand-ish chip colours for common carriers. Unknown carriers use a neutral default in the UI. */
const COLORS: Record<string, string> = {
  UL: '#2E5A88',
  EK: '#C8102E',
  QR: '#5C0632',
  EY: '#BD8B13',
  SQ: '#1D3C6E',
  CX: '#006564',
  BA: '#1B3A6B',
  LH: '#0A1D3D',
  AF: '#002157',
  KL: '#00A1DE',
  AA: '#0078D2',
  DL: '#C8102E',
  UA: '#1B4F9C',
  AC: '#D22630',
  QF: '#E40000',
  NZ: '#1C1C1C',
  TK: '#C70A0C',
  AI: '#C8102E',
  '6E': '#1C2C83',
  UK: '#5C2361',
  JL: '#CC0000',
  NH: '#13448F',
  KE: '#0064DE',
  OZ: '#5B5A5E',
  TG: '#5C2D91',
  MH: '#1C3F94',
  GA: '#0D7A8C',
  VN: '#0B6E84',
  PR: '#13317E',
  CI: '#C9A7B4',
  BR: '#1F6B4E',
  CZ: '#0F6DB4',
  MU: '#1F3A8A',
  CA: '#C8102E',
  HU: '#C8102E',
  LX: '#D52B1E',
  OS: '#C8102E',
  SK: '#003A70',
  AY: '#0B1560',
  IB: '#D7192D',
  TP: '#00A04E',
  EI: '#006272',
  FR: '#073590',
  U2: '#FF6600',
  W6: '#C6007E',
  VS: '#DA0530',
  LO: '#11397E',
  SN: '#00235F',
  AZ: '#006643',
  ET: '#2E7D32',
  KQ: '#C8102E',
  SA: '#0A3D7E',
  MS: '#163F7E',
  SV: '#1F6E4A',
  GF: '#8B6F3E',
  WY: '#9B1C31',
  FZ: '#1A3E6E',
  G9: '#C8102E',
  J9: '#0067B1',
  KU: '#0C4E8C',
  RJ: '#1A1A1A',
  ME: '#00704A',
  PK: '#00694B',
  FJ: '#1F4F7C',
  JQ: '#FF5A00',
  VA: '#5A2D82',
  WN: '#304CB2',
  B6: '#003876',
  AS: '#01426A',
  NK: '#8F8E00',
  F9: '#006848',
  AM: '#0B2343',
  LA: '#1B0088',
  AV: '#DA291C',
  CM: '#0E2C6E',
  AR: '#1C8CC8',
  G3: '#FF6600',
  AD: '#1F61AA',
  '8M': '#0E4B8C',
  BG: '#00664F',
  '2S': '#E31837',
  SL: '#E21F26',
  FD: '#E31B23',
  AK: '#E31B23',
  TR: '#FFCC00',
  '5J': '#FFD100',
  QZ: '#E31B23',
  VJ: '#E31B23',
  MI: '#1B3E6E',
  '3K': '#FF6600',
  OD: '#C8102E',
  TW: '#C8102E',
  '7C': '#FF5000',
  LJ: '#E2231A',
  MM: '#C6007E',
  GK: '#FF6600',
  BX: '#8B1E3F',
  ZH: '#1F4FA0',
  HO: '#B8A47D',
  '9C': '#1BA03A',
  SC: '#1C5AA6',
  '3U': '#1A3F8F',
  MF: '#1F5DA8',
  HX: '#8F1A3A',
  KC: '#0E7BC2',
  HY: '#1A3E78',
  J2: '#E41F26',
  A3: '#004B87',
  OA: '#00539F',
  RO: '#00337F',
  OK: '#C8102E',
  JU: '#1E3263',
  BT: '#1C3965',
  OU: '#0C2A65',
  PC: '#C8102E',
  DY: '#D81939',
  D8: '#D81939',
  FI: '#003C71',
  WF: '#C8102E',
  VY: '#FFCC00',
  UX: '#1C3F94',
  LG: '#00A0DD',
  EW: '#9B0C5D',
  DE: '#FFCC00',
  X3: '#FFCC00',
  HV: '#00D66C',
  TO: '#00D66C',
  BY: '#0A2D6E',
  LS: '#E8112D',
  MT: '#E8112D',
  '4U': '#9B0C5D',
};
const DEFAULT_COLOR = '#5F6487';

async function load(): Promise<string> {
  if (fs.existsSync(CACHE)) return fs.readFileSync(CACHE, 'utf8');
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  console.log('Downloading airlines.dat…');
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(CACHE, text);
  return text;
}

async function main() {
  const rows = parseCsv(await load());
  const out = new Map<string, { iata: string; icao: string; name: string; color: string }>();
  for (const r of rows) {
    if (r.length < 8) continue;
    const [, name, , iataRaw, icaoRaw, , , active] = r;
    const iata = (iataRaw || '').trim().toUpperCase();
    const icao = (icaoRaw || '').trim().toUpperCase();
    if (active !== 'Y' || !/^[A-Z0-9]{2}$/.test(iata) || !/^[A-Z]{3}$/.test(icao)) continue;
    // Keep the first entry for duplicate IATA codes, but prefer ones we have a colour for.
    if (out.has(iata)) continue;
    out.set(iata, { iata, icao, name: name.trim(), color: COLORS[iata] ?? DEFAULT_COLOR });
  }
  const list = [...out.values()].sort((a, b) => a.iata.localeCompare(b.iata));
  fs.writeFileSync(OUT, JSON.stringify(list));
  console.log(
    `airlines.json: ${list.length} airlines, ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`,
  );
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
