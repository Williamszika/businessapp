import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { formatMoney } from '@/lib/format';
import { useCurrency, useCurrentUser, useData } from '@/store';
import type { PaymentMethod, SaleItem } from '@/types';
import { hitSlop, radius, spacing, useTheme } from '@/theme';

const PAYMENTS: PaymentMethod[] = ['espèces', 'mobile', 'carte', 'crédit'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function NouvelleVenteScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currency = useCurrency();
  const user = useCurrentUser();
  const products = useData((s) => s.products);
  const employees = useData((s) => s.employees);
  const addSale = useData((s) => s.addSale);

  const isPatron = user?.role === 'patron';
  const sellers = useMemo(() => employees.filter((e) => e.status === 'actif'), [employees]);
  const [sellerId, setSellerId] = useState<string>(isPatron ? (sellers[0]?.id ?? '') : (user?.employeeId ?? ''));
  const [cart, setCart] = useState<Record<string, number>>({});
  const [payment, setPayment] = useState<PaymentMethod>('espèces');
  const [customer, setCustomer] = useState('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (!q ? true : p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
  }, [products, query]);

  const add = (id: string, delta: number) =>
    setCart((c) => {
      const p = products.find((x) => x.id === id);
      const max = p ? p.stock : 0;
      const next = Math.min(max, Math.max(0, (c[id] ?? 0) + delta));
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const items: SaleItem[] = Object.entries(cart)
    .map(([id, qty]) => {
      const p = products.find((x) => x.id === id);
      return p ? { productId: p.id, name: p.name, quantity: qty, unitPrice: p.price } : null;
    })
    .filter((x): x is SaleItem => x !== null);
  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const itemCount = items.reduce((s, it) => s + it.quantity, 0);
  const canSubmit = items.length > 0 && sellerId !== '';

  const submit = () => {
    if (!canSubmit) return;
    addSale({ employeeId: sellerId, items, paymentMethod: payment, customer: customer || undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: 'Nouvelle vente',
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text color="primary" variant="bodyMedium">
                Fermer
              </Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 44}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['3xl'] }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Vendeur */}
          {isPatron && sellers.length > 0 ? (
            <View style={{ marginBottom: spacing.lg }}>
              <Text variant="smallMedium" secondary style={{ marginBottom: spacing.sm }}>
                Vendeur
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {sellers.map((e) => (
                  <Chip key={e.id} label={e.name.split(' ')[0]} selected={sellerId === e.id} onPress={() => setSellerId(e.id)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Produits */}
          <Text variant="smallMedium" secondary style={{ marginBottom: spacing.sm }}>
            Produits
          </Text>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher un produit…" style={{ marginBottom: spacing.md }} />
          {filtered.length === 0 ? (
            <Card style={{ marginBottom: spacing.lg }}>
              <EmptyState icon="cube-outline" title="Aucun produit" message="Aucun produit ne correspond à votre recherche." />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden', marginBottom: spacing.lg }}>
              {filtered.map((p, i) => {
                const qty = cart[p.id] ?? 0;
                const atMax = qty >= p.stock;
                return (
                  <View
                    key={p.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}>
                    <Avatar name={p.name} emoji={p.emoji} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text variant="caption" muted>
                        {formatMoney(p.price, currency)} • {p.stock} {p.unit}
                      </Text>
                    </View>
                    {p.stock === 0 ? (
                      <Badge label="Rupture" tone="danger" />
                    ) : qty === 0 ? (
                      <Pressable
                        onPress={() => add(p.id, 1)}
                        hitSlop={hitSlop}
                        accessibilityRole="button"
                        accessibilityLabel={'Ajouter ' + p.name}
                        style={({ pressed }) => ({ width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                        <Ionicons name="add" size={20} color={colors.primary} />
                      </Pressable>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Pressable
                          onPress={() => add(p.id, -1)}
                          hitSlop={hitSlop}
                          accessibilityRole="button"
                          accessibilityLabel="Retirer une unité"
                          style={({ pressed }) => ({ width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                          <Ionicons name="remove" size={18} color={colors.text} />
                        </Pressable>
                        <Text variant="bodySemibold" style={{ minWidth: 22, textAlign: 'center' }}>
                          {qty}
                        </Text>
                        <Pressable
                          onPress={() => add(p.id, 1)}
                          disabled={atMax}
                          hitSlop={hitSlop}
                          accessibilityRole="button"
                          accessibilityLabel="Ajouter une unité"
                          style={({ pressed }) => ({ width: 34, height: 34, borderRadius: radius.full, backgroundColor: atMax ? colors.surfaceSunken : colors.primary, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                          <Ionicons name="add" size={18} color={atMax ? colors.textMuted : colors.onPrimary} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>
          )}

          {/* Paiement */}
          <Text variant="smallMedium" secondary style={{ marginBottom: spacing.sm }}>
            Moyen de paiement
          </Text>
          <SegmentedControl
            value={payment}
            onChange={setPayment}
            style={{ marginBottom: spacing.lg }}
            options={PAYMENTS.map((m) => ({ label: cap(m), value: m }))}
          />

          {/* Client */}
          <Field
            label="Client (optionnel)"
            icon="person-outline"
            value={customer}
            onChangeText={setCustomer}
            placeholder="Nom du client"
          />
        </ScrollView>

        {/* Pied : total + valider */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.bgElevated,
            gap: spacing.sm,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text secondary>
              {itemCount} article{itemCount > 1 ? 's' : ''}
            </Text>
            <Text variant="h2">{formatMoney(total, currency)}</Text>
          </View>
          {items.length > 0 && sellerId === '' ? (
            <Text variant="caption" color="danger" center>
              Aucun vendeur actif — activez ou ajoutez un employé pour enregistrer la vente.
            </Text>
          ) : null}
          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Valider la vente"
            style={{
              height: 54,
              borderRadius: radius.md,
              backgroundColor: canSubmit ? colors.primary : colors.surfaceSunken,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: spacing.sm,
            }}>
            <Ionicons name="checkmark-circle" size={22} color={canSubmit ? colors.onPrimary : colors.textMuted} />
            <Text variant="title" style={{ color: canSubmit ? colors.onPrimary : colors.textMuted }}>
              Valider la vente
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
