/** First in-list ad after this many flights, then one every AD_EVERY flights. */
export const FIRST_AD_AFTER = 5;
export const AD_EVERY = 12;

/**
 * Indexes of the flights an ad follows in a list of `count` flights. Never after the last
 * flight (the footer handles short lists), so a list never ends on two ads.
 */
export function adPositions(count: number): number[] {
  const out: number[] = [];
  for (let i = FIRST_AD_AFTER - 1; i < count - 1; i += AD_EVERY) out.push(i);
  return out;
}
