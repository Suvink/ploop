import { buildMapData } from '../../src/lib/mapData';
import { flight, getAirport } from './helpers';

describe('buildMapData', () => {
  it('dedupes undirected routes, skips upcoming, unknown and out-of-range flights', () => {
    const fl = [
      flight({ date: '2024-01-01', fromIata: 'CMB', toIata: 'DXB' }),
      flight({ date: '2024-01-05', fromIata: 'DXB', toIata: 'CMB' }),
      flight({ date: '2024-02-01', fromIata: 'SYD', toIata: 'LAX' }),
      flight({ date: '2024-03-01', fromIata: 'ZZZ', toIata: 'CMB' }),
      flight({ date: '2023-03-01', fromIata: 'LHR', toIata: 'JFK' }),
      flight({ date: '2030-01-01', fromIata: 'SIN', toIata: 'CMB' }),
    ];
    const all = buildMapData(fl, getAirport, {}, '2025-01-01');
    expect(all.routes.map((r) => `${r.a.iata}-${r.b.iata}`)).toEqual([
      'CMB-DXB',
      'SYD-LAX',
      'LHR-JFK',
    ]);
    expect(all.visited).toEqual(new Set(['LK', 'AE', 'AU', 'US', 'GB']));
    const y = buildMapData(fl, getAirport, { year: 2023 }, '2025-01-01');
    expect(y.routes).toHaveLength(1);
    expect(y.airports.map((a) => a.iata).sort()).toEqual(['JFK', 'LHR']);
  });
});
