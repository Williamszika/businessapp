import { Ionicons } from '@expo/vector-icons';
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
import { lowStockProducts, stockRetailValue } from '@/lib/analytics';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { useCurrency, useData, useIsPatron } from '@/store';
import type { Product } from '@/types';
import { radius, spacing, useTheme } from '@/theme';

export default function StockScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isPatron = useIsPatron();
  const currency = useCurrency();
  const products = useData((s) => s.products);
  const [category, setCategory] = useState<string>('Tous');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => ['Tous', ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const lowStock = lowStockProducts(products);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (category === 'Tous' ? true : p.category === category))
      .filter((p) => (!q ? true : p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .sort((a, b) => {
        const aLow = a.stock <= a.reorderLevel ? 0 : 1;
        const bLow = b.stock <= b.reorderLevel ? 0 : 1;
        if (aLow !== bLow) return aLow - bLow;
        return a.name.localeCompare(b.name);
      });
  }, [products, category, query]);

  return (
    <Screen
      header={
        <AppHeader
          title="Stock"
          subtitle={`${products.length} références`}
          right={isPatron ? <IconButton icon="add" variant="primary" accessibilityLabel="Nouveau produit" onPress={() => router.push('/produit/nouveau')} /> : undefined}
        />
      }>
      {/* Résumé */}
      <Card style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
        <MiniStat label="Valeur du stock" value={formatMoneyCompact(stockRetailValue(products), currency)} />
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <MiniStat label="Produits" value={`${products.length}`} />
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <MiniStat label="Alertes" value={`${lowStock.length}`} tone={lowStock.length > 0 ? colors.warning : undefined} />
      </Card>

      {lowStock.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            backgroundColor: colors.warningSoft,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
          }}>
          <Ionicons name="alert-circle" size={22} color={colors.warning} />
          <Text variant="smallMedium" style={{ flex: 1, color: colors.warning }}>
            {lowStock.length} produit(s) à réapprovisionner rapidement.
          </Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
        style={{ marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        {categories.map((c) => (
          <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>

      <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher un produit…" style={{ marginBottom: spacing.lg }} />

      {filtered.length === 0 ? (
        <EmptyState icon="cube-outline" title="Aucun produit" message="Aucun produit ne correspond à votre recherche." />
      ) : (
        <Card padded={false} style={{ overflow: 'hidden' }}>
          {filtered.map((p, i) => (
            <ProductRow key={p.id} product={p} first={i === 0} currency={currency} onPress={() => router.push('/produit/' + p.id)} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

function ProductRow({
  product,
  first,
  currency,
  onPress,
}: {
  product: Product;
  first: boolean;
  currency: ReturnType<typeof useCurrency>;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const out = product.stock === 0;
  const low = product.stock <= product.reorderLevel;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        opacity: pressed ? 0.6 : 1,
      })}>
      <Avatar name={product.name} emoji={product.emoji} size={44} />
      <View style={{ flex: 1 }}>
        <Text variant="bodySemibold" numberOfLines={1}>
          {product.name}
        </Text>
        <Text variant="small" secondary numberOfLines={1}>
          {product.category} • {product.sku}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text variant="bodySemibold">{formatMoney(product.price, currency)}</Text>
        <Badge
          label={out ? 'Rupture' : `${product.stock} ${product.unit}`}
          tone={out ? 'danger' : low ? 'warning' : 'neutral'}
        />
      </View>
    </Pressable>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs }}>
      <Text variant="h3" numberOfLines={1} adjustsFontSizeToFit style={tone ? { color: tone } : undefined}>
        {value}
      </Text>
      <Text variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}
