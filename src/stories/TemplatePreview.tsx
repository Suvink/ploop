import { memo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { storyThemes, type StoryThemeName } from '@/theme/storyThemes';
import { palette } from '@/theme/colors';
import { fonts } from '@/theme/tokens';
import { useDisplayFont } from '@/theme/ThemeProvider';
import type { TemplateName } from './StoryRenderer';

/**
 * Lightweight thumbnail for a story template on the Share tab. Drawn at thumbnail size from a
 * few numbers, instead of rendering the full 1080×1920 story (maps, logos, stamps) three times.
 */
export const TemplatePreview = memo(function TemplatePreview({
  template,
  theme: themeName,
  width,
  route,
  flights,
}: {
  template: TemplateName;
  theme: StoryThemeName;
  width: number;
  route?: [string, string];
  flights: number;
}) {
  const t = storyThemes[themeName];
  const d = useDisplayFont();
  const h = Math.round(width * (16 / 9));
  const s = width / 110; // design at 110 wide

  if (template === 'passport') {
    return (
      <View
        style={{ width, height: h, backgroundColor: t.background, padding: 10 * s, gap: 6 * s }}
      >
        <Text
          allowFontScaling={false}
          style={{ fontFamily: d.bold, fontSize: 9 * s, color: t.text }}
        >
          Ploop
        </Text>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: fonts.semibold, fontSize: 5 * s, color: t.accent, letterSpacing: 1 }}
        >
          PASSPORT
        </Text>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: d.bold, fontSize: 24 * s, color: t.text, lineHeight: 28 * s }}
        >
          {flights}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4 * s }}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={{ flex: 1, height: 22 * s, borderRadius: 5 * s, backgroundColor: t.card }}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 4 * s }}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={{ flex: 1, height: 22 * s, borderRadius: 5 * s, backgroundColor: t.card }}
            />
          ))}
        </View>
        <Svg width={width - 20 * s} height={40 * s}>
          {[18, 48, 78].map((cx, i) => (
            <Circle
              key={cx}
              cx={cx * s}
              cy={(i % 2 ? 24 : 18) * s}
              r={13 * s}
              stroke={i % 2 ? t.text : t.accent}
              strokeWidth={2 * s}
              fill="none"
            />
          ))}
        </Svg>
      </View>
    );
  }

  if (template === 'map') {
    return (
      <View style={{ width, height: h, backgroundColor: t.background, padding: 10 * s }}>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: d.bold, fontSize: 9 * s, color: t.text }}
        >
          Ploop
        </Text>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: d.bold, fontSize: 12 * s, color: t.text, marginTop: 8 * s }}
        >
          Where I flew
        </Text>
        <Svg width={width - 20 * s} height={90 * s} style={{ marginTop: 10 * s }}>
          <Ellipse cx={45 * s} cy={45 * s} rx={42 * s} ry={34 * s} fill={t.mapLand} />
          <Path
            d={`M${14 * s} ${40 * s} q${20 * s} ${-26 * s} ${44 * s} ${-6 * s}`}
            fill={t.mapVisited}
          />
          <Path
            d={`M${18 * s} ${58 * s} Q${45 * s} ${12 * s} ${76 * s} ${44 * s} M${28 * s} ${30 * s} Q${50 * s} ${8 * s} ${66 * s} ${62 * s}`}
            stroke={t.accent}
            strokeWidth={2 * s}
            fill="none"
          />
        </Svg>
        <View style={{ flexDirection: 'row', gap: 4 * s, marginTop: 'auto' }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{ flex: 1, height: 24 * s, borderRadius: 5 * s, backgroundColor: t.card }}
            />
          ))}
        </View>
      </View>
    );
  }

  const [a, b] = route ?? ['CMB', 'DXB'];
  return (
    <View style={{ width, height: h, backgroundColor: t.background, padding: 10 * s }}>
      <Text allowFontScaling={false} style={{ fontFamily: d.bold, fontSize: 9 * s, color: t.text }}>
        Ploop
      </Text>
      <View
        style={{
          flex: 1,
          marginTop: 8 * s,
          borderRadius: 8 * s,
          backgroundColor: t.card,
          padding: 7 * s,
          gap: 6 * s,
        }}
      >
        <View
          style={{
            width: 14 * s,
            height: 14 * s,
            borderRadius: 4 * s,
            backgroundColor: palette.white,
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: d.bold, fontSize: 15 * s, color: t.text }}
          >
            {a}
          </Text>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: d.bold, fontSize: 15 * s, color: t.text }}
          >
            {b}
          </Text>
        </View>
        <View style={{ height: 34 * s, borderRadius: 4 * s, backgroundColor: t.mapLand }} />
        <Svg width={width - 34 * s} height={18 * s} style={{ marginTop: 'auto' }}>
          {Array.from({ length: 18 }, (_, i) => (
            <Rect
              key={i}
              x={i * 4.4 * s}
              y={0}
              width={(i % 3 ? 1.5 : 2.6) * s}
              height={18 * s}
              fill={t.text}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
});
