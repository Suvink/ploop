import { adPositions } from '@/ads/placement';

describe('adPositions', () => {
  it('puts no in-list ad in short lists (the footer shows one instead)', () => {
    expect(adPositions(0)).toEqual([]);
    expect(adPositions(5)).toEqual([]);
  });

  it('puts the first ad after the fifth flight, then every twelve', () => {
    expect(adPositions(6)).toEqual([4]);
    expect(adPositions(30)).toEqual([4, 16, 28]);
  });

  it('never puts an ad after the last flight', () => {
    expect(adPositions(17)).toEqual([4]);
    expect(adPositions(18)).toEqual([4, 16]);
  });
});
