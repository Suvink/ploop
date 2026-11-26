import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors, type ColorScheme, type ThemeColors } from './colors';
import { displayFonts, type DisplayFont } from './tokens';
import { useSettings } from '@/hooks/useSettings';

interface ThemeValue {
  scheme: ColorScheme;
  c: ThemeColors;
  display: DisplayFont;
}

const ThemeContext = createContext<ThemeValue>({
  scheme: 'dark',
  c: colors.dark,
  display: displayFonts.standard,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { settings } = useSettings();
  const value = useMemo<ThemeValue>(() => {
    const scheme: ColorScheme =
      settings.theme === 'system' ? (system === 'light' ? 'light' : 'dark') : settings.theme;
    return {
      scheme,
      c: colors[scheme],
      display: settings.ploopMode ? displayFonts.ploop : displayFonts.standard,
    };
  }, [settings.theme, settings.ploopMode, system]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Display font for titles, routes and big numbers. Follows the Ploop mode setting live. */
export function useDisplayFont(): DisplayFont {
  return useContext(ThemeContext).display;
}
