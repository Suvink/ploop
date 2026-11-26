import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Body } from './Text';

/** Marks an estimated duration or total. */
export function EstBadge() {
  const { c } = useTheme();
  return (
    <View
      accessibilityLabel="estimated"
      style={{
        borderWidth: 1,
        borderColor: c.warning,
        borderRadius: radius.sm,
        paddingHorizontal: 5,
        marginLeft: 6,
        alignSelf: 'center',
      }}
    >
      <Body variant="caption" color={c.warning} style={{ fontSize: 11, lineHeight: 15 }}>
        est.
      </Body>
    </View>
  );
}
