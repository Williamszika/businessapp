import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing, useTheme } from '@/theme';

import { Text } from './Text';

export type ListRowProps = {
  left?: ReactNode;
  title: string;
  subtitle?: string;
  titleRight?: string;
  subtitleRight?: string;
  rightColor?: string;
  right?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
  left,
  title,
  subtitle,
  titleRight,
  subtitleRight,
  rightColor,
  right,
  chevron,
  onPress,
  style,
}: ListRowProps) {
  const { colors } = useTheme();

  const content = (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }, style]}>
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodySemibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" secondary numberOfLines={1} style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (
        <View style={{ alignItems: 'flex-end' }}>
          {titleRight ? (
            <Text variant="bodySemibold" style={rightColor ? { color: rightColor } : undefined}>
              {titleRight}
            </Text>
          ) : null}
          {subtitleRight ? (
            <Text variant="caption" muted style={{ marginTop: 1 }}>
              {subtitleRight}
            </Text>
          ) : null}
        </View>
      )}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}>
        {content}
      </Pressable>
    );
  }
  return content;
}
