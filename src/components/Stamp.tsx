import { View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText, TextPath } from 'react-native-svg';
import { countryName } from '@/data/refdata';
import { formatDate } from '@/lib/format';
import { passportColors } from '@/theme/colors';
import { fonts } from '@/theme/tokens';

/** Stable pseudo-random in [0,1) from a string. */
export function seeded(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export type StampShape = 'circle' | 'rect' | 'octagon';

export function stampShape(code: string): StampShape {
  const r = seeded(code, 1);
  return r < 0.42 ? 'circle' : r < 0.76 ? 'rect' : 'octagon';
}

/** Ink colour for a country, from the passport ink set. */
export function stampInk(code: string): string {
  const inks = passportColors.stampInks;
  return inks[Math.floor(seeded(code, 7) * inks.length)];
}

const PLANE = 'M-9 0 L9 0 M2 0 L-3 -7 M2 0 L-3 7 M-7 0 L-10 -4 M-7 0 L-10 4';

function fit(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1)}.` : name;
}

/**
 * Passport entry stamp for a country: circle, rectangle or octagon (stable per country),
 * drawn with double rules and curved lettering like a real immigration stamp.
 */
export function Stamp({
  code,
  firstDate,
  size = 104,
  hideExactDates,
  color,
  rotate: rotateProp,
}: {
  code: string;
  firstDate: string;
  size?: number;
  hideExactDates?: boolean;
  /** Ink colour; defaults to a stable colour per country. */
  color?: string;
  /** Degrees; defaults to a stable tilt per country. */
  rotate?: number;
  /** @deprecated kept for compatibility; stamps are single-ink. */
  textColor?: string;
}) {
  const ink = color ?? stampInk(code);
  const shape = stampShape(code);
  const rotate = rotateProp ?? (seeded(code) - 0.5) * 22;
  const name = countryName(code).toUpperCase();
  const date = formatDate(firstDate, hideExactDates).toUpperCase();
  const label = `${countryName(code)}, first visited ${formatDate(firstDate, hideExactDates)}`;
  const font = fonts.semibold;
  const h = shape === 'rect' ? size * 0.72 : size;

  let art;
  if (shape === 'circle') {
    const arcId = `top-${code}`;
    const botId = `bot-${code}`;
    art = (
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Circle cx={100} cy={100} r={94} stroke={ink} strokeWidth={6} fill="none" />
        <Circle cx={100} cy={100} r={84} stroke={ink} strokeWidth={1.5} fill="none" />
        <Circle cx={100} cy={100} r={52} stroke={ink} strokeWidth={1.5} fill="none" />
        <Path id={arcId} d="M 30 100 A 70 70 0 0 1 170 100" fill="none" />
        <Path id={botId} d="M 24 100 A 76 76 0 0 0 176 100" fill="none" />
        <SvgText fill={ink} fontFamily={font} fontSize={16} letterSpacing={2.5}>
          <TextPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            {fit(name, 18)}
          </TextPath>
        </SvgText>
        <SvgText fill={ink} fontFamily={font} fontSize={14} letterSpacing={2}>
          <TextPath href={`#${botId}`} startOffset="50%" textAnchor="middle">
            {`★ ${date} ★`}
          </TextPath>
        </SvgText>
        <SvgText
          x={100}
          y={114}
          fill={ink}
          fontFamily={font}
          fontSize={40}
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing={3}
        >
          {code}
        </SvgText>
        <G transform="translate(100 72)">
          <Path d={PLANE} stroke={ink} strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
        <SvgText x={100} y={138} fill={ink} fontFamily={font} fontSize={11} textAnchor="middle">
          ARRIVED
        </SvgText>
      </Svg>
    );
  } else if (shape === 'rect') {
    art = (
      <Svg width={size} height={h} viewBox="0 0 200 144">
        <Rect
          x={4}
          y={4}
          width={192}
          height={136}
          rx={14}
          stroke={ink}
          strokeWidth={6}
          fill="none"
        />
        <Rect
          x={14}
          y={14}
          width={172}
          height={116}
          rx={8}
          stroke={ink}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="5 4"
        />
        <SvgText
          x={100}
          y={38}
          fill={ink}
          fontFamily={font}
          fontSize={13}
          letterSpacing={4}
          textAnchor="middle"
        >
          ✈ ADMITTED ✈
        </SvgText>
        <SvgText
          x={100}
          y={84}
          fill={ink}
          fontFamily={font}
          fontSize={44}
          fontWeight="bold"
          letterSpacing={4}
          textAnchor="middle"
        >
          {code}
        </SvgText>
        <SvgText
          x={100}
          y={104}
          fill={ink}
          fontFamily={font}
          fontSize={13}
          letterSpacing={1.5}
          textAnchor="middle"
        >
          {fit(name, 20)}
        </SvgText>
        <Path d="M 30 112 L 170 112" stroke={ink} strokeWidth={1.2} />
        <SvgText
          x={100}
          y={125}
          fill={ink}
          fontFamily={font}
          fontSize={12}
          letterSpacing={1.5}
          textAnchor="middle"
        >
          {date}
        </SvgText>
      </Svg>
    );
  } else {
    const oct = (r: number) =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 8) * (2 * i + 1);
        return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`;
      }).join(' ');
    art = (
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Polygon points={oct(98)} stroke={ink} strokeWidth={6} fill="none" />
        <Polygon points={oct(86)} stroke={ink} strokeWidth={1.5} fill="none" />
        <SvgText
          x={100}
          y={58}
          fill={ink}
          fontFamily={font}
          fontSize={13}
          letterSpacing={3}
          textAnchor="middle"
        >
          IMMIGRATION
        </SvgText>
        <Path d="M 42 68 L 158 68 M 42 136 L 158 136" stroke={ink} strokeWidth={1.5} />
        <SvgText
          x={100}
          y={112}
          fill={ink}
          fontFamily={font}
          fontSize={42}
          fontWeight="bold"
          letterSpacing={3}
          textAnchor="middle"
        >
          {code}
        </SvgText>
        <SvgText
          x={100}
          y={128}
          fill={ink}
          fontFamily={font}
          fontSize={11}
          letterSpacing={1}
          textAnchor="middle"
        >
          {fit(name, 18)}
        </SvgText>
        <SvgText
          x={100}
          y={156}
          fill={ink}
          fontFamily={font}
          fontSize={13}
          letterSpacing={1.5}
          textAnchor="middle"
        >
          {date}
        </SvgText>
      </Svg>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{ width: size, height: h, opacity: 0.9, transform: [{ rotate: `${rotate}deg` }] }}
    >
      {art}
    </View>
  );
}

const CLOUD =
  'M52 128 C26 128 14 108 22 90 C10 78 18 52 42 54 C46 30 76 22 92 38 C104 18 140 20 148 46 C172 42 190 62 182 84 C198 96 190 128 162 128 Z';

/** Easter-egg stamp for finding The Loop: a gold cloud, dated the day it was found. */
export function CloudNineStamp({
  date,
  size = 120,
  rotate = 8,
}: {
  date: string;
  size?: number;
  rotate?: number;
}) {
  const ink = passportColors.goldInk;
  const font = fonts.semibold;
  return (
    <View
      accessible
      accessibilityLabel={`Cloud Nine, found ${formatDate(date)}`}
      style={{
        width: size,
        height: size * 0.72,
        opacity: 0.92,
        transform: [{ rotate: `${rotate}deg` }],
      }}
    >
      <Svg width={size} height={size * 0.72} viewBox="0 0 200 144">
        <Path d={CLOUD} stroke={ink} strokeWidth={6} fill="none" strokeLinejoin="round" />
        <Path
          d={CLOUD}
          stroke={ink}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="4 4"
          transform="translate(100 78) scale(0.86) translate(-100 -78)"
        />
        <SvgText
          x={100}
          y={70}
          fill={ink}
          fontFamily={font}
          fontSize={13}
          letterSpacing={3}
          textAnchor="middle"
        >
          ★ CLOUD ★
        </SvgText>
        <SvgText
          x={100}
          y={100}
          fill={ink}
          fontFamily={font}
          fontSize={30}
          fontWeight="bold"
          letterSpacing={3}
          textAnchor="middle"
        >
          NINE
        </SvgText>
        <SvgText
          x={100}
          y={117}
          fill={ink}
          fontFamily={font}
          fontSize={11}
          letterSpacing={1.5}
          textAnchor="middle"
        >
          {formatDate(date).toUpperCase()}
        </SvgText>
      </Svg>
    </View>
  );
}
