import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';
import { palette } from '@/theme/colors';
import { fonts } from '@/theme/tokens';
import { TAGLINE } from '@/lib/brand';

const splash = require('../../assets/images/splash.png');
const LOGO = 200; // same size as the native splash image (app.json → imageWidth)
const MIN_SHOW_MS = 1700;

/** A cloud puff drifting right → left behind the plane, so it looks like it's flying. */
function Puff({
  y,
  size,
  delay,
  duration,
  width,
}: {
  y: number;
  size: number;
  delay: number;
  duration: number;
  width: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1));
    return () => cancelAnimation(t);
  }, [t, delay, duration]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.15, 0.85, 1], [0, 0.18, 0.18, 0]),
    transform: [{ translateX: interpolate(t.value, [0, 1], [width * 0.6, -width * 0.6]) }],
  }));
  return (
    <Animated.View
      style={[
        styles.puff,
        { top: y, width: size, height: size * 0.42, borderRadius: size, marginLeft: -size / 2 },
        style,
      ]}
    />
  );
}

/** Dotted flight path with a little plane looping along it: the progress indicator. */
function FlightPath({ progress, width }: { progress: SharedValue<number>; width: number }) {
  const w = Math.min(220, width * 0.55);
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const x = p * w;
    const y = -Math.sin(p * Math.PI) * 18;
    const angle = Math.cos(p * Math.PI) * -35;
    return {
      opacity: interpolate(p, [0, 0.08, 0.92, 1], [0, 1, 1, 0]),
      transform: [{ translateX: x - 9 }, { translateY: y - 9 }, { rotate: `${angle}deg` }],
    };
  });
  return (
    <View style={{ width: w, height: 40, justifyContent: 'flex-end' }}>
      <Svg width={w} height={40} style={StyleSheet.absoluteFill}>
        <Path
          d={`M 0 30 Q ${w / 2} 2 ${w} 30`}
          stroke={palette.cream}
          strokeOpacity={0.35}
          strokeWidth={2}
          strokeDasharray="2 8"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <Animated.View style={[styles.miniPlane, { top: 30 }, style]}>
        <Svg width={18} height={18} viewBox="-10 -10 20 20">
          <Path
            d="M-8 0 L8 0 M2 0 L-3 -7 M2 0 L-3 7 M-6 0 L-9 -4 M-6 0 L-9 4"
            stroke={palette.coral}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

/**
 * Branded preloader shown over the app while it starts. It begins exactly like the native
 * splash (same logo, size and colour), then the plane "ploops" in, bobs along through drifting
 * clouds while a tiny plane loops the progress path, and finally zooms away once `ready`.
 */
export function AnimatedSplash({ ready, onLayout }: { ready: boolean; onLayout?: () => void }) {
  const { width, height } = useWindowDimensions();
  const [done, setDone] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const pop = useSharedValue(0);
  const bob = useSharedValue(0);
  const path = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        timer = setTimeout(() => setMinElapsed(true), reduce ? 300 : MIN_SHOW_MS);
        if (reduce) {
          pop.value = 1;
          return;
        }
        // Squash, then spring up with an overshoot: the "ploop".
        pop.value = withSequence(
          withTiming(0.35, { duration: 140, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 7, stiffness: 160, mass: 0.7 }),
        );
        bob.value = withDelay(
          500,
          withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true),
        );
        path.value = withDelay(
          350,
          withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.cubic) }), -1),
        );
      });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cancelAnimation(bob);
      cancelAnimation(path);
    };
  }, [pop, bob, path]);

  useEffect(() => {
    if (!ready || !minElapsed) return;
    exit.value = withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) scheduleOnRN(setDone, true);
    });
  }, [ready, minElapsed, exit]);

  const logoStyle = useAnimatedStyle(() => {
    // pop: 0 → 0.35 (squash) → 1 (spring). Map to squash-and-stretch scales.
    const p = pop.value;
    const sx =
      p < 0.35 ? interpolate(p, [0, 0.35], [1, 1.12]) : interpolate(p, [0.35, 1], [1.12, 1]);
    const sy =
      p < 0.35 ? interpolate(p, [0, 0.35], [1, 0.86]) : interpolate(p, [0.35, 1], [0.86, 1]);
    const zoom = interpolate(exit.value, [0, 1], [1, 1.6]);
    return {
      transform: [
        { translateY: interpolate(bob.value, [0, 1], [-6, 6]) - exit.value * 60 },
        { rotate: `${interpolate(bob.value, [0, 1], [-2.5, 2.5])}deg` },
        { scaleX: sx * zoom },
        { scaleY: sy * zoom },
      ],
    };
  });
  const tagStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pop.value, [0.6, 1], [0, 1], 'clamp') * (1 - exit.value),
    transform: [{ translateY: interpolate(pop.value, [0.6, 1], [12, 0], 'clamp') }],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));

  if (done) return null;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
      pointerEvents={ready && minElapsed ? 'none' : 'auto'}
      onLayout={onLayout}
      accessible
      accessibilityLabel="Ploop is starting"
    >
      <Puff y={height * 0.5 - 150} size={120} delay={0} duration={2600} width={width} />
      <Puff y={height * 0.5 + 70} size={90} delay={700} duration={2100} width={width} />
      <Puff y={height * 0.5 - 40} size={160} delay={1300} duration={3000} width={width} />
      <Animated.View style={logoStyle}>
        <Image source={splash} style={{ width: LOGO, height: LOGO }} />
      </Animated.View>
      <Animated.View style={[styles.below, tagStyle]}>
        <FlightPath progress={path} width={width} />
        <Text allowFontScaling={false} style={styles.tag}>
          {TAGLINE}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  puff: { position: 'absolute', left: '50%', backgroundColor: palette.cream },
  below: { position: 'absolute', bottom: '22%', alignItems: 'center', gap: 14 },
  miniPlane: { position: 'absolute', left: 0, width: 18, height: 18 },
  tag: {
    color: palette.cream,
    opacity: 0.75,
    fontFamily: fonts.medium,
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
