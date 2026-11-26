import { code128Safe, code128Width, encodeCode128B } from '../../src/lib/code128';

const bits = (w: number[]) => w.map((n, i) => (i % 2 ? '0' : '1').repeat(n)).join('');

describe('Code 128 B', () => {
  it('matches a reference encoding (jsbarcode)', () => {
    expect(bits(encodeCode128B('CMB-DXB 3284 km'))).toBe(
      '11010010000100010001101011101100010001011000100110111001011000100011100010110100010110001101100110011001011100110011100101110100110011001001110110110011001100001001011110111010111101110101100011101011',
    );
  });

  it('every symbol is 11 modules (stop is 13)', () => {
    const w = encodeCode128B('ABC');
    // start + 3 chars + checksum = 5 symbols × 11, + stop 13
    expect(w.reduce((a, b) => a + b, 0)).toBe(5 * 11 + 13);
    expect(code128Width(w)).toBe(5 * 11 + 13 + 20);
  });

  it('drops characters set B cannot encode', () => {
    expect(code128Safe('CMB → DXB')).toBe('CMB  DXB');
  });
});
