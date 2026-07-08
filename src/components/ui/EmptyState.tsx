import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

export type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap };
};

export function EmptyState({ icon = 'sparkles-outline', title, message, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing['4xl'], paddingHorizontal: spacing.xl }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text variant="title" center>
        {title}
      </Text>
      {message ? (
        <Text secondary center style={{ marginTop: spacing.xs, maxWidth: 280 }}>
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button label={action.label} icon={action.icon} onPress={action.onPress} style={{ marginTop: spacing.xl }} />
      ) : null}
    </View>
  );
}
