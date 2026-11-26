/**
 * Ploop colour tokens (v2, calmer). Brand colours come from the logo; the UI uses them sparingly.
 * Usage: import { colors } from '@/theme/colors'; const c = colors[scheme]; // 'light' | 'dark'
 *
 * Rules:
 * - Never hardcode hex values in components; always read from these tokens.
 * - The UI is mostly neutral: background, surface, text, muted. Coral is an ACCENT:
 *   use it for the add-flight button, small highlights (e.g. "Next flight" label, map arcs)
 *   and nothing else. No coral-filled cards, no coral backgrounds in app screens.
 * - The selected tab and selected chips use `text` (not coral).
 * - Coral TEXT uses `accentText`, never `primary`.
 * - Separate content with whitespace and hairline `border`s, not boxes inside boxes.
 * - Story images (exports) may be bold: see `storyThemes`.
 * Contrast ratios are WCAG, against the mode's `background` unless noted.
 */

export const palette = {
  coral: '#FF7A66', // brand coral, slightly softened from the logo's #FF6B55
  coralLogo: '#FF6B55', // exact logo coral, for story images and the icon
  coralSoft: '#FF8A76',
  coralDeep: '#C2412D',
  cream: '#FDF3E4',
  navy: '#14183A', // logo background
  gold: '#E2BE77', // passport foil
  white: '#FFFFFF', // behind airline logos (they are drawn for white)
} as const;

/** The passport booklet (app Passport tab). Fixed colours: a passport looks the same in light and dark. */
export const passportColors = {
  cover: '#1A1F4D',
  coverDeep: '#11143A',
  foil: palette.gold,
  foilDim: 'rgba(226,190,119,0.35)',
  page: '#FBF1E1',
  pageEdge: '#EADBC2',
  ink: '#14183A',
  inkMuted: '#6A6F92',
  guilloche: 'rgba(194,65,45,0.16)',
  guilloche2: 'rgba(43,76,155,0.13)',
  mrz: '#2A2F55',
  /** Data page: warm cream-to-peach security paper with a night-sky map window. */
  dataA: '#FFF6E8',
  dataB: '#FFE6D3',
  dataC: '#FCD3C4',
  dataInk: '#14183A',
  dataMuted: '#6D6788',
  windowBg: '#161B45',
  windowLand: '#3A4180',
  windowVisited: '#FF8A76',
  windowArc: '#FDF3E4',
  seal: '#C2412D',
  /** Cloud Nine easter-egg stamp. */
  goldInk: '#B07D1E',
  /** Stamp inks, picked per country. */
  stampInks: ['#C2412D', '#2B4C9B', '#1F7A57', '#7A3E9D', '#B26B00', '#14183A'],
} as const;

export const colors = {
  light: {
    background: '#FAF6EF', // warm off-white
    surface: '#FFFFFF', // cards
    border: '#ECE4D6', // hairlines
    text: '#1C2036', // 14.9:1
    textMuted: '#5F6487', // ~4.8:1
    primary: palette.coral, // FAB, primary button fill
    onPrimary: '#13162B', // 7.0:1 on coral
    accentText: palette.coralDeep, // 4.8:1
    selected: '#1C2036', // selected chip / tab
    onSelected: '#FAF6EF',
    iconBg: '#F1E9DC', // circle behind tile icons
    mapLand: '#EFE7DA',
    mapArc: '#E0553F',
    mapDot: '#1C2036',
    success: '#1F8A5F',
    warning: '#B26B00', // unknown airport codes, "est." badges
    danger: '#C8322F',
  },
  dark: {
    background: '#13162B', // softer, less saturated than the logo navy
    surface: '#1B1F38',
    border: '#22264A',
    text: '#ECE6DC', // 14.4:1 (warm off-white, not pure cream)
    textMuted: '#8E93B5', // 5.9:1
    primary: palette.coral,
    onPrimary: '#13162B', // 7.0:1
    accentText: palette.coralSoft, // 7.8:1
    selected: '#ECE6DC',
    onSelected: '#13162B',
    iconBg: '#252A4D',
    mapLand: '#262B4A',
    mapArc: palette.coralSoft,
    mapDot: '#ECE6DC',
    success: '#3DBE8B',
    warning: '#FFC24B',
    danger: '#FF6369',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = (typeof colors)[ColorScheme];

/** Story image themes (1080×1920 exports). Fixed, independent of app light/dark mode. Default: paper. */
export const storyThemes = {
  paper: {
    background: '#FDF3E4',
    text: '#14183A',
    muted: '#5B6085',
    accent: '#C2412D',
    card: '#FFFFFF',
    soft: '#F6E4CC', // secondary panels, chips
    mapLand: '#E6D5BB',
    mapVisited: '#F2A493',
    logoBg: '#FFFFFF',
    onAccent: '#FFFFFF',
  },
  midnight: {
    background: '#14183A',
    text: '#FDF3E4',
    muted: '#9AA0C3',
    accent: '#FF8A76',
    card: '#262C5E',
    soft: '#1E2350',
    mapLand: '#2C336E',
    mapVisited: '#5D67BE',
    logoBg: '#FFFFFF',
    onAccent: '#14183A',
  },
  sunset: {
    background: palette.coralLogo,
    text: '#14183A',
    muted: '#5A1F17',
    accent: '#FDF3E4',
    card: 'rgba(253,243,228,0.55)',
    soft: 'rgba(253,243,228,0.3)',
    mapLand: 'rgba(20,24,58,0.2)',
    mapVisited: '#14183A',
    logoBg: '#FFFFFF',
    onAccent: '#14183A',
  },
} as const;

export type StoryThemeName = keyof typeof storyThemes;
