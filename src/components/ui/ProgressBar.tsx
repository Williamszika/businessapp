import { View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, useTheme } from '@/theme';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger' | 'accent';

export type ProgressBarProps = {
  /** Valeur entre 0 et 1. */
  value: number;
  tone?: ProgressTone;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({ value, tone = 'primary', height = 8, color, trackColor, style }: ProgressBarProps) {
  const { colors } = useTheme();
  const toneColor = { primary: colors.primary, success: colors.success, warning: colors.warning, danger: colors.danger, accent: colors.accent }[tone];
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <View
      style={[
        { height, borderRadius: radius.full, backgroundColor: trackColor ?? colors.surfaceSunken, overflow: 'hidden' },
        style,
      ]}>
      <View style={{ width: `${clamped * 100}%`, height: '100%', borderRadius: radius.full, backgroundColor: color ?? toneColor }} />
    </View>
  );
}
