export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  section: 32,
} as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

/** Body fonts. Display fonts come from useDisplayFont() — never hardcode them in components. */
export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
} as const;

export const displayFonts = {
  standard: { semibold: 'PlusJakartaSans-SemiBold', bold: 'PlusJakartaSans-Bold' },
  ploop: { semibold: 'Fredoka-SemiBold', bold: 'Fredoka-SemiBold' },
} as const;

export type DisplayFont = (typeof displayFonts)[keyof typeof displayFonts];

export const hairline = 1;
