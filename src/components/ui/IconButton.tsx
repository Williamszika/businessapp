import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { hitSlop, radius, useTheme } from '@/theme';

export type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  variant?: 'plain' | 'surface' | 'primary';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({ icon, onPress, size = 22, color, variant = 'plain', accessibilityLabel, style }: IconButtonProps) {
  const { colors } = useTheme();
  const dim = size + 20;

  const bg = variant === 'surface' ? colors.surfaceAlt : variant === 'primary' ? colors.primary : 'transparent';
  const fg = color ?? (variant === 'primary' ? colors.onPrimary : colors.text);

  return (
    <Pressable
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          width: dim,
          height: dim,
          borderRadius: radius.full,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}>
      <Ionicons name={icon} size={size} color={fg} />
    </Pressable>
  );
}
