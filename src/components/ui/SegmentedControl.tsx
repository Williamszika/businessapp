import * as Haptics from 'expo-haptics';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, shadow, spacing, useTheme } from '@/theme';

import { Text } from './Text';

export type SegmentOption<T extends string> = { label: string; value: T };

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({ options, value, onChange, style }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.surfaceSunken,
          borderRadius: radius.md,
          padding: 4,
          gap: 4,
        },
        style,
      ]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (!active) {
                Haptics.selectionAsync().catch(() => {});
                onChange(opt.value);
              }
            }}
            style={[
              {
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                alignItems: 'center',
                backgroundColor: active ? colors.surface : 'transparent',
              },
              active ? shadow(1, colors.shadow) : null,
            ]}>
            <Text variant="smallMedium" color={active ? 'text' : 'textSecondary'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
