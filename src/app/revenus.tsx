import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { DonutChart, LineChart } from '@/components/charts';
import type { DonutSlice } from '@/components/charts';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import {
  dailySeries,
  daysAgo,
  grossMargin,
  monthlySeries,
  paymentBreakdown,
  periodDelta,
  salesBetween,
  salesByEmployee,
  sumTotals,
  topProducts,
} from '@/lib/analytics';
import { formatMoney, formatMoneyCompact, formatNumber, formatPercent } from '@/lib/format';
import type { PaymentMethod } from '@/types';
import { useCurrency, useCurrentUser, useData } from '@/store';
import { radius, spacing, useTheme } from '@/theme';

type Range = '7j' | '30j' | '6m';

export default function RevenusScreen() {
  const { colors } = useTheme();
  const currency = useCurrency();
  const user = useCurrentUser();
  const allSales = useData((s) => s.sales);
  const employees = useData((s) => s.employees);
  const products = useData((s) => s.products);
  const [range, setRange] = useState<Range>('30j');

  const isPatron = user?.role === 'patron';
  const scoped = useMemo(
    () => (isPatron ? allSales : allSales.filter((s) => s.employeeId === user?.employeeId)),
    [allSales, isPatron, user?.employeeId],
  );

  const days = range === '7j' ? 7 : range === '30j' ? 30 : 180;
  const chartData = range === '6m' ? monthlySeries(scoped, 6) : dailySeries(scoped, days);
  // Fenêtre alignée sur les buckets du graphique, pour que total/marge/delta soient cohérents.
  const periodSales = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 86400000);
    const start = range === '6m' ? new Date(now.getFullYear(), now.getMonth() - 5, 1) : daysAgo(days - 1, now);
    return salesBetween(scoped, start, end);
  }, [scoped, range, days]);
  const total = sumTotals(periodSales);
  const delta = useMemo(() => {
    if (range === '6m') {
      const ms = monthlySeries(scoped, 2);
      const cur = ms[1]?.value ?? 0;
      const prev = ms[0]?.value ?? 0;
      const ratio = prev === 0 ? (cur > 0 ? 1 : 0) : (cur - prev) / prev;
      return { ratio, positive: cur >= prev };
    }
    return periodDelta(scoped, days);
  }, [scoped, range, days]);
  const margin = grossMargin(periodSales, products);
  const count = periodSales.length;
  const avg = count > 0 ? Math.round(total / count) : 0;

  const sellers = salesByEmployee(periodSales, employees).filter((s) => s.revenue > 0);
  const topRev = sellers[0]?.revenue ?? 1;
  const products5 = topProducts(periodSales, products, 5);
  const maxProd = products5[0]?.revenue ?? 1;

  const methodColors: Record<PaymentMethod, string> = {
    'espèces': colors.success,
    mobile: colors.info,
    carte: colors.primary,
    'crédit': colors.warning,
  };
  const payments = paymentBreakdown(periodSales);
  const donut: DonutSlice[] = payments.map((p) => ({ label: p.method, value: p.total, color: methodColors[p.method] }));

  return (
    <Screen>
      <SegmentedControl
        value={range}
        onChange={setRange}
        style={{ marginBottom: spacing.lg }}
        options={[
          { label: '7 jours', value: '7j' },
          { label: '30 jours', value: '30j' },
          { label: '6 mois', value: '6m' },
        ]}
      />

      {/* Total */}
      <GradientCard colors={colors.scheme === 'dark' ? (['#2E2A6E', '#5A4BE0'] as const) : undefined} style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="smallMedium" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Chiffre d'affaires
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full }}>
            <Ionicons name={delta.positive ? 'trending-up' : 'trending-down'} size={13} color="#FFFFFF" />
            <Text variant="caption" style={{ color: '#FFFFFF' }}>
              {formatPercent(delta.ratio, true)}
            </Text>
          </View>
        </View>
        <Text variant="display" style={{ color: '#FFFFFF', fontSize: 36, marginTop: spacing.xs }} numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(total, currency)}
        </Text>
      </GradientCard>

      {/* Graphique */}
      <Card style={{ marginBottom: spacing.lg }}>
        <LineChart data={chartData} color={colors.primary} formatValue={(n) => formatMoneyCompact(n, currency)} />
      </Card>

      {/* Indicateurs */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <MetricCard icon="trending-up" tone={colors.success} label="Marge brute" value={formatMoneyCompact(margin, currency)} />
        <MetricCard icon="receipt" tone={colors.primary} label="Ventes" value={formatNumber(count)} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <MetricCard icon="pricetag" tone={colors.info} label="Panier moyen" value={formatMoneyCompact(avg, currency)} />
        <MetricCard icon="wallet" tone={colors.accent} label="Marge %" value={total > 0 ? formatPercent(margin / total) : '—'} />
      </View>

      {/* Par vendeur */}
      {sellers.length > 0 ? (
        <>
          <SectionHeader title="Par vendeur" />
          <Card style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
            {sellers.map((s) => (
              <View key={s.employee.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={s.employee.name} emoji={s.employee.emoji} size={38} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodySemibold" numberOfLines={1}>
                      {s.employee.name}
                    </Text>
                    <Text variant="smallMedium">{formatMoneyCompact(s.revenue, currency)}</Text>
                  </View>
                  <ProgressBar value={s.revenue / topRev} height={6} />
                  <Text variant="caption" muted>
                    {s.count} ventes • commission {formatMoneyCompact(s.commission, currency)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {/* Moyens de paiement */}
      {donut.length > 0 ? (
        <>
          <SectionHeader title="Moyens de paiement" />
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg }}>
            <DonutChart data={donut} size={132} thickness={18} centerValue={formatMoneyCompact(total, currency)} centerLabel="Total" />
            <View style={{ flex: 1, gap: spacing.md }}>
              {payments.map((p) => (
                <View key={p.method} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: methodColors[p.method] }} />
                  <Text variant="smallMedium" style={{ flex: 1, textTransform: 'capitalize' }}>
                    {p.method}
                  </Text>
                  <Text variant="caption" muted>
                    {formatPercent(p.total / total)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}

      {/* Meilleurs produits */}
      {products5.length > 0 ? (
        <>
          <SectionHeader title="Meilleurs produits" />
          <Card style={{ gap: spacing.lg }}>
            {products5.map((p) => (
              <View key={p.product.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={p.product.name} emoji={p.product.emoji} size={38} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodySemibold" numberOfLines={1}>
                      {p.product.name}
                    </Text>
                    <Text variant="smallMedium">{formatMoneyCompact(p.revenue, currency)}</Text>
                  </View>
                  <ProgressBar value={p.revenue / maxProd} tone="accent" height={6} />
                  <Text variant="caption" muted>
                    {formatNumber(p.quantity)} unités vendues
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function MetricCard({ icon, tone, label, value }: { icon: keyof typeof Ionicons.glyphMap; tone: string; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, gap: spacing.sm }}>
      <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: tone + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <Text variant="h3" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" muted>
        {label}
      </Text>
    </Card>
  );
}
