import { type ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing, useTheme } from '@/theme';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** En-tête fixe au-dessus du contenu défilant. */
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: Edge[];
  padded?: boolean;
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
  bottomInset?: number;
};

export function Screen({
  children,
  scroll = true,
  header,
  refreshing,
  onRefresh,
  edges = ['top'],
  padded = true,
  background,
  contentStyle,
  bottomInset = spacing['4xl'],
}: ScreenProps) {
  const { colors } = useTheme();
  const pad = padded ? { paddingHorizontal: spacing.lg } : null;

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: background ?? colors.bg }}>
      {header ? <View style={[{ paddingTop: spacing.sm, paddingBottom: spacing.sm }, pad]}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[pad, { paddingBottom: bottomInset, paddingTop: header ? 0 : spacing.sm }, contentStyle]}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
