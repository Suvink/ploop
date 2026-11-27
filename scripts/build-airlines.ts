/**
 * Builds assets/data/airlines.json from Wikidata (CC0), which tracks current IATA code holders
 * and when airlines stopped flying. Codes get reassigned (D8: Djibouti Airlines → Norwegian Air
 * Sweden), so for each code we keep the airline that is still operating, or failing that
 * the one that closed most recently.
 * Run: npm run data:airlines   (dev only, needs network; the response is cached in scripts/.cache)
 *
 * Output: [{ iata, icao, name, color, alt? }]   alt: other ICAO codes the airline uses, for logos
 */
import fs from 'node:fs';
import path from 'node:path';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const CACHE = path.join(__dirname, '.cache', 'airlines-wikidata.json');
const OUT = path.join(__dirname, '..', 'assets', 'data', 'airlines.json');

// Every item with an IATA airline designator (P229), plus ICAO (P230), dissolved (P576),
// inception (P571), and its sitelink count. Many labels now live under "mul" rather than "en".
// as a tie-breaker for "the airline people know".
const QUERY = `
SELECT ?item ?iata ?icao ?label ?dissolved ?start ?links WHERE {
  ?item wdt:P229 ?iata .
  OPTIONAL { ?item wdt:P230 ?icao . }
  OPTIONAL { ?item wdt:P576 ?dissolved . }
  OPTIONAL { ?item wdt:P571 ?start . }
  OPTIONAL { ?item wikibase:sitelinks ?links . }
  OPTIONAL { ?item rdfs:label ?en FILTER(LANG(?en) = "en") }
  OPTIONAL { ?item rdfs:label ?mul FILTER(LANG(?mul) = "mul") }
  BIND(COALESCE(?en, ?mul) AS ?label)
}`;

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

type Binding = Record<string, { value: string } | undefined>;

async function load(): Promise<Binding[]> {
  if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  console.log('Querying Wikidata…');
  const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(QUERY)}`, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'airline-codes-build/1.0' },
  });
  if (!res.ok) throw new Error(`Wikidata query failed: ${res.status}`);
  const rows: Binding[] = (await res.json()).results.bindings;
  fs.writeFileSync(CACHE, JSON.stringify(rows));
  return rows;
}

interface Candidate {
  id: string;
  iata: string;
  icao: string;
  icaos: string[];
  name: string;
  dissolved: string;
  start: string;
  links: number;
}

/** Wikidata labels sometimes carry a disambiguator, e.g. "Jet2 (airline)". */
const cleanName = (s: string) => s.replace(/\s*\((airline|company|airline company)\)$/i, '').trim();

/**
 * Airlines that stopped flying after this still get a name, so older boarding passes
 * (a 2019 Jet Airways flight, say) aren't shown as a bare code.
 */
const KEEP_DISSOLVED_SINCE = '2010';

/**
 * Higher is better: still operating, then most recently closed, then has an ICAO code,
 * better known, more recently founded.
 */
function better(a: Candidate, b: Candidate): boolean {
  if (!a.dissolved !== !b.dissolved) return !a.dissolved;
  if (a.dissolved !== b.dissolved) return a.dissolved > b.dissolved;
  if (!!a.icao !== !!b.icao) return !!a.icao;
  if (a.links !== b.links) return a.links > b.links;
  return a.start > b.start;
}

async function main() {
  const byItem = new Map<string, Candidate>();
  for (const b of await load()) {
    const iata = b.iata?.value.trim().toUpperCase() ?? '';
    const name = b.label?.value ?? '';
    if (!/^[A-Z0-9]{2}$/.test(iata) || !name || /^Q\d+$/.test(name)) continue;
    const icao = (b.icao?.value ?? '').trim().toUpperCase();
    const id = `${b.item!.value}|${iata}`;
    const prev = byItem.get(id);
    // An item can list several ICAO codes (Norwegian Air Sweden: NSW, NSZ); keep them all.
    if (prev) {
      if (/^[A-Z]{3}$/.test(icao) && !prev.icaos.includes(icao)) prev.icaos.push(icao);
      prev.icao = prev.icaos[0] ?? '';
      continue;
    }
    const icaos = /^[A-Z]{3}$/.test(icao) ? [icao] : [];
    byItem.set(id, {
      id,
      iata,
      icao: icaos[0] ?? '',
      icaos,
      name: cleanName(name),
      dissolved: b.dissolved?.value ?? '',
      start: b.start?.value ?? '',
      links: Number(b.links?.value ?? 0),
    });
  }

  const best = new Map<string, Candidate>();
  for (const c of byItem.values()) {
    const prev = best.get(c.iata);
    if (!prev || better(c, prev)) best.set(c.iata, c);
  }

  const list = [...best.values()]
    .filter((c) => !c.dissolved || c.dissolved >= KEEP_DISSOLVED_SINCE)
    .map((c) => ({
      iata: c.iata,
      icao: c.icao,
      name: c.name,
      color: COLORS[c.iata] ?? DEFAULT_COLOR,
      ...(c.icaos.length > 1 ? { alt: c.icaos.slice(1) } : {}),
    }))
    .sort((a, b) => a.iata.localeCompare(b.iata));
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
