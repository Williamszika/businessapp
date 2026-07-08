import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { typography, type TypographyVariant } from '@/theme';
import { useTheme } from '@/theme';

type ColorToken =
  | 'text'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'onPrimary';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  /** Jeton de couleur du thème ou couleur brute (#hex, rgb…). */
  color?: ColorToken | (string & {});
  center?: boolean;
  muted?: boolean;
  secondary?: boolean;
};

const TOKENS: Record<string, true> = {
  text: true,
  textSecondary: true,
  textMuted: true,
  textInverse: true,
  primary: true,
  accent: true,
  success: true,
  warning: true,
  danger: true,
  info: true,
  onPrimary: true,
};

export function Text({
  variant = 'body',
  color,
  center,
  muted,
  secondary,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();

  let resolved = colors.text;
  if (muted) resolved = colors.textMuted;
  else if (secondary) resolved = colors.textSecondary;
  if (color) {
    resolved = TOKENS[color] ? (colors as Record<string, string>)[color] : color;
  }

  return (
    <RNText
      style={[typography[variant], { color: resolved }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
