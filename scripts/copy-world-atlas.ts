/**
 * Copies world-atlas countries-110m.json (Natural Earth, public domain) into assets/data and
 * builds iso-numeric.json (numeric ISO 3166 → alpha-2) for the features it contains.
 * Run: npx tsx scripts/copy-world-atlas.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import countries from 'i18n-iso-countries';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'data');
const src = require.resolve('world-atlas/countries-110m.json');

/** Features in world-atlas without a numeric id, keyed by name. */
const BY_NAME: Record<string, string> = { Kosovo: 'XK', 'N. Cyprus': 'CY', Somaliland: 'SO' };

type Topo = {
  objects: { countries: { geometries: { id?: string; properties: { name: string } }[] } };
};

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const topo = JSON.parse(fs.readFileSync(src, 'utf8')) as Topo;
  const table: Record<string, string> = {};
  for (const g of topo.objects.countries.geometries) {
    const name = g.properties.name;
    let a2: string | undefined;
    if (g.id) a2 = countries.numericToAlpha2(g.id);
    a2 = a2 ?? BY_NAME[name];
    if (!a2) {
      console.warn(`No alpha-2 for ${g.id ?? '(no id)'} ${name}`);
      continue;
    }
    // Features without an id get a synthetic key "name:<name>".
    table[g.id ?? `name:${name}`] = a2;
  }
  fs.copyFileSync(src, path.join(OUT, 'countries-110m.json'));
  fs.writeFileSync(path.join(OUT, 'iso-numeric.json'), JSON.stringify(table, null, 0));
  console.log(`countries-110m.json copied; iso-numeric.json: ${Object.keys(table).length} entries`);
}

main();
