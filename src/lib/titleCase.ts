const SMALL = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
]);

/** "duplicate as return" → "Duplicate as Return". Used for every button and action label. */
export function titleCase(s: string): string {
  return s.replace(/[A-Za-z][A-Za-z']*/g, (word, offset: number) => {
    const lower = word.toLowerCase();
    if (offset > 0 && SMALL.has(lower)) return lower;
    return word[0].toUpperCase() + word.slice(1);
  });
}
