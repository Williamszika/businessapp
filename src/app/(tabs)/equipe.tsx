import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { Text } from '@/components/ui/Text';
import { salesByEmployee } from '@/lib/analytics';
import { formatMoneyCompact } from '@/lib/format';
import { useCurrency, useData, useIsPatron } from '@/store';
import type { BadgeTone } from '@/components/ui/Badge';
import type { EmployeeStatus } from '@/types';
import { spacing, useTheme } from '@/theme';

const STATUS_META: Record<EmployeeStatus, { label: string; tone: BadgeTone }> = {
  actif: { label: 'Actif', tone: 'success' },
  conge: { label: 'En congé', tone: 'warning' },
  inactif: { label: 'Inactif', tone: 'neutral' },
};

type Filter = 'tous' | 'actif' | 'conge';

export default function EquipeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isPatron = useIsPatron();
  const currency = useCurrency();
  const employees = useData((s) => s.employees);
  const sales = useData((s) => s.sales);
  const [filter, setFilter] = useState<Filter>('tous');
  const [query, setQuery] = useState('');

  const revenueById = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of salesByEmployee(sales, employees)) map.set(s.employee.id, s.revenue);
    return map;
  }, [sales, employees]);

  const activeCount = employees.filter((e) => e.status === 'actif').length;
  const payroll = employees.filter((e) => e.status !== 'inactif').reduce((s, e) => s + e.monthlySalary, 0);
  const onLeave = employees.filter((e) => e.status === 'conge').length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => (filter === 'tous' ? true : e.status === filter))
      .filter((e) => (!q ? true : e.name.toLowerCase().includes(q) || e.position.toLowerCase().includes(q)));
  }, [employees, filter, query]);

  return (
    <Screen
      header={
        <AppHeader
          title="Équipe"
          subtitle={`${employees.length} collaborateurs`}
          right={isPatron ? <IconButton icon="person-add" variant="primary" accessibilityLabel="Nouvel employé" onPress={() => router.push('/employe/nouveau')} /> : undefined}
        />
      }>
      <Card style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
        <MiniStat label="Actifs" value={`${activeCount}`} />
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <MiniStat label="Masse salariale" value={formatMoneyCompact(payroll, currency)} />
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <MiniStat label="En congé" value={`${onLeave}`} />
      </Card>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
        style={{ marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        {(
          [
            { label: 'Tous', value: 'tous' },
            { label: 'Actifs', value: 'actif' },
            { label: 'En congé', value: 'conge' },
          ] as { label: string; value: Filter }[]
        ).map((f) => (
          <Chip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </ScrollView>

      <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher un employé…" style={{ marginBottom: spacing.lg }} />

      {filtered.length === 0 ? (
        <EmptyState icon="people-outline" title="Aucun employé" message="Aucun collaborateur ne correspond à ce filtre." />
      ) : (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {filtered.map((e, i) => {
            const meta = STATUS_META[e.status];
            return (
              <Pressable
                key={e.id}
                onPress={() => router.push('/employe/' + e.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Avatar name={e.name} emoji={e.emoji} size={46} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemibold" numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Text variant="small" secondary numberOfLines={1}>
                    {e.position}
                    {isPatron ? ` • CA ${formatMoneyCompact(revenueById.get(e.id) ?? 0, currency)}` : ''}
                  </Text>
                </View>
                <Badge label={meta.label} tone={meta.tone} dot />
              </Pressable>
            );
          })}
        </Card>
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
