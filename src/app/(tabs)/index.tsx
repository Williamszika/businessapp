import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { LineChart } from '@/components/charts';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatCard } from '@/components/ui/StatCard';
import { Text } from '@/components/ui/Text';
import {
  dailySeries,
  grossMargin,
  lowStockProducts,
  monthlySeries,
  salesByEmployee,
  salesToday,
  stockRetailValue,
  sumTotals,
} from '@/lib/analytics';
import { formatMoney, formatMoneyCompact, formatPercent, formatTime, greeting } from '@/lib/format';
import { useCurrency, useCurrentUser, useData } from '@/store';
import { radius, spacing, useTheme } from '@/theme';

type Range = '7j' | '30j' | '6m';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();
  const currency = useCurrency();
  const employees = useData((s) => s.employees);
  const products = useData((s) => s.products);
  const allSales = useData((s) => s.sales);
  const [range, setRange] = useState<Range>('30j');

  const isPatron = user?.role === 'patron';
  const sales = useMemo(
    () => (isPatron ? allSales : allSales.filter((s) => s.employeeId === user?.employeeId)),
    [allSales, isPatron, user?.employeeId],
  );

  const empName = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const today = salesToday(sales);
  const todayTotal = sumTotals(today);
  const monthSeries = monthlySeries(sales, 6);
  const monthRevenue = monthSeries[monthSeries.length - 1]?.value ?? 0;
  const prevMonthRevenue = monthSeries[monthSeries.length - 2]?.value ?? 0;
  const monthRatio = prevMonthRevenue === 0 ? (monthRevenue > 0 ? 1 : 0) : (monthRevenue - prevMonthRevenue) / prevMonthRevenue;
  const monthUp = monthRevenue >= prevMonthRevenue;
  const revenue30 = sumTotals(sales.filter((s) => new Date(s.createdAt).getTime() >= Date.now() - 30 * 86400000));
  const salesCount30 = sales.filter((s) => new Date(s.createdAt).getTime() >= Date.now() - 30 * 86400000).length;
  const avgBasket = salesCount30 > 0 ? Math.round(revenue30 / salesCount30) : 0;
  const margin30 = grossMargin(
    sales.filter((s) => new Date(s.createdAt).getTime() >= Date.now() - 30 * 86400000),
    products,
  );
  const myCommission = user?.employeeId
    ? Math.round(revenue30 * (employees.find((e) => e.id === user.employeeId)?.commissionRate ?? 0))
    : 0;

  const chartData = range === '6m' ? monthSeries : dailySeries(sales, range === '7j' ? 7 : 30);
  const lowStock = lowStockProducts(products);
  const sellers = salesByEmployee(allSales, employees).filter((s) => s.revenue > 0);
  const topRevenue = sellers[0]?.revenue ?? 1;
  const recent = sales.slice(0, 5);
  const activeCount = employees.filter((e) => e.status === 'actif').length;

  return (
    <Screen
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text variant="small" secondary>
              {greeting()},
            </Text>
            <Text variant="h2" numberOfLines={1}>
              {user?.name ?? 'ZKA'}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/parametres')} hitSlop={8}>
            <Avatar name={user?.name ?? 'ZKA'} size={44} />
          </Pressable>
        </View>
      }>
      {/* Héro revenus */}
      <GradientCard style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }} variant="smallMedium">
            {isPatron ? 'Chiffre d’affaires ce mois' : 'Mon chiffre ce mois'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full }}>
            <Ionicons name={monthUp ? 'trending-up' : 'trending-down'} size={13} color="#FFFFFF" />
            <Text variant="caption" style={{ color: '#FFFFFF' }}>
              {formatPercent(monthRatio, true)}
            </Text>
          </View>
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 34, letterSpacing: -1, marginTop: spacing.xs }} variant="display" numberOfLines={1} adjustsFontSizeToFit>
          {formatMoney(monthRevenue, currency)}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg }}>
          <View>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Aujourd’hui
            </Text>
            <Text variant="title" style={{ color: '#FFFFFF' }}>
              {formatMoneyCompact(todayTotal, currency)}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          <View>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {isPatron ? 'Ventes du jour' : 'Ma commission (30j)'}
            </Text>
            <Text variant="title" style={{ color: '#FFFFFF' }}>
              {isPatron ? `${today.length}` : formatMoneyCompact(myCommission, currency)}
            </Text>
          </View>
        </View>
      </GradientCard>

      {/* Actions rapides */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <QuickAction icon="add-circle" label="Vente" onPress={() => router.push('/vente/nouvelle')} tone={colors.primary} />
        {isPatron ? (
          <>
            <QuickAction icon="cube" label="Stock" onPress={() => router.push('/(tabs)/stock')} tone={colors.accent} />
            <QuickAction icon="stats-chart" label="Revenus" onPress={() => router.push('/revenus')} tone={colors.success} />
          </>
        ) : (
          <>
            <QuickAction icon="stats-chart" label="Revenus" onPress={() => router.push('/revenus')} tone={colors.success} />
            <QuickAction icon="chatbubbles" label="Messages" onPress={() => router.push('/(tabs)/messages')} tone={colors.info} />
          </>
        )}
      </View>

      {/* Indicateurs clés */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <StatCard style={{ flex: 1 }} icon="cart" tone="primary" label="Ventes aujourd’hui" value={`${today.length}`} caption={formatMoneyCompact(todayTotal, currency)} />
        <StatCard style={{ flex: 1 }} icon="pricetag" tone="info" label="Panier moyen" value={formatMoneyCompact(avgBasket, currency)} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        {isPatron ? (
          <>
            <StatCard style={{ flex: 1 }} icon="layers" tone="accent" label="Valeur du stock" value={formatMoneyCompact(stockRetailValue(products), currency)} />
            <StatCard style={{ flex: 1 }} icon="trending-up" tone="success" label="Marge (30j)" value={formatMoneyCompact(margin30, currency)} />
          </>
        ) : (
          <>
            <StatCard style={{ flex: 1 }} icon="wallet" tone="success" label="Mon chiffre (30j)" value={formatMoneyCompact(revenue30, currency)} />
            <StatCard style={{ flex: 1 }} icon="gift" tone="accent" label="Ma commission" value={formatMoneyCompact(myCommission, currency)} />
          </>
        )}
      </View>

      {/* Graphique d'évolution */}
      <Card style={{ marginBottom: spacing.lg, gap: spacing.md }}>
        <SegmentedControl
          value={range}
          onChange={setRange}
          options={[
            { label: '7 jours', value: '7j' },
            { label: '30 jours', value: '30j' },
            { label: '6 mois', value: '6m' },
          ]}
        />
        <LineChart data={chartData} color={colors.primary} formatValue={(n) => formatMoneyCompact(n, currency)} />
      </Card>

      {/* Meilleurs vendeurs (patron) */}
      {isPatron && sellers.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Meilleurs vendeurs" action={{ label: 'Équipe', onPress: () => router.push('/(tabs)/equipe') }} />
          <Card style={{ gap: spacing.lg }}>
            {sellers.slice(0, 3).map((s, i) => (
              <View key={s.employee.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 22, alignItems: 'center' }}>
                  <Text variant="bodySemibold" color={i === 0 ? 'accent' : 'textMuted'}>
                    {i + 1}
                  </Text>
                </View>
                <Avatar name={s.employee.name} emoji={s.employee.emoji} size={38} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodySemibold" numberOfLines={1}>
                      {s.employee.name}
                    </Text>
                    <Text variant="smallMedium">{formatMoneyCompact(s.revenue, currency)}</Text>
                  </View>
                  <ProgressBar value={s.revenue / topRevenue} tone={i === 0 ? 'accent' : 'primary'} height={6} />
                </View>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {/* Alertes stock (patron) */}
      {isPatron && lowStock.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader
            title="Stock faible"
            subtitle={`${lowStock.length} produit(s) à réapprovisionner`}
            action={{ label: 'Stock', onPress: () => router.push('/(tabs)/stock') }}
          />
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {lowStock.slice(0, 3).map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/produit/${p.id}`)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Avatar name={p.name} emoji={p.emoji} size={40} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemibold" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text variant="small" secondary>
                    Seuil : {p.reorderLevel} {p.unit}
                  </Text>
                </View>
                <Badge label={`${p.stock} restant`} tone={p.stock === 0 ? 'danger' : 'warning'} />
              </Pressable>
            ))}
          </Card>
        </View>
      ) : null}

      {/* Ventes récentes */}
      <View>
        <SectionHeader title="Ventes récentes" action={{ label: 'Tout voir', onPress: () => router.push('/(tabs)/ventes') }} />
        {recent.length === 0 ? (
          <Card>
            <Text secondary center>
              Aucune vente pour le moment.
            </Text>
          </Card>
        ) : (
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {recent.map((sale, i) => (
              <Pressable
                key={sale.id}
                onPress={() => router.push('/(tabs)/ventes')}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.sm,
                    backgroundColor: colors.successSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="receipt-outline" size={20} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemibold" numberOfLines={1}>
                    {sale.customer ?? 'Client comptant'}
                  </Text>
                  <Text variant="small" secondary>
                    {empName.get(sale.employeeId)?.name ?? '—'} • {formatTime(sale.createdAt)}
                  </Text>
                </View>
                <Text variant="bodySemibold" color="success">
                  {formatMoney(sale.total, currency)}
                </Text>
              </Pressable>
            ))}
          </Card>
        )}
      </View>

      {!isPatron ? (
        <Text variant="caption" muted center style={{ marginTop: spacing.xl }}>
          Connecté en tant qu’employé • {user?.position}
        </Text>
      ) : null}
    </Screen>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: tone + '1F', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={22} color={tone} />
      </View>
      <Text variant="smallMedium">{label}</Text>
    </Pressable>
  );
}
