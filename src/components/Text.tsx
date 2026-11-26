import { Text, type TextProps, type TextStyle } from 'react-native';
import { useDisplayFont, useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

type BodyVariant = 'body' | 'label' | 'caption' | 'overline' | 'strong';

const BODY: Record<BodyVariant, TextStyle> = {
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  strong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
};

interface BodyProps extends TextProps {
  variant?: BodyVariant;
  muted?: boolean;
  color?: string;
}

/** Inter body text. */
export function Body({ variant = 'body', muted, color, style, ...rest }: BodyProps) {
  const { c } = useTheme();
  return (
    <Text
      {...rest}
      style={[BODY[variant], { color: color ?? (muted ? c.textMuted : c.text) }, style]}
    />
  );
}

type DisplaySize = 'xl' | 'lg' | 'md' | 'sm' | 'xs';
const SIZES: Record<DisplaySize, { fontSize: number; lineHeight: number; letterSpacing: number }> =
  {
    xl: { fontSize: 44, lineHeight: 50, letterSpacing: -1 },
    lg: { fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
    md: { fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
    sm: { fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
    xs: { fontSize: 16, lineHeight: 21, letterSpacing: 0 },
  };

interface DisplayProps extends TextProps {
  size?: DisplaySize;
  bold?: boolean;
  muted?: boolean;
  color?: string;
}

/** Titles, routes and big numbers — always in the display font from useDisplayFont(). */
export function Display({ size = 'md', bold, muted, color, style, ...rest }: DisplayProps) {
  const { c } = useTheme();
  const display = useDisplayFont();
  const family = bold ? display.bold : display.semibold;
  return (
    <Text
      // Remount when the font changes (Ploop mode): Android otherwise keeps the old text width
      // and clips the last letter ("Ploo").
      key={family}
      {...rest}
      style={[
        SIZES[size],
        { fontFamily: family, paddingRight: 2 },
        { color: color ?? (muted ? c.textMuted : c.text) },
        style,
      ]}
    />
  );
}
