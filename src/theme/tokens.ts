/**
 * ZKA — Jetons de design (design tokens)
 * Espacements, rayons, typographie et ombres. Indépendants du thème clair/sombre.
 */
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Échelle d'espacement (base 4). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
} as const;

/** Rayons de bordure. */
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 30,
  full: 999,
} as const;

/** Familles de polices (Inter, chargées au démarrage). */
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Tailles de police. */
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  display: 44,
} as const;

/**
 * Styles typographiques prêts à l'emploi (sans couleur — la couleur est
 * appliquée par le composant Text via le thème).
 */
export const typography = {
  display: { fontFamily: font.extrabold, fontSize: fontSize.display, lineHeight: 50, letterSpacing: -1 },
  h1: { fontFamily: font.extrabold, fontSize: fontSize['3xl'], lineHeight: 38, letterSpacing: -0.6 },
  h2: { fontFamily: font.bold, fontSize: fontSize['2xl'], lineHeight: 32, letterSpacing: -0.4 },
  h3: { fontFamily: font.bold, fontSize: fontSize.xl, lineHeight: 26, letterSpacing: -0.2 },
  title: { fontFamily: font.semibold, fontSize: fontSize.lg, lineHeight: 24 },
  bodyLg: { fontFamily: font.regular, fontSize: fontSize.md, lineHeight: 24 },
  body: { fontFamily: font.regular, fontSize: fontSize.base, lineHeight: 22 },
  bodyMedium: { fontFamily: font.medium, fontSize: fontSize.base, lineHeight: 22 },
  bodySemibold: { fontFamily: font.semibold, fontSize: fontSize.base, lineHeight: 22 },
  small: { fontFamily: font.regular, fontSize: fontSize.sm, lineHeight: 18 },
  smallMedium: { fontFamily: font.medium, fontSize: fontSize.sm, lineHeight: 18 },
  caption: { fontFamily: font.medium, fontSize: fontSize.xs, lineHeight: 15 },
  label: { fontFamily: font.semibold, fontSize: fontSize.xs, lineHeight: 14, letterSpacing: 0.4 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: fontSize.sm },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/**
 * Ombres portées, adaptées à la plateforme.
 * `shadowColor` doit être fourni par l'appelant (dépend du thème).
 */
export function shadow(level: 0 | 1 | 2 | 3 | 4, color = '#20233A'): ViewStyle {
  if (level === 0) return {};
  const map = {
    1: { h: 2, blur: 8, o: 0.06, e: 2 },
    2: { h: 6, blur: 16, o: 0.09, e: 4 },
    3: { h: 12, blur: 28, o: 0.12, e: 8 },
    4: { h: 20, blur: 40, o: 0.16, e: 14 },
  }[level];
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: map.h },
      shadowOpacity: map.o,
      shadowRadius: map.blur,
    },
    android: { elevation: map.e, shadowColor: color },
    default: {
      boxShadow: `0 ${map.h}px ${map.blur}px rgba(32,35,58,${map.o})`,
    },
  }) as ViewStyle;
}

/** Durées d'animation. */
export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
