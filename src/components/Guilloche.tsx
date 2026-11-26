import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { passportColors as P } from '@/theme/colors';

/** Fine wavy security lines, like the background of a passport data page. */
export const Guilloche = memo(function Guilloche({
  width,
  height,
  lines = 22,
  colors = [P.guilloche, P.guilloche2],
}: {
  width: number;
  height: number;
  lines?: number;
  colors?: readonly string[];
}) {
  const paths = useMemo(() => {
    const out: { d: string; color: string }[] = [];
    for (let k = 0; k < lines; k++) {
      const y0 = (height / lines) * (k + 0.5);
      const amp = 6 + (k % 3) * 2;
      const len = 38 + (k % 4) * 6;
      let d = '';
      for (let x = 0; x <= width + 6; x += 6) {
        const y = y0 + amp * Math.sin(x / len + k * 0.9) + 3 * Math.sin(x / 11 + k);
        d += `${x === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      out.push({ d, color: colors[k % colors.length] });
    }
    return out;
  }, [width, height, lines, colors]);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {paths.map((p, i) => (
        <Path key={i} d={p.d} stroke={p.color} strokeWidth={1} fill="none" />
      ))}
    </Svg>
  );
});
