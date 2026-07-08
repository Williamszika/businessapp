import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { gradients, radius, shadow, spacing, useTheme } from '@/theme';

export type GradientCardProps = {
  children: ReactNode;
  colors?: readonly [string, string, ...string[]];
  padded?: boolean;
  elevated?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function GradientCard({
  children,
  colors = gradients.brand,
  padded = true,
  elevated = true,
  onPress,
  style,
}: GradientCardProps) {
  const { colors: theme } = useTheme();

  const gradient = (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { borderRadius: radius.xl, padding: padded ? spacing.xl : 0, overflow: 'hidden' },
        elevated ? shadow(3, theme.shadow) : null,
        style,
      ]}>
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.94, transform: [{ scale: 0.995 }] } : undefined)}>
        {gradient}
      </Pressable>
    );
  }
  return gradient;
}
