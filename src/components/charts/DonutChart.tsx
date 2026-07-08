import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';

export type DonutSlice = { label: string; value: number; color: string };

export type DonutChartProps = {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function DonutChart({ data, size = 168, thickness = 22, centerValue, centerLabel, style }: DonutChartProps) {
  const { colors } = useTheme();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          <Circle cx={cx} cy={cy} r={r} stroke={colors.surfaceSunken} strokeWidth={thickness} fill="none" />
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * circumference;
            const circle = (
              <Circle
                key={d.label + i}
                cx={cx}
                cy={cy}
                r={r}
                stroke={d.color}
                strokeWidth={thickness}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
        </G>
      </Svg>
      {centerValue || centerLabel ? (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          {centerValue ? <Text variant="h3">{centerValue}</Text> : null}
          {centerLabel ? (
            <Text variant="caption" muted>
              {centerLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
