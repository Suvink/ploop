import { Image, Text, View } from 'react-native';
import { airlineColor, airlineLogo, airlineName } from '@/data/refdata';
import { palette } from '@/theme/colors';
import { fonts } from '@/theme/tokens';

/**
 * Airline logo on a white tile (logos are designed for white). Falls back to a monogram in the
 * airline's colour when no logo is bundled.
 */
export function AirlineLogo({
  iata,
  size = 40,
  round = false,
}: {
  iata: string | null | undefined;
  size?: number;
  round?: boolean;
}) {
  const logo = airlineLogo(iata);
  const r = round ? size / 2 : size * 0.26;
  const label = airlineName(iata ?? null) ?? 'Airline';
  if (logo) {
    return (
      <View
        accessible
        accessibilityLabel={label}
        style={{
          width: size,
          height: size,
          borderRadius: r,
          backgroundColor: palette.white,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Image
          source={logo}
          style={{ width: size * 0.76, height: size * 0.76 }}
          resizeMode="contain"
        />
      </View>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: airlineColor(iata) ?? palette.navy,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        allowFontScaling={false}
        style={{
          color: palette.white,
          fontFamily: fonts.semibold,
          fontSize: size * 0.36,
          letterSpacing: 0.5,
        }}
      >
        {(iata ?? '✈').toUpperCase()}
      </Text>
    </View>
  );
}
