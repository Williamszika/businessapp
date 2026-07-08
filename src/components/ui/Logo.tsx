import { LinearGradient } from 'expo-linear-gradient';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { font, gradients, radius, shadow, useTheme } from '@/theme';

import { Text } from './Text';

export type LogoProps = {
  size?: number;
  /** Affiche le nom « ZKA » à côté du monogramme. */
  withWordmark?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Monogramme de marque ZKA : carré arrondi à dégradé avec un « Z » stylisé. */
export function Logo({ size = 56, withWordmark, style }: LogoProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: size * 0.28 }, style]}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size * 0.3,
            alignItems: 'center',
            justifyContent: 'center',
          },
          shadow(3, colors.primary),
        ]}>
        <Text style={{ color: '#FFFFFF', fontFamily: font.extrabold, fontSize: size * 0.5, letterSpacing: -1 }}>Z</Text>
      </LinearGradient>
      {withWordmark ? (
        <Text style={{ fontFamily: font.extrabold, fontSize: size * 0.62, letterSpacing: -1, color: colors.text }}>
          ZKA
        </Text>
      ) : null}
    </View>
  );
}
