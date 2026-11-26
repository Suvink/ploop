import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function Divider({ style }: { style?: ViewStyle }) {
  const { c } = useTheme();
  return <View style={[{ height: 1, backgroundColor: c.border }, style]} />;
}
