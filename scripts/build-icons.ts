/**
 * Generates app icons and splash from the source artwork in icons/.
 * Run: npx tsx scripts/build-icons.ts
 */
import sharp from 'sharp';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const src = (n: string) => path.join(root, 'icons', n);
const out = (n: string) => path.join(root, 'assets', 'images', n);
const NAVY = '#14183A';

async function main() {
  const { mkdirSync } = await import('node:fs');
  mkdirSync(path.join(root, 'assets', 'images'), { recursive: true });

  // Full-bleed square icon: logo (no bg) on navy, ~82% size.
  const logo82 = await sharp(src('ploop - nobg.png')).resize(840, 840).png().toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: NAVY } })
    .composite([{ input: logo82, gravity: 'center' }])
    .png()
    .toFile(out('icon.png'));

  // Adaptive foreground: logo inside the 66dp/108dp safe zone (~60%), transparent.
  const logo60 = await sharp(src('ploop - nobg.png')).resize(620, 620).png().toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logo60, gravity: 'center' }])
    .png()
    .toFile(out('adaptive-foreground.png'));

  // Monochrome: derive alpha from darkness of the line-art version.
  const mono = sharp(src('ploop - monocolor.png')).resize(620, 620).greyscale().negate();
  const alpha = await mono.raw().toBuffer({ resolveWithObject: true });
  const white = await sharp({
    create: { width: 620, height: 620, channels: 3, background: '#FFFFFF' },
  })
    .joinChannel(alpha.data, { raw: { width: 620, height: 620, channels: 1 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: white, gravity: 'center' }])
    .png()
    .toFile(out('adaptive-monochrome.png'));

  // Splash image (transparent, rendered on navy by expo-splash-screen).
  await sharp(src('ploop - nobg.png')).resize(600, 600).png().toFile(out('splash.png'));
  // In-app wordmark logo.
  await sharp(src('ploop - nobg.png')).resize(256, 256).png().toFile(out('logo.png'));

  console.log('Icons written to assets/images/');
}

if (!process.argv.includes('--grain'))
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });

/** Subtle tileable paper grain (dark specks with low alpha) for passport cards. */
export async function buildGrain() {
  const size = 160;
  const data = Buffer.alloc(size * size * 4);
  let seed = 7;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < size * size; i++) {
    const v = rand();
    const light = rand() > 0.5;
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = light ? 255 : 0;
    data[i * 4 + 3] = Math.round(v * v * 28);
  }
  await sharp(data, { raw: { width: size, height: size, channels: 4 } })
    .png()
    .toFile(path.join(root, 'assets', 'images', 'grain.png'));
  console.log('grain.png written');
}

if (process.argv.includes('--grain')) buildGrain();
