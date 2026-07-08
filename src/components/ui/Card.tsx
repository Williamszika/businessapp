import { type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, shadow, spacing, useTheme } from '@/theme';

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevated?: 0 | 1 | 2 | 3;
  variant?: 'surface' | 'alt' | 'sunken';
  onPress?: () => void;
};

export function Card({ children, style, padded = true, elevated = 1, variant = 'surface', onPress }: CardProps) {
  const { colors } = useTheme();
  const bg =
    variant === 'alt' ? colors.surfaceAlt : variant === 'sunken' ? colors.surfaceSunken : colors.surface;

  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: bg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: padded ? spacing.lg : 0,
    },
    elevated ? shadow(elevated, colors.shadow) : null,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}
