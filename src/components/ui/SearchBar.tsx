import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { font, fontSize, radius, spacing, useTheme } from '@/theme';

export type SearchBarProps = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchBar({ value, onChangeText, placeholder = 'Rechercher…', style }: SearchBarProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          backgroundColor: colors.surfaceAlt,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          height: 46,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={{ flex: 1, color: colors.text, fontFamily: font.regular, fontSize: fontSize.base, padding: 0 }}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Effacer la recherche">
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
