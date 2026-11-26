import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export type IllustrationKind = 'earth' | 'moon' | 'days' | 'longest' | 'night';

const W = 240;
const H = 132;
const PLANE = 'M-10 0 L10 0 M2 0 L-4 -8 M2 0 L-4 8 M-7 0 L-11 -4 M-7 0 L-11 4';

function Plane({
  x,
  y,
  angle = 0,
  color,
}: {
  x: number;
  y: number;
  angle?: number;
  color: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d={PLANE} stroke={color} strokeWidth={3.2} strokeLinecap="round" fill="none" />
    </G>
  );
}

/** A looping 0→1 value; stays still when reduce motion is on. */
function useLoop(duration: number, mode: 'loop' | 'bounce' = 'loop') {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled || reduce) return;
        const t = Animated.timing(v, {
          toValue: 1,
          duration,
          easing: mode === 'loop' ? Easing.linear : Easing.inOut(Easing.sin),
          useNativeDriver: true,
        });
        anim =
          mode === 'loop'
            ? Animated.loop(t)
            : Animated.loop(
                Animated.sequence([
                  t,
                  Animated.timing(v, {
                    toValue: 0,
                    duration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                  }),
                ]),
              );
        anim.start();
      });
    return () => {
      cancelled = true;
      anim?.stop();
    };
  }, [v, duration, mode]);
  return v;
}

