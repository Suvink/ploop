import { useEffect } from 'react';
import { Image, Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

const logo = require('../../assets/images/logo.png');
const DURATION = 2600;
const PLANE = 76;
const DOTS = 44;
// Share of the flight spent on the run-up, the loop, and the exit.
const LOOP_START = 0.3;
const LOOP_END = 0.75;

/** Where the plane is at progress t (0–1): fly in, loop the loop, fly out. */
function at(t: number, w: number, cy: number, r: number): { x: number; y: number; angle: number } {
  'worklet';
  const cx = w / 2;
  if (t < LOOP_START) {
    const k = t / LOOP_START;
    return { x: -PLANE + (cx + PLANE) * k, y: cy, angle: 0 };
  }
  if (t < LOOP_END) {
    const theta = ((t - LOOP_START) / (LOOP_END - LOOP_START)) * Math.PI * 2;
    return {
      x: cx + r * Math.sin(theta),
      y: cy - r + r * Math.cos(theta),
      angle: (-theta * 180) / Math.PI,
    };
  }
  const k = (t - LOOP_END) / (1 - LOOP_END);
  return { x: cx + (w / 2 + PLANE) * k, y: cy, angle: 0 };
}

function TrailDot({
  t,
  progress,
  w,
  cy,
  r,
  color,
}: {
  t: number;
  progress: SharedValue<number>;
  w: number;
  cy: number;
  r: number;
  color: string;
}) {
  const p = at(t, w, cy, r);
  const style = useAnimatedStyle(() => ({
    opacity:
      progress.value < t
        ? 0
        : interpolate(progress.value - t, [0, 0.05, 0.5], [0, 0.9, 0], 'clamp'),
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        { left: p.x - 3, top: p.y + PLANE * 0.18, backgroundColor: color },
        style,
      ]}
    />
  );
}

/**
 * Easter egg: the Ploop plane flies a loop-the-loop across the screen, trailing a dotted
 * contrail, with a "ploop!" and a haptic bump at the top of the loop.
 */
export function LoopTheLoop({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { c } = useTheme();
  const { width, height } = useWindowDimensions();
  const r = Math.min(width * 0.28, 130);
  const cy = height * 0.55;
  const progress = useSharedValue(0);
  const bubble = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    progress.value = 0;
    bubble.value = 0;
    progress.value = withTiming(
      1,
      { duration: DURATION, easing: Easing.inOut(Easing.quad) },
      (f) => {
        if (f) scheduleOnRN(onDone);
      },
    );
    const top = DURATION * (LOOP_START + (LOOP_END - LOOP_START) / 2);
    bubble.value = withDelay(
      top - 80,
      withSequence(withSpring(1, { damping: 8, stiffness: 200 }), withDelay(700, withTiming(0))),
    );
    const t1 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, top);
    const t2 = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, DURATION);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible, progress, bubble, onDone]);

  const planeStyle = useAnimatedStyle(() => {
    const p = at(progress.value, width, cy, r);
    return {
      transform: [
        { translateX: p.x - PLANE / 2 },
        { translateY: p.y - PLANE / 2 },
        { rotate: `${p.angle}deg` },
      ],
    };
  });
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubble.value,
    transform: [{ scale: interpolate(bubble.value, [0, 1], [0.4, 1]) }],
  }));

  if (!visible) return null;
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: DOTS }, (_, i) => (
          <TrailDot
            key={i}
            t={(i + 1) / (DOTS + 1)}
            progress={progress}
            w={width}
            cy={cy}
            r={r}
            color={c.accentText}
          />
        ))}
        <Animated.View
          style={[
            styles.bubble,
            { left: width / 2 - 60, top: cy - 2 * r - 90, backgroundColor: c.primary },
            bubbleStyle,
          ]}
        >
          <Text allowFontScaling={false} style={[styles.bubbleText, { color: c.onPrimary }]}>
            ploop!
          </Text>
        </Animated.View>
        <Animated.View style={[styles.plane, planeStyle]}>
          <Image source={logo} style={{ width: PLANE, height: PLANE }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  plane: { position: 'absolute', left: 0, top: 0, width: PLANE, height: PLANE },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  bubble: {
    position: 'absolute',
    width: 120,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  bubbleText: { fontFamily: fonts.semibold, fontSize: 20, letterSpacing: 1 },
});
