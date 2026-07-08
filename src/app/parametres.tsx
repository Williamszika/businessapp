import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Switch, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { Field } from '@/components/ui/Field';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import { CURRENCIES } from '@/lib/format';
import { useAuth, useCurrentUser, useData, useIsPatron, useSettings } from '@/store';
import type { CurrencyCode } from '@/types';
import { spacing, useTheme } from '@/theme';

const CURRENCY_ORDER: CurrencyCode[] = ['XOF', 'EUR', 'USD', 'MAD'];

export default function ParametresScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();
  const isPatron = useIsPatron();
  const settings = useSettings();
  const updateSettings = useData((s) => s.updateSettings);
  const resetDemo = useData((s) => s.resetDemo);
  const logout = useAuth((s) => s.logout);

  const confirmReset = () =>
    Alert.alert('Réinitialiser la démo', 'Toutes les données seront remplacées par les données de démonstration. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Réinitialiser', style: 'destructive', onPress: () => resetDemo() },
    ]);

  const confirmLogout = () =>
    Alert.alert('Se déconnecter', 'Voulez-vous vous déconnecter de ZKA ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);

  return (
    <Screen>
      {/* Profil */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <Avatar name={user?.name ?? 'ZKA'} size={58} />
        <View style={{ flex: 1 }}>
          <Text variant="title" numberOfLines={1}>
            {user?.name ?? 'ZKA'}
          </Text>
          <Text variant="small" secondary>
            {user?.position ?? 'Utilisateur'}
          </Text>
        </View>
        <Badge label={isPatron ? 'Patron' : 'Employé'} tone={isPatron ? 'primary' : 'info'} />
      </Card>

      {/* Entreprise */}
      {isPatron ? (
        <>
          <SectionHeader title="Entreprise" />
          <Card style={{ marginBottom: spacing.lg }}>
            <Field
              label="Nom de l'entreprise"
              icon="storefront-outline"
              value={settings.businessName}
              onChangeText={(businessName) => updateSettings({ businessName })}
              placeholder="ZKA"
            />
          </Card>
        </>
      ) : null}

      {/* Devise */}
      <SectionHeader title="Devise" />
      <Card style={{ marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CURRENCY_ORDER.map((code) => (
            <Chip
              key={code}
              label={CURRENCIES[code].label}
              selected={settings.currency === code}
              onPress={() => updateSettings({ currency: code })}
            />
          ))}
        </View>
      </Card>

      {/* Préférences */}
      <SectionHeader title="Préférences" />
      <Card style={{ marginBottom: spacing.lg }}>
        <ToggleRow
          icon="notifications-outline"
          label="Notifications"
          value={settings.notificationsEnabled}
          onValueChange={(notificationsEnabled) => updateSettings({ notificationsEnabled })}
        />
        <Divider style={{ marginVertical: spacing.md }} />
        <ToggleRow
          icon="alert-circle-outline"
          label="Alertes de stock faible"
          value={settings.lowStockAlerts}
          onValueChange={(lowStockAlerts) => updateSettings({ lowStockAlerts })}
        />
      </Card>

      {/* Données */}
      <SectionHeader title="Données & compte" />
      <View style={{ gap: spacing.md }}>
        <Button label="Réinitialiser la démonstration" icon="refresh" variant="secondary" onPress={confirmReset} fullWidth />
        <Button label="Se déconnecter" icon="log-out-outline" variant="outline" onPress={confirmLogout} fullWidth />
      </View>

      <View style={{ alignItems: 'center', marginTop: spacing['3xl'], gap: 4 }}>
        <Ionicons name="cube" size={22} color={colors.textMuted} />
        <Text variant="caption" muted>
          ZKA • Gestion de commerce
        </Text>
        <Text variant="caption" muted>
          Version 1.0.0
        </Text>
      </View>
    </Screen>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.surfaceSunken }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
