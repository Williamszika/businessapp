import { type ReactNode } from 'react';
import { View } from 'react-native';

import { spacing } from '@/theme';

import { Text } from './Text';

export type AppHeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

/** En-tête standard des écrans à onglets (grand titre + actions à droite). */
export function AppHeader({ title, subtitle, right }: AppHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <Text variant="label" color="primary" style={{ textTransform: 'uppercase', marginBottom: 2 }}>
            {subtitle}
          </Text>
        ) : null}
        <Text variant="h1">{title}</Text>
      </View>
      {right ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>{right}</View> : null}
    </View>
  );
}
