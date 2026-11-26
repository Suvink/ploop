import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/**
 * Scrollable screen with 24px padding. `top` adds the status-bar inset (for screens without a
 * header). `tab` is for screens inside the tab bar, which already sits above the home indicator.
 */
export function Screen({
  children,
  top,
  tab,
  scroll = true,
  ...rest
}: { children: ReactNode; top?: boolean; tab?: boolean; scroll?: boolean } & ScrollViewProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: top ? insets.top + space.lg : space.lg,
    paddingBottom: (tab ? 0 : insets.bottom) + space.xl,
  };
  if (!scroll) {
    return <View style={[styles.base, { backgroundColor: c.background }, pad]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.base, pad]}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: space.xl, flexGrow: 1 },
});
