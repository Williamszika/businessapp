import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, radius, spacing, useTheme } from '@/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth,
  haptic = true,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    gold: { bg: colors.accent, fg: '#3A2A05' },
    secondary: { bg: colors.surfaceAlt, fg: colors.text },
    outline: { bg: 'transparent', fg: colors.text, border: colors.borderStrong },
    ghost: { bg: 'transparent', fg: colors.primary },
    danger: { bg: colors.danger, fg: '#FFFFFF' },
  };
  const p = palette[variant];

  const dims: Record<ButtonSize, { h: number; px: number; fs: number; icon: number }> = {
    sm: { h: 38, px: spacing.md, fs: 13, icon: 16 },
    md: { h: 48, px: spacing.lg, fs: 15, icon: 18 },
    lg: { h: 56, px: spacing.xl, fs: 16, icon: 20 },
  };
  const d = dims[size];

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: d.h,
          paddingHorizontal: d.px,
          borderRadius: radius.md,
          backgroundColor: p.bg,
          borderWidth: p.border ? 1.5 : 0,
          borderColor: p.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={p.fg} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {icon && <Ionicons name={icon} size={d.icon} color={p.fg} />}
          <Text style={{ color: p.fg, fontFamily: font.semibold, fontSize: d.fs }}>{label}</Text>
          {iconRight && <Ionicons name={iconRight} size={d.icon} color={p.fg} />}
        </View>
      )}
    </Pressable>
  );
}
