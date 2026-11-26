import { formatMultiplier, formatNumber, type DistanceUnit } from './format';
import { kmToUnit } from './geo';
import type { Stats } from './stats';

export const EARTH_KM = 40075;
export const MOON_KM = 384400;

export interface Explainer {
  title: string;
  /** Plain-language "how we got this number", with a wink. */
  lines: string[];
  /** The sum itself, e.g. "52,310 km ÷ 40,075 km = 1.3×". */
  formula: string;
}

const dist = (km: number, unit: DistanceUnit) =>
  `${formatNumber(Math.round(kmToUnit(km, unit)))} ${unit}`;

export function moonPercentLabel(pct: number): string {
  return `${pct < 10 ? pct.toFixed(1) : formatNumber(pct)}%`;
}

export function explainEarth(stats: Stats, unit: DistanceUnit): Explainer {
  return {
    title: 'Around the Earth',
    lines: [
      'We add up every flight as the crow flies: the shortest line over the globe between the two airports. Real planes wiggle a bit more, so you’ve probably flown even further.',
      `Earth’s waistline is ${dist(EARTH_KM, unit)} at the equator. Divide one by the other and there you go.`,
      'Your suitcase has seen more of the planet than most explorers. Give it a pat.',
    ],
    formula: `${dist(stats.distanceKm, unit)} ÷ ${dist(EARTH_KM, unit)} = ${formatMultiplier(stats.funFacts.earthLaps)}`,
  };
}

export function explainMoon(stats: Stats, unit: DistanceUnit): Explainer {
  return {
    title: 'Of the way to the Moon',
    lines: [
      `The Moon hangs out about ${dist(MOON_KM, unit)} away (on average; it’s a bit of a wanderer).`,
      'We take all the distance you’ve flown and see how far up that would get you.',
      'Apollo did it in three days. You’re doing it one boarding pass at a time, with better snacks.',
    ],
    formula: `${dist(stats.distanceKm, unit)} ÷ ${dist(MOON_KM, unit)} = ${moonPercentLabel(stats.funFacts.moonPct)}`,
  };
}

export function explainDays(stats: Stats): Explainer {
  const hours = stats.minutes / 60;
  return {
    title: 'Days spent flying',
    lines: [
      'For each flight we use the departure and arrival times you entered (time zones included).',
      `No times? Then we estimate: distance at a cruising 800 km/h, plus 30 minutes for taxiing, take-off and the queue for the loo.${stats.minutesEstimated ? ' Some of yours are estimates.' : ''}`,
      'Add it all up and divide by 24. That’s a lot of tiny pretzels.',
    ],
    formula: `${formatNumber(hours, 1)} h ÷ 24 = ${stats.funFacts.days.toFixed(1)} days`,
  };
}

export function explainLongest(route: string, km: number, unit: DistanceUnit): Explainer {
  return {
    title: 'Longest hop',
    lines: [
      `Out of all your flights, ${route} covers the most ground.`,
      'Measured airport to airport along the curve of the Earth (great-circle distance), the way a very determined pigeon would fly it.',
      'Hopefully you had the window seat.',
    ],
    formula: `${route} = ${dist(km, unit)}`,
  };
}

export function explainNight(stats: Stats): Explainer {
  return {
    title: 'Night departures',
    lines: [
      'Flights that took off between 22:00 and 05:59 local time. We can only count flights where you entered a departure time.',
      'Red-eye club members get bonus points for sleeping upright.',
    ],
    formula: `${formatNumber(stats.nightCount)} flights took off at night`,
  };
}
