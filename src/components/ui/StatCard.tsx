import { Ionicons } from '@expo/vector-icons';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { Card } from './Card';
import { Text } from './Text';

export type StatTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export type StatCardProps = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: StatTone;
  delta?: { label: string; positive: boolean };
  caption?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function StatCard({ label, value, icon, tone = 'primary', delta, caption, onPress, style }: StatCardProps) {
  const { colors } = useTheme();
  const toneColor = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    accent: colors.accent,
  }[tone];
  const toneSoft = {
    primary: colors.primarySoft,
    success: colors.successSoft,
    warning: colors.warningSoft,
    danger: colors.dangerSoft,
    info: colors.infoSoft,
    accent: colors.accentSoft,
  }[tone];

  return (
    <Card padded onPress={onPress} style={[{ gap: spacing.md }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {icon ? (
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.sm,
              backgroundColor: toneSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name={icon} size={20} color={toneColor} />
          </View>
        ) : (
          <View />
        )}
        {delta ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Ionicons
              name={delta.positive ? 'trending-up' : 'trending-down'}
              size={14}
              color={delta.positive ? colors.success : colors.danger}
            />
            <Text variant="caption" color={delta.positive ? 'success' : 'danger'}>
              {delta.label}
            </Text>
          </View>
        ) : null}
      </View>
      <View>
        <Text variant="h2" numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text variant="smallMedium" secondary style={{ marginTop: 2 }}>
          {label}
        </Text>
        {caption ? (
          <Text variant="caption" muted style={{ marginTop: 2 }}>
            {caption}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
