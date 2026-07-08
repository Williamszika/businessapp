import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { Text } from '@/components/ui/Text';
import type { Employee } from '@/types';
import { useAuth, useData } from '@/store';
import { font, gradients, radius, spacing, useTheme } from '@/theme';

export default function LoginScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const allEmployees = useData((s) => s.employees);
  const employees = useMemo(() => allEmployees.filter((e) => e.status !== 'inactif'), [allEmployees]);
  const loginAsPatron = useAuth((s) => s.loginAsPatron);
  const loginAsEmployee = useAuth((s) => s.loginAsEmployee);

  const enter = () => router.replace('/(tabs)');

  const handleEmployee = (e: Employee) => {
    loginAsEmployee(e);
    enter();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing['4xl'] }}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + spacing['3xl'],
            paddingBottom: spacing['4xl'],
            paddingHorizontal: spacing.xl,
            borderBottomLeftRadius: radius.xl,
            borderBottomRightRadius: radius.xl,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Logo size={60} />
            <Text style={{ fontFamily: font.extrabold, fontSize: 40, color: '#FFFFFF', letterSpacing: -1.5 }}>ZKA</Text>
          </View>
          <Text style={{ color: '#FFFFFF', fontFamily: font.bold, fontSize: 26, marginTop: spacing.xl, letterSpacing: -0.5, lineHeight: 32 }}>
            Pilotez votre commerce d'un seul geste.
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: font.regular, fontSize: 15, marginTop: spacing.sm, lineHeight: 22 }}>
            Équipe, stock, ventes, revenus et messagerie — tout au même endroit.
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg }}>
          <Card padded style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: radius.md,
                  backgroundColor: colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="title">Espace Direction</Text>
                <Text variant="small" secondary>
                  Vue complète : revenus, équipe et stock
                </Text>
              </View>
            </View>
            <Button
              label="Continuer en tant que Patron"
              icon="arrow-forward"
              onPress={() => {
                loginAsPatron();
                enter();
              }}
              fullWidth
            />
          </Card>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text variant="caption" muted>
              OU CONNEXION EMPLOYÉ
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          <Card padded={false} style={{ overflow: 'hidden' }}>
            {employees.map((e, i) => (
              <View key={e.id}>
                {i > 0 ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 44 + spacing.md }} /> : null}
                <Pressable
                  onPress={() => handleEmployee(e)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    opacity: pressed ? 0.6 : 1,
                  })}>
                  <Avatar name={e.name} emoji={e.emoji} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySemibold">{e.name}</Text>
                    <Text variant="small" secondary>
                      {e.position}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
          </Card>

          <Text variant="caption" muted center style={{ marginTop: spacing.sm }}>
            Application de démonstration ZKA — vos données restent sur votre appareil.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
