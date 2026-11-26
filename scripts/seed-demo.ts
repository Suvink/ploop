/**
 * Dev only. Writes ~120 fake flights over 5 years as a Ploop backup file you can import on the
 * device (Settings → Import backup), or use Settings → "Load demo data" in a dev build.
 * Run: npx tsx scripts/seed-demo.ts [out.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';
import { generateDemoFlights } from '../src/lib/demo';
import { buildBackup } from '../src/lib/backup';
import { DEFAULT_SETTINGS } from '../src/lib/settings';

const out = path.resolve(process.argv[2] ?? path.join(__dirname, '.cache', 'demo-backup.json'));
const flights = generateDemoFlights(DateTime.local());
const backup = buildBackup(
  { ...DEFAULT_SETTINGS, homeAirport: 'CMB', passportName: 'Demo Traveller' },
  flights,
  new Date(),
);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(backup, null, 2));
console.log(`Wrote ${flights.length} demo flights to ${out}`);
console.log(
  'Copy it to your phone (adb push <file> /sdcard/Download/) and use Settings → Import backup.',
);
