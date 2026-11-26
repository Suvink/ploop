import { storyThemes } from './colors';
export { storyThemes, type StoryThemeName } from './colors';

export const STORY_THEME_LABELS: Record<keyof typeof storyThemes, string> = {
  paper: 'Paper',
  midnight: 'Midnight',
  sunset: 'Sunset',
};

export const STORY_THEME_ORDER = ['paper', 'midnight', 'sunset'] as const;
