import { View, type StyleProp, type ViewStyle } from 'react-native';

import { initials } from '@/lib/format';
import { colorForKey, radius, useTheme } from '@/theme';

import { Text } from './Text';

export type AvatarProps = {
  name: string;
  emoji?: string;
  size?: number;
  /** Couleur de fond forcée (sinon dérivée du nom). */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

/** Fait ressortir une couleur pastel de fond à partir d'une couleur vive. */
function tint(hex: string, isDark: boolean): string {
  const alpha = isDark ? '33' : '22';
  return hex.length === 7 ? hex + alpha : hex;
}

/** Choisit une couleur de texte lisible (foncée/claire) selon la luminance du fond. */
function readableText(hex: string): string {
  if (hex.length !== 7) return '#FFFFFF';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1B1E2B' : '#FFFFFF';
}

export function Avatar({ name, emoji, size = 44, color, style }: AvatarProps) {
  const { isDark } = useTheme();
  const base = color ?? colorForKey(name);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: emoji ? tint(base, isDark) : base,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      {emoji ? (
        <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
      ) : (
        <Text variant="bodySemibold" style={{ color: readableText(base), fontSize: size * 0.38 }}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
