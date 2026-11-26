/**
 * Advance widths (in em) of the characters stories print big, taking the widest of Plus Jakarta
 * Sans Bold/SemiBold and Fredoka SemiBold, read from the bundled font files. Lets stories size
 * text exactly instead of relying on Android's adjustsFontSizeToFit, which clips inside the
 * scaled story canvas.
 */
const WIDTH: Record<string, number> = {
  '0': 0.716,
  '1': 0.403,
  '2': 0.598,
  '3': 0.611,
  '4': 0.654,
  '5': 0.615,
  '6': 0.602,
  '7': 0.559,
  '8': 0.632,
  '9': 0.602,
  A: 0.712,
  B: 0.692,
  C: 0.777,
  D: 0.741,
  E: 0.61,
  F: 0.619,
  G: 0.813,
  H: 0.734,
  I: 0.279,
  J: 0.536,
  K: 0.679,
  L: 0.565,
  M: 0.893,
  N: 0.741,
  O: 0.878,
  P: 0.648,
  Q: 0.878,
  R: 0.661,
  S: 0.647,
  T: 0.648,
  U: 0.718,
  V: 0.727,
  W: 1.02,
  X: 0.691,
  Y: 0.66,
  Z: 0.59,
  a: 0.58,
  b: 0.672,
  c: 0.608,
  d: 0.672,
  e: 0.613,
  f: 0.406,
  g: 0.655,
  h: 0.593,
  i: 0.252,
  j: 0.252,
  k: 0.577,
  l: 0.301,
  m: 0.924,
  n: 0.593,
  o: 0.653,
  p: 0.672,
  q: 0.672,
  r: 0.423,
  s: 0.514,
  t: 0.413,
  u: 0.593,
  v: 0.566,
  w: 0.883,
  x: 0.558,
  y: 0.586,
  z: 0.54,
  ' ': 0.241,
  ',': 0.357,
  '.': 0.378,
  '-': 0.6,
  '–': 0.655,
  '×': 0.66,
  ':': 0.378,
  '’': 0.357,
  "'": 0.311,
  '(': 0.379,
  ')': 0.379,
  '/': 0.506,
  '·': 0.378,
  '&': 0.793,
};
const FALLBACK = 0.75;

/** Width in em of `text` in the display font. */
export function textWidthEm(text: string, letterSpacingEm = 0): number {
  const chars = [...text];
  return chars.reduce((w, ch) => w + (WIDTH[ch] ?? FALLBACK), 0) + letterSpacingEm * chars.length;
}

/** Largest font size (≤ max) at which `text` fits in `width` on one line, with a small margin. */
export function fitFontSize(text: string, width: number, max: number, letterSpacingEm = 0): number {
  const em = textWidthEm(text, letterSpacingEm);
  if (em <= 0) return max;
  return Math.max(10, Math.min(max, Math.floor((width * 0.94) / em)));
}
