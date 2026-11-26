import { fitFontSize, textWidthEm } from '../../src/stories/textFit';

describe('fitFontSize', () => {
  it('keeps the max size when the text fits', () => {
    expect(fitFontSize('LIS', 1000, 156)).toBe(156);
  });
  it('shrinks wide codes so they fit the column', () => {
    const size = fitFontSize('CPH', 324, 156);
    expect(size).toBeLessThan(156);
    expect(textWidthEm('CPH') * size).toBeLessThanOrEqual(324);
  });
  it('handles the widest letters', () => {
    const size = fitFontSize('WWW', 300, 200);
    expect(textWidthEm('WWW') * size).toBeLessThanOrEqual(300);
  });
});
