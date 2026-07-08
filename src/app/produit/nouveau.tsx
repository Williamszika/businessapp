import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { Text } from '@/components/ui/Text';
import { useData } from '@/store';
import { radius, spacing, useTheme } from '@/theme';

const EMOJIS = ['📦', '🥤', '💧', '🍚', '🛢️', '🧼', '🪥', '☕', '🥛', '🔌', '🎧', '👕', '🧢', '🍪', '🧂', '📱'];

function toNumber(v: string): number {
  const n = parseFloat(v.replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function NouveauProduitScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addProduct = useData((s) => s.addProduct);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [unit, setUnit] = useState('pièce');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [reorder, setReorder] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim() ? 'Nom requis' : undefined;
  const priceError = submitted && toNumber(price) <= 0 ? 'Prix requis' : undefined;
  const valid = name.trim() !== '' && toNumber(price) > 0;

  const submit = () => {
    setSubmitted(true);
    if (!valid) return;
    addProduct({
      name,
      category: category.trim() || 'Divers',
      emoji,
      unit,
      price: toNumber(price),
      cost: toNumber(cost),
      stock: Math.round(toNumber(stock)),
      reorderLevel: Math.round(toNumber(reorder)) || 5,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: 'Nouveau produit',
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
          {/* Emoji */}
          <View>
            <Text variant="smallMedium" secondary style={{ marginBottom: spacing.sm }}>
              Icône
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
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

          <Field label="Nom du produit" icon="cube-outline" value={name} onChangeText={setName} placeholder="Ex. Riz parfumé 5kg" error={nameError} />
          <Field label="Catégorie" icon="pricetags-outline" value={category} onChangeText={setCategory} placeholder="Ex. Épicerie" />

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Field containerStyle={{ flex: 1 }} label="Prix de vente" value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" error={priceError} />
            <Field containerStyle={{ flex: 1 }} label="Coût d'achat" value={cost} onChangeText={setCost} placeholder="0" keyboardType="numeric" />
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Field containerStyle={{ flex: 1 }} label="Stock initial" value={stock} onChangeText={setStock} placeholder="0" keyboardType="numeric" />
            <Field containerStyle={{ flex: 1 }} label="Seuil d'alerte" value={reorder} onChangeText={setReorder} placeholder="5" keyboardType="numeric" />
          </View>

          <Field label="Unité" icon="scale-outline" value={unit} onChangeText={setUnit} placeholder="pièce" />
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgElevated }}>
          <Button label="Ajouter le produit" icon="checkmark-circle" onPress={submit} fullWidth size="lg" />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
