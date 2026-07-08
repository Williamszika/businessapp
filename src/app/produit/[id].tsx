import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import { formatMoney, formatNumber, formatPercent } from '@/lib/format';
import { useCurrency, useData, useIsPatron } from '@/store';
import { radius, spacing, useTheme } from '@/theme';

export default function ProduitDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPatron = useIsPatron();
  const currency = useCurrency();
  const product = useData((s) => s.products.find((p) => p.id === id));
  const sales = useData((s) => s.sales);
  const adjustStock = useData((s) => s.adjustStock);

  const stats = useMemo(() => {
    let quantity = 0;
    let revenue = 0;
    if (product) {
      for (const s of sales) {
        for (const it of s.items) {
          if (it.productId === product.id) {
            quantity += it.quantity;
            revenue += it.quantity * it.unitPrice;
          }
        }
      }
    }
    return { quantity, revenue };
  }, [sales, product]);

  if (!product) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Produit' }} />
        <EmptyState icon="cube-outline" title="Produit introuvable" />
      </Screen>
    );
  }

  const out = product.stock === 0;
  const low = product.stock <= product.reorderLevel;
  const margin = product.price - product.cost;
  const marginPct = product.price > 0 ? margin / product.price : 0;
  const stockValue = product.price * product.stock;
  const gauge = Math.min(1, product.stock / Math.max(1, product.reorderLevel * 2));

  return (
    <Screen>
      <Stack.Screen options={{ title: product.name }} />

      {/* En-tête */}
      <Card style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Avatar name={product.name} emoji={product.emoji} size={84} />
        <Text variant="h2" center style={{ marginTop: spacing.xs }}>
          {product.name}
        </Text>
        <Text secondary>
          {product.category} • {product.sku}
        </Text>
        <Badge
          label={out ? 'Rupture de stock' : low ? 'Stock faible' : 'En stock'}
          tone={out ? 'danger' : low ? 'warning' : 'success'}
          dot
        />
      </Card>

      {/* Prix & marge */}
      <SectionHeader title="Prix & marge" />
      <Card style={{ gap: spacing.md, marginBottom: spacing.lg }}>
        <InfoRow label="Prix de vente" value={formatMoney(product.price, currency)} strong />
        <Divider />
        <InfoRow label="Coût d'achat" value={formatMoney(product.cost, currency)} />
        <Divider />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text secondary>Marge unitaire</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Badge label={formatPercent(marginPct)} tone="success" />
            <Text variant="bodySemibold" color="success">
              {formatMoney(margin, currency)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Stock */}
      <SectionHeader title="Niveau de stock" />
      <Card style={{ gap: spacing.md, marginBottom: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text variant="display" style={{ fontSize: 40 }}>
              {formatNumber(product.stock)}
            </Text>
            <Text secondary>{product.unit}(s) en stock</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" muted>
              Valeur
            </Text>
            <Text variant="title">{formatMoney(stockValue, currency)}</Text>
          </View>
        </View>
        <ProgressBar value={gauge} tone={out ? 'danger' : low ? 'warning' : 'success'} height={10} />
        <Text variant="caption" muted>
          Seuil de réapprovisionnement : {product.reorderLevel} {product.unit}(s)
        </Text>

        {isPatron ? (
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.sm }}>
              <IconButton icon="remove" variant="surface" accessibilityLabel="Retirer une unité du stock" onPress={() => adjustStock(product.id, -1)} />
              <Text variant="smallMedium" secondary>
                Ajuster l'unité
              </Text>
              <IconButton icon="add" variant="primary" accessibilityLabel="Ajouter une unité au stock" onPress={() => adjustStock(product.id, 1)} />
            </View>
            <Button label="Réapprovisionner (+10)" icon="refresh" variant="secondary" onPress={() => adjustStock(product.id, 10)} fullWidth />
          </View>
        ) : null}
      </Card>

      {/* Ventes */}
      <SectionHeader title="Historique des ventes" />
      <Card style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="h2">{formatNumber(stats.quantity)}</Text>
          <Text variant="caption" muted>
            Unités vendues
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: colors.border }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="h2" numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(stats.revenue, currency)}
          </Text>
          <Text variant="caption" muted>
            CA généré
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text secondary>{label}</Text>
      <Text variant={strong ? 'title' : 'bodyMedium'}>{value}</Text>
    </View>
  );
}
