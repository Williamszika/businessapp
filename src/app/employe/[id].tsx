import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatCard } from '@/components/ui/StatCard';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateLong, formatMoney, formatMoneyCompact, formatPercent, formatTime } from '@/lib/format';
import { useCurrency, useCurrentUser, useData, useIsPatron } from '@/store';
import type { BadgeTone } from '@/components/ui/Badge';
import type { EmployeeStatus } from '@/types';
import { radius, spacing, useTheme } from '@/theme';

const STATUS_META: Record<EmployeeStatus, { label: string; tone: BadgeTone }> = {
  actif: { label: 'Actif', tone: 'success' },
  conge: { label: 'En congé', tone: 'warning' },
  inactif: { label: 'Inactif', tone: 'neutral' },
};

export default function EmployeDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPatron = useIsPatron();
  const currency = useCurrency();
  const user = useCurrentUser();
  const employee = useData((s) => s.employees.find((e) => e.id === id));
  const sales = useData((s) => s.sales);
  const updateEmployee = useData((s) => s.updateEmployee);
  const getOrCreateDirect = useData((s) => s.getOrCreateDirectConversation);

  if (!employee) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Profil' }} />
        <EmptyState icon="person-outline" title="Employé introuvable" />
      </Screen>
    );
  }

  const mySales = sales.filter((s) => s.employeeId === employee.id);
  const cutoff = Date.now() - 30 * 86400000;
  const recent30 = mySales.filter((s) => new Date(s.createdAt).getTime() >= cutoff);
  const revenue30 = recent30.reduce((sum, s) => sum + s.total, 0);
  const commission = Math.round(revenue30 * employee.commissionRate);
  const meta = STATUS_META[employee.status];

  const openMessage = () => {
    if (!user || user.id === employee.id) {
      router.push('/(tabs)/messages');
      return;
    }
    const convId = getOrCreateDirect(user.id, employee.id);
    router.push('/discussion/' + convId);
  };
  const call = () => Linking.openURL('tel:' + employee.phone.replace(/\s/g, '')).catch(() => {});

  return (
    <Screen>
      <Stack.Screen options={{ title: employee.name }} />

      {/* En-tête profil */}
      <Card style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Avatar name={employee.name} emoji={employee.emoji} size={84} />
        <Text variant="h2" center style={{ marginTop: spacing.xs }}>
          {employee.name}
        </Text>
        <Text secondary>{employee.position}</Text>
        <Badge label={meta.label} tone={meta.tone} dot />
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, alignSelf: 'stretch' }}>
          <Button label="Appeler" icon="call" variant="secondary" onPress={call} style={{ flex: 1 }} />
          <Button label="Message" icon="chatbubble" onPress={openMessage} style={{ flex: 1 }} />
        </View>
      </Card>

      {/* Performance */}
      <SectionHeader title="Performance (30 jours)" />
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <StatCard style={{ flex: 1 }} icon="cart" tone="primary" label="Ventes" value={`${recent30.length}`} />
        <StatCard style={{ flex: 1 }} icon="cash" tone="success" label="Chiffre d'affaires" value={formatMoneyCompact(revenue30, currency)} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <StatCard style={{ flex: 1 }} icon="gift" tone="accent" label="Commission" value={formatMoneyCompact(commission, currency)} caption={formatPercent(employee.commissionRate)} />
        <StatCard style={{ flex: 1 }} icon="wallet" tone="info" label="Salaire / mois" value={formatMoneyCompact(employee.monthlySalary, currency)} />
      </View>

      {/* Coordonnées */}
      <SectionHeader title="Coordonnées" />
      <Card style={{ gap: spacing.md, marginBottom: spacing.lg }}>
        <InfoRow icon="call-outline" label="Téléphone" value={employee.phone} />
        {employee.email ? (
          <>
            <Divider />
            <InfoRow icon="mail-outline" label="Email" value={employee.email} />
          </>
        ) : null}
        <Divider />
        <InfoRow icon="calendar-outline" label="Embauché le" value={formatDateLong(employee.hiredAt)} />
      </Card>

      {/* Gestion du statut (patron) */}
      {isPatron ? (
        <>
          <SectionHeader title="Statut" />
          <SegmentedControl
            value={employee.status}
            onChange={(status) => updateEmployee(employee.id, { status })}
            style={{ marginBottom: spacing.lg }}
            options={[
              { label: 'Actif', value: 'actif' },
              { label: 'En congé', value: 'conge' },
              { label: 'Inactif', value: 'inactif' },
            ]}
          />
        </>
      ) : null}

      {/* Ventes récentes */}
      {recent30.length > 0 ? (
        <>
          <SectionHeader title="Ventes récentes" />
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {mySales.slice(0, 5).map((s, i) => (
              <View
                key={s.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.lg,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="receipt-outline" size={18} color={colors.success} />
                  </View>
                  <View>
                    <Text variant="bodySemibold">{s.customer ?? 'Client comptant'}</Text>
                    <Text variant="caption" muted>
                      {formatTime(s.createdAt)} • {s.reference}
                    </Text>
                  </View>
                </View>
                <Text variant="bodySemibold" color="success">
                  {formatMoney(s.total, currency)}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text secondary style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}
