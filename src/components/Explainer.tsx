import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { Explainer } from '@/lib/funFacts';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { showDialog } from './Dialog';
import type { IconName } from './Icon';
import { Body, Display } from './Text';

function ExplainerBody({ e }: { e: Explainer }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      {e.lines.map((l, i) => (
        <Body key={i}>{l}</Body>
      ))}
      <View
        style={{
          backgroundColor: c.iconBg,
          borderRadius: radius.md,
          padding: space.md,
          gap: 2,
        }}
      >
        <Body variant="overline" muted>
          The maths
        </Body>
        <Display size="xs" bold>
          {e.formula}
        </Display>
      </View>
    </View>
  );
}

/** "How was this calculated?" popup for a fun-fact tile, with an optional illustration. */
export function showExplainer(e: Explainer, icon: IconName, hero?: ReactNode) {
  showDialog({
    icon,
    hero,
    title: e.title,
    body: <ExplainerBody e={e} />,
    buttons: [{ text: 'Neat!', style: 'primary' }],
  });
}
