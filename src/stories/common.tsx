import type { ComponentProps, ComponentRef, ReactNode, Ref } from 'react';
import Feather from '@expo/vector-icons/Feather';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  View,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { useDisplayFont } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { storyThemes, type StoryThemeName } from '@/theme/storyThemes';

export const STORY_W = 1080;
export const STORY_H = 1920;
/** Keep text and key graphics within this vertical band (platform UI overlays the rest). */
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = 1670;
export const SIDE = 96;

export type StoryTheme = (typeof storyThemes)[StoryThemeName];

export interface StoryOptions {
  theme: StoryThemeName;
  hideExactDates: boolean;
  year?: number;
  flightId?: string;
}

const logo = require('../../assets/images/logo.png');

/** Fixed-size text for story canvases (font scaling disabled). */
export function SText({
  display,
  bold,
  size,
  color,
  style,
  ...rest
}: TextProps & { display?: boolean; bold?: boolean; size: number; color: string }) {
  const d = useDisplayFont();
  const family = display ? (bold ? d.bold : d.semibold) : bold ? fonts.semibold : fonts.regular;
  const base: TextStyle = {
    fontFamily: family,
    fontSize: size,
    lineHeight: Math.round(size * 1.18),
    color,
  };
  // Keyed by font so a Ploop-mode switch remeasures instead of clipping the last glyph.
  return (
    <Text
      key={family}
      allowFontScaling={false}
      {...rest}
      style={[base, { paddingRight: Math.ceil(size * 0.04) }, style]}
    />
  );
}

export type CanvasRef = Ref<ComponentRef<typeof View>>;

/**
 * The captured view is sized in dp so that it is exactly 1080×1920 *pixels* on this device;
 * the content inside is laid out in 1080×1920 units and scaled down by the pixel ratio.
 * This keeps the bitmap small and the export pixel-exact.
 */
export function canvasDp() {
  const pr = PixelRatio.get();
  return { w: STORY_W / pr, h: STORY_H / pr, scale: 1 / pr };
}

/** The 1080×1920 canvas. Capture this view's ref. */
export function StoryCanvas({
  theme,
  children,
  ref,
}: {
  theme: StoryTheme;
  children: ReactNode;
  ref?: CanvasRef;
}) {
  const { w, h, scale } = canvasDp();
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: w, height: h, overflow: 'hidden', backgroundColor: theme.background }}
    >
      <View
        style={[
          styles.canvas,
          {
            transform: [
              { translateX: (w - STORY_W) / 2 },
              { translateY: (h - STORY_H) / 2 },
              { scale },
            ],
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export function Wordmark({ theme }: { theme: StoryTheme }) {
  return (
    <View style={styles.wordmark}>
      <Image source={logo} style={{ width: 72, height: 72 }} />
      <SText display bold size={46} color={theme.text}>
        Ploop
      </SText>
    </View>
  );
}

export type SIconName = ComponentProps<typeof Feather>['name'];

/** Feather icon at story scale. */
export function SIcon({ name, size, color }: { name: SIconName; size: number; color: string }) {
  return <Feather name={name} size={size} color={color} />;
}

/** Rounded label with an optional icon. */
export function Pill({
  theme,
  icon,
  children,
  inverted,
}: {
  theme: StoryTheme;
  icon?: SIconName;
  children: ReactNode;
  inverted?: boolean;
}) {
  const bg = inverted ? theme.text : theme.soft;
  const fg = inverted ? theme.background : theme.text;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon && <SIcon name={icon} size={30} color={fg} />}
      <SText bold size={28} color={fg} style={{ letterSpacing: 3 }}>
        {children}
      </SText>
    </View>
  );
}

/** Icon in a soft circle. */
export function IconBubble({
  theme,
  name,
  size = 84,
}: {
  theme: StoryTheme;
  name: SIconName;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.soft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SIcon name={name} size={size * 0.48} color={theme.accent} />
    </View>
  );
}

/** Big faint orbit lines and a dotted flight path behind the content. */
export function Backdrop({ theme }: { theme: StoryTheme }) {
  return (
    <Svg width={STORY_W} height={STORY_H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Circle cx={980} cy={240} r={340} stroke={theme.soft} strokeWidth={56} fill="none" />
      <Circle cx={980} cy={240} r={520} stroke={theme.soft} strokeWidth={6} fill="none" />
      <Circle cx={60} cy={1760} r={300} stroke={theme.soft} strokeWidth={40} fill="none" />
      <Path
        d="M -40 1500 Q 540 1050 1120 1320"
        stroke={theme.accent}
        strokeOpacity={0.35}
        strokeWidth={6}
        strokeDasharray="4 22"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  canvas: { width: STORY_W, height: STORY_H, overflow: 'hidden' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 999,
  },
});
