import type { ReactNode } from 'react';
import { View } from 'react-native';
import { space } from '@/theme/tokens';
import { Body } from './Text';

export function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <View style={{ marginTop: space.section }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: space.md,
        }}
      >
        <Body variant="overline" muted accessibilityRole="header">
          {title}
        </Body>
        {right}
      </View>
      {children}
    </View>
  );
}
