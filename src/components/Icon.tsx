import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';
import { useTheme } from '@/theme/ThemeProvider';

export type IconName = ComponentProps<typeof Feather>['name'];

export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { c } = useTheme();
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? c.text}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

export const iconFont = Feather.font;
