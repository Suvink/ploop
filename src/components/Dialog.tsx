import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Body, Display } from './Text';
import { titleCase } from '@/lib/titleCase';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  /** Extra content under the message (lists, formulas…). */
  body?: ReactNode;
  icon?: IconName;
  /** Illustration shown at the top instead of the icon. */
  hero?: ReactNode;
  /** Defaults to a single "OK". */
  buttons?: DialogButton[];
}

let present: ((o: DialogOptions) => void) | null = null;

/**
 * Show a themed dialog from anywhere (a drop-in for Alert.alert). Needs <DialogHost/> mounted
 * once inside the ThemeProvider.
 */
export function showDialog(options: DialogOptions) {
  if (present) present(options);
  else if (__DEV__) console.warn('showDialog called before <DialogHost/> mounted');
}

export function DialogHost() {
  const { c } = useTheme();
  const [queue, setQueue] = useState<DialogOptions[]>([]);
  const current = queue[0];
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    present = (o) => setQueue((q) => [...q, o]);
    return () => {
      present = null;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      damping: 14,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [current, anim]);

  const close = (b?: DialogButton) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 140,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setQueue((q) => q.slice(1));
      b?.onPress?.();
    });
  };

  if (!current) return null;
  const buttons = current.buttons?.length
    ? current.buttons
    : [{ text: 'OK', style: 'primary' as const }];
  const cancel = buttons.find((b) => b.style === 'cancel');
  const stacked = buttons.length > 2;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => close(cancel)}
    >
      <Animated.View style={[styles.backdrop, { opacity: anim }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close"
          onPress={() => close(cancel ?? (buttons.length === 1 ? buttons[0] : undefined))}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            },
          ]}
        >
          {current.hero ??
            (current.icon && (
              <View style={[styles.icon, { backgroundColor: c.iconBg }]}>
                <Icon name={current.icon} size={24} color={c.accentText} />
              </View>
            ))}
          <Display size="sm" bold accessibilityRole="header">
            {current.title}
          </Display>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: space.md }}>
            {current.message ? <Body muted>{current.message}</Body> : null}
            {current.body}
          </ScrollView>
          <View style={[styles.buttons, stacked && { flexDirection: 'column-reverse' }]}>
            {buttons.map((b, i) => {
              const primary = b.style === 'primary' || (buttons.length === 1 && !b.style);
              const danger = b.style === 'destructive';
              return (
                <Pressable
                  key={`${b.text}-${i}`}
                  accessibilityRole="button"
                  onPress={() => close(b)}
                  style={({ pressed }) => [
                    styles.button,
                    !stacked && { flex: 1 },
                    {
                      backgroundColor: primary ? c.primary : danger ? c.danger : 'transparent',
                      borderColor: primary ? c.primary : danger ? c.danger : c.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Body
                    variant="strong"
                    color={primary ? c.onPrimary : danger ? c.onSelected : c.text}
                  >
                    {titleCase(b.text)}
                  </Body>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8,10,28,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.xl,
    gap: space.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  button: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
});
