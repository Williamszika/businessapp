import { useState } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { radius, spacing, useTheme } from '@/theme';

export type BarDatum = { label: string; value: number; key?: string };

export type BarChartProps = {
  data: BarDatum[];
  height?: number;
  color?: string;
  formatValue?: (n: number) => string;
  /** Affiche une étiquette d'axe tous les N points. */
  labelEvery?: number;
  style?: StyleProp<ViewStyle>;
};

export function BarChart({ data, height = 150, color, formatValue = String, labelEvery, style }: BarChartProps) {
  const { colors } = useTheme();
  const barColor = color ?? colors.primary;
  const [selected, setSelected] = useState<number>(data.length - 1);

  const max = Math.max(1, ...data.map((d) => d.value));
  const sel = data[Math.min(selected, data.length - 1)] ?? data[data.length - 1];
  const step = labelEvery ?? Math.max(1, Math.ceil(data.length / 7));

  return (
    <View style={style}>
      <View style={{ marginBottom: spacing.md }}>
        <Text variant="h3">{sel ? formatValue(sel.value) : '—'}</Text>
        <Text variant="caption" muted>
          {sel?.label ?? ''}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 3 }}>
        {data.map((d, i) => {
          const h = Math.max(3, (d.value / max) * height);
          const active = i === selected;
          return (
            <Pressable key={d.key ?? d.label + i} onPress={() => setSelected(i)} style={{ flex: 1, height, justifyContent: 'flex-end' }}>
              <View
                style={{
                  height: h,
                  borderRadius: radius.xs,
                  backgroundColor: active ? barColor : barColor + '33',
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', marginTop: spacing.sm, gap: 3 }}>
        {data.map((d, i) => (
          <View key={(d.key ?? d.label) + '-lbl-' + i} style={{ flex: 1, alignItems: 'center' }}>
            {i % step === 0 ? (
              <Text variant="caption" muted numberOfLines={1}>
                {d.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