function Earth() {
  const { c } = useTheme();
  const spin = useLoop(5200);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.box}>
      <Svg width={W} height={H}>
        <Circle cx={W / 2} cy={H / 2} r={44} fill={c.mapLand} stroke={c.text} strokeWidth={2} />
        <Ellipse
          cx={W / 2}
          cy={H / 2}
          rx={18}
          ry={44}
          stroke={c.textMuted}
          strokeWidth={1.4}
          fill="none"
        />
        <Line
          x1={W / 2 - 44}
          y1={H / 2}
          x2={W / 2 + 44}
          y2={H / 2}
          stroke={c.textMuted}
          strokeWidth={1.4}
        />
        <Path
          d={`M${W / 2 - 30} ${H / 2 - 14} q10 -12 22 -4 q8 6 18 -2 M${W / 2 - 16} ${H / 2 + 18} q12 8 26 -4`}
          stroke={c.accentText}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        <Circle
          cx={W / 2}
          cy={H / 2}
          r={58}
          stroke={c.accentText}
          strokeWidth={1.6}
          strokeDasharray="3 6"
          fill="none"
        />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={W} height={H}>
          <Plane x={W / 2} y={H / 2 - 58} angle={0} color={c.primary} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Moon({ progress }: { progress: number }) {
  const { c } = useTheme();
  const p = Math.min(0.95, Math.max(0.06, progress));
  // Quadratic curve from Earth (bottom-left) to the Moon (top-right).
  const P0 = [34, 110];
  const P1 = [110, -10];
  const P2 = [206, 34];
  const at = (t: number) => [
    (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
    (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1],
  ];
  const [x, y] = at(p);
  const [x2, y2] = at(Math.min(1, p + 0.02));
  const angle = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
  const done = Array.from({ length: 24 }, (_, i) => at((p * i) / 23));
  const bob = useLoop(1100, 'bounce');
  const ty = bob.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] });
  return (
    <View style={styles.box}>
      <Svg width={W} height={H}>
        {[
          [70, 18],
          [150, 100],
          [190, 88],
          [20, 30],
        ].map(([sx, sy]) => (
          <Circle key={`${sx}-${sy}`} cx={sx} cy={sy} r={1.8} fill={c.textMuted} />
        ))}
        <Path
          d={`M${P0[0]} ${P0[1]} Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`}
          stroke={c.textMuted}
          strokeWidth={2}
          strokeDasharray="2 7"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={done
            .map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`)
            .join(' ')}
          stroke={c.accentText}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={P0[0]} cy={P0[1]} r={16} fill={c.mapLand} stroke={c.text} strokeWidth={2} />
        <Circle cx={P2[0]} cy={P2[1]} r={22} fill={c.surface} stroke={c.text} strokeWidth={2} />
        <Circle cx={P2[0] - 7} cy={P2[1] - 5} r={4} fill={c.mapLand} />
        <Circle cx={P2[0] + 8} cy={P2[1] + 6} r={5} fill={c.mapLand} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: ty }] }]}>
        <Svg width={W} height={H}>
          <Plane x={x} y={y} angle={angle} color={c.primary} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Days() {
  const { c } = useTheme();
  const spin = useLoop(4000);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const cx = W / 2;
  const cy = H / 2;
  return (
    <View style={styles.box}>
      <Svg width={W} height={H}>
        <Path d={`M${cx - 96} ${cy + 30} q16 -18 34 -4 q14 -16 32 0 h-66 z`} fill={c.mapLand} />
        <Path d={`M${cx + 60} ${cy - 20} q14 -16 30 -4 q12 -12 28 2 h-58 z`} fill={c.mapLand} />
        <Circle cx={cx} cy={cy} r={46} fill={c.surface} stroke={c.text} strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <Line
              key={i}
              x1={cx + Math.cos(a) * 38}
              y1={cy + Math.sin(a) * 38}
              x2={cx + Math.cos(a) * 42}
              y2={cy + Math.sin(a) * 42}
              stroke={c.textMuted}
              strokeWidth={2}
            />
          );
        })}
        <Line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 22}
          stroke={c.text}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        <Circle cx={cx} cy={cy} r={4} fill={c.text} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={W} height={H}>
          <Line
            x1={cx}
            y1={cy}
            x2={cx + 30}
            y2={cy}
            stroke={c.primary}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Longest() {
  const { c } = useTheme();
  const t = useLoop(2600);
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [-70, 70] });
  const ty = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [18, -22, 18] });
  const pin = (x: number) => (
    <G transform={`translate(${x} 100)`}>
      <Path d="M0 0 C-12 -14 -12 -30 0 -30 C12 -30 12 -14 0 0 Z" fill={c.accentText} />
      <Circle cx={0} cy={-20} r={4} fill={c.surface} />
    </G>
  );
  return (
    <View style={styles.box}>
      <Svg width={W} height={H}>
        <Rect x={10} y={102} width={W - 20} height={3} rx={1.5} fill={c.mapLand} />
        <Path
          d={`M40 80 Q${W / 2} -20 ${W - 40} 80`}
          stroke={c.textMuted}
          strokeWidth={2}
          strokeDasharray="3 7"
          strokeLinecap="round"
          fill="none"
        />
        {pin(40)}
        {pin(W - 40)}
      </Svg>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }, { translateY: ty }] }]}
      >
        <Svg width={W} height={H}>
          <Plane x={W / 2} y={34} color={c.primary} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Night() {
  const { c } = useTheme();
  const twinkle = useLoop(900, 'bounce');
  const t = useLoop(3800);
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [-W / 2 - 20, W / 2 + 20] });
  return (
    <View style={styles.box}>
      <Svg width={W} height={H}>
        <Path d="M150 20 a38 38 0 1 0 38 52 a30 30 0 1 1 -38 -52 z" fill={c.accentText} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: twinkle }]}>
        <Svg width={W} height={H}>
          {[
            [40, 30],
            [80, 70],
            [110, 22],
            [200, 100],
            [30, 100],
          ].map(([sx, sy]) => (
            <Path
              key={`${sx}-${sy}`}
              d={`M${sx} ${sy - 6} L${sx + 2} ${sy - 2} L${sx + 6} ${sy} L${sx + 2} ${sy + 2} L${sx} ${sy + 6} L${sx - 2} ${sy + 2} L${sx - 6} ${sy} L${sx - 2} ${sy - 2} Z`}
              fill={c.textMuted}
            />
          ))}
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: tx }] }]}>
        <Svg width={W} height={H}>
          <Plane x={W / 2} y={86} color={c.primary} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Small animated scene for the fun-fact explainer popups. */
export function FunIllustration({
  kind,
  progress = 0,
}: {
  kind: IllustrationKind;
  /** 0–1, used by the Moon scene to place the plane. */
  progress?: number;
}) {
  const { c } = useTheme();
  return (
    <View
      style={[styles.frame, { backgroundColor: c.iconBg }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {kind === 'earth' && <Earth />}
      {kind === 'moon' && <Moon progress={progress} />}
      {kind === 'days' && <Days />}
      {kind === 'longest' && <Longest />}
      {kind === 'night' && <Night />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: 16, alignItems: 'center', paddingVertical: 8, overflow: 'hidden' },
  box: { width: W, height: H },
});
