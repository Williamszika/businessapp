import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useData } from '@/store';
import type { EmployeeStatus } from '@/types';
import { radius, spacing, useTheme } from '@/theme';

const EMOJIS = ['👩🏾‍💼', '🧑🏾‍💼', '👨🏿‍💼', '👩🏽‍💻', '🧑🏾‍🏭', '🧑🏾‍✈️', '👩🏾‍🔧', '🧑🏿‍💼'];

function toNumber(v: string): number {
  const n = parseFloat(v.replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function NouvelEmployeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addEmployee = useData((s) => s.addEmployee);

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [commission, setCommission] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('actif');
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim() ? 'Nom requis' : undefined;
  const positionError = submitted && !position.trim() ? 'Poste requis' : undefined;
  const phoneError = submitted && !phone.trim() ? 'Téléphone requis' : undefined;
  const valid = name.trim() !== '' && position.trim() !== '' && phone.trim() !== '';

  const submit = () => {
    setSubmitted(true);
    if (!valid) return;
    addEmployee({
      name,
      position,
      phone,
      email: email.trim() || undefined,
      monthlySalary: Math.round(toNumber(salary)),
      commissionRate: toNumber(commission) / 100,
      status,
      emoji,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: 'Nouvel employé',
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text color="primary" variant="bodyMedium">
                Annuler
              </Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 44}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Avatar emoji */}
          <View>
            <Text variant="smallMedium" secondary style={{ marginBottom: spacing.sm }}>
              Avatar (optionnel)
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(emoji === e ? undefined : e)}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: emoji === e ? colors.primary : colors.border,
                    backgroundColor: emoji === e ? colors.primarySoft : colors.surface,
                  }}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Field label="Nom complet" icon="person-outline" value={name} onChangeText={setName} placeholder="Ex. Awa Traoré" error={nameError} />
          <Field label="Poste" icon="briefcase-outline" value={position} onChangeText={setPosition} placeholder="Ex. Vendeuse" error={positionError} />
          <Field label="Téléphone" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="+225 07 00 00 00" keyboardType="phone-pad" error={phoneError} />
          <Field label="Email (optionnel)" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="nom@zka.app" keyboardType="email-address" autoCapitalize="none" />

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Field containerStyle={{ flex: 1 }} label="Salaire / mois" value={salary} onChangeText={setSalary} placeholder="0" keyboardType="numeric" />
            <Field containerStyle={{ flex: 1 }} label="Commission" value={commission} onChangeText={setCommission} placeholder="0" keyboardType="numeric" suffix="%" />
          </View>

          <View>
            <Text variant="smallMedium" secondary style={{ marginBottom: spacing.sm }}>
              Statut
            </Text>
            <SegmentedControl
              value={status}
              onChange={setStatus}
              options={[
                { label: 'Actif', value: 'actif' },
                { label: 'En congé', value: 'conge' },
                { label: 'Inactif', value: 'inactif' },
              ]}
            />
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgElevated }}>
          <Button label="Ajouter l'employé" icon="checkmark-circle" onPress={submit} fullWidth size="lg" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
