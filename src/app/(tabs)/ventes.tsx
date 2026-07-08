import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { salesToday, sumTotals } from '@/lib/analytics';
import { formatDateWithDay, formatMoney, formatMoneyCompact, formatTime } from '@/lib/format';
import { useCurrency, useCurrentUser, useData } from '@/store';
import type { PaymentMethod, Sale } from '@/types';
import { radius, spacing, useTheme } from '@/theme';
import type { BadgeTone } from '@/components/ui/Badge';

type Period = '7j' | '30j' | 'tout';

const PAYMENT_META: Record<PaymentMethod, { icon: keyof typeof Ionicons.glyphMap; tone: BadgeTone }> = {
  'espèces': { icon: 'cash-outline', tone: 'success' },
  mobile: { icon: 'phone-portrait-outline', tone: 'info' },
  carte: { icon: 'card-outline', tone: 'primary' },
  'crédit': { icon: 'time-outline', tone: 'warning' },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function VentesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();
  const currency = useCurrency();
  const allSales = useData((s) => s.sales);
  const employees = useData((s) => s.employees);
  const [period, setPeriod] = useState<Period>('7j');
  const [query, setQuery] = useState('');

  const isPatron = user?.role === 'patron';
  const empName = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);

  const scoped = useMemo(
    () => (isPatron ? allSales : allSales.filter((s) => s.employeeId === user?.employeeId)),
    [allSales, isPatron, user?.employeeId],
  );

  const filtered = useMemo(() => {
    const cutoff = period === 'tout' ? 0 : Date.now() - (period === '7j' ? 7 : 30) * 86400000;
    const q = query.trim().toLowerCase();
    return scoped.filter((s) => {
      if (new Date(s.createdAt).getTime() < cutoff) return false;
      if (!q) return true;
      return (
        s.reference.toLowerCase().includes(q) ||
        (s.customer ?? '').toLowerCase().includes(q) ||
        (empName.get(s.employeeId) ?? '').toLowerCase().includes(q)
      );
    });
  }, [scoped, period, query, empName]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const total = sumTotals(filtered);
  const todayCount = salesToday(scoped).length;

  return (
    <Screen
      header={
        <AppHeader
          title="Ventes"
          subtitle={isPatron ? 'Toute la boutique' : 'Mes ventes'}
          right={<IconButton icon="add" variant="primary" accessibilityLabel="Nouvelle vente" onPress={() => router.push('/vente/nouvelle')} />}
        />
      }>
      {/* Résumé */}
      <Card style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
        <MiniStat label="Chiffre d'affaires" value={formatMoneyCompact(total, currency)} />
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <MiniStat label="Ventes" value={`${filtered.length}`} />
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <MiniStat label="Aujourd'hui" value={`${todayCount}`} />
      </Card>

      <SegmentedControl
        value={period}
        onChange={setPeriod}
        style={{ marginBottom: spacing.md }}
        options={[
          { label: '7 jours', value: '7j' },
          { label: '30 jours', value: '30j' },
          { label: 'Tout', value: 'tout' },
        ]}
      />

      <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher une vente…" style={{ marginBottom: spacing.lg }} />

      {groups.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Aucune vente"
          message="Enregistrez votre première vente pour la voir apparaître ici."
          action={{ label: 'Nouvelle vente', icon: 'add', onPress: () => router.push('/vente/nouvelle') }}
        />
      ) : (
        groups.map((g) => (
          <View key={g.key} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm, paddingHorizontal: spacing.xs }}>
              <Text variant="smallMedium" secondary style={{ textTransform: 'capitalize' }}>
                {g.label}
              </Text>
              <Text variant="smallMedium" secondary>
                {formatMoney(g.total, currency)}
              </Text>
            </View>
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {g.items.map((sale, i) => {
                const meta = PAYMENT_META[sale.paymentMethod];
                return (
                  <View
                    key={sale.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.lg,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}>
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: radius.sm,
                        backgroundColor: colors.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons name={meta.icon} size={20} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySemibold" numberOfLines={1}>
                        {sale.customer ?? 'Client comptant'}
                      </Text>
                      <Text variant="small" secondary numberOfLines={1}>
                        {sale.items.length} article{sale.items.length > 1 ? 's' : ''} • {empName.get(sale.employeeId) ?? '—'} • {formatTime(sale.createdAt)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text variant="bodySemibold">{formatMoney(sale.total, currency)}</Text>
                      <Badge label={cap(sale.paymentMethod)} tone={meta.tone} />
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs }}>
      <Text variant="h3" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function groupByDay(sales: Sale[]): { key: string; label: string; total: number; items: Sale[] }[] {
  const map = new Map<string, Sale[]>();
  for (const s of sales) {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const arr = map.get(key);
    if (arr) arr.push(s);
    else map.set(key, [s]);
  }
  return [...map.entries()].map(([key, items]) => ({
    key,
    label: formatDateWithDay(items[0].createdAt),
    total: sumTotals(items),
    items,
  }));
}
