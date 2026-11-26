import { View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { Body, Display } from './Text';
import { Button } from './Button';

/** Simple arc with a plane, used for empty states. */
export function PlaneArc({ width = 220 }: { width?: number }) {
  const { c } = useTheme();
  const h = width * 0.45;
  return (
    <Svg
      width={width}
      height={h}
      viewBox="0 0 220 100"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d="M18 86 Q110 -20 202 86" stroke={c.border} strokeWidth={2} fill="none" />
      <Path
        d="M18 86 Q70 18 120 22"
        stroke={c.mapArc}
        strokeWidth={2.5}
        fill="none"
        strokeDasharray="5 6"
        strokeLinecap="round"
      />
      <Circle cx={18} cy={86} r={5} fill={c.mapDot} />
      <Circle cx={202} cy={86} r={5} fill="none" stroke={c.mapDot} strokeWidth={2} />
      <G transform="translate(120 22) rotate(8) scale(0.9)">
        <Path
          d="M-14 0 L14 0 M2 0 L-6 -12 M2 0 L-6 12 M-12 0 L-16 -6 M-12 0 L-16 6"
          stroke={c.primary}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}

export function EmptyState({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.section * 1.5, gap: space.lg }}>
      <PlaneArc />
      <Display size="sm" style={{ textAlign: 'center' }}>
        {title}
      </Display>
      {body && (
        <Body muted style={{ textAlign: 'center', maxWidth: 300 }}>
          {body}
        </Body>
      )}
      {action && onAction && (
        <Button label={action} variant="primary" icon="maximize" onPress={onAction} />
      )}
    </View>
  );
}
