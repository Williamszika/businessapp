import { useState } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { spacing, useTheme } from '@/theme';

export type LinePoint = { label: string; value: number; key?: string };

export type LineChartProps = {
  data: LinePoint[];
  height?: number;
  color?: string;
  formatValue?: (n: number) => string;
  labelEvery?: number;
  style?: StyleProp<ViewStyle>;
};

/** Construit un tracé lissé (Catmull-Rom → Bézier cubique). */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function LineChart({ data, height = 170, color, formatValue = String, labelEvery, style }: LineChartProps) {
  const { colors } = useTheme();
  const line = color ?? colors.primary;
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const padTop = 12;
  const padBottom = 12;
  const chartH = height - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = Math.max(1, max - min);
  const step = labelEvery ?? Math.max(1, Math.ceil(data.length / 6));

  const points =
    width > 0
      ? data.map((d, i) => ({
          x: data.length === 1 ? width / 2 : (i / (data.length - 1)) * width,
          y: padTop + chartH - ((d.value - min) / range) * chartH,
        }))
      : [];

  const linePath = smoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';
  const last = points[points.length - 1];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={style}>
      <View style={{ marginBottom: spacing.md }}>
        <Text variant="h3">{formatValue(total)}</Text>
        <Text variant="caption" muted>
          Total sur la période
        </Text>
      </View>

      <View onLayout={onLayout} style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={line} stopOpacity={0.28} />
                <Stop offset="1" stopColor={line} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>
            <Path d={areaPath} fill="url(#areaFill)" />
            <Path d={linePath} stroke={line} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {last ? (
              <>
                <Circle cx={last.x} cy={last.y} r={6} fill={line} opacity={0.18} />
                <Circle cx={last.x} cy={last.y} r={3.5} fill={line} stroke={colors.surface} strokeWidth={1.5} />
              </>
            ) : null}
          </Svg>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
        {data.map((d, i) => (
          <View key={(d.key ?? d.label) + i} style={{ flex: 1, alignItems: 'center' }}>
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
