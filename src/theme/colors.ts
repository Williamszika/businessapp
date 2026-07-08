/**
 * ZKA — Système de couleurs
 * ---------------------------------------------------------------------------
 * Identité de marque ZKA : un indigo-violet profond et confiant (croissance,
 * technologie, premium) rehaussé d'un or chaleureux pour les revenus et les
 * accents. Palette pensée pour les modes clair ET sombre.
 */

/** Couleurs de marque — constantes, indépendantes du thème. */
export const brand = {
  /** Violet-indigo signature ZKA */
  primary: '#5A4BE0',
  primaryStrong: '#4634C7',
  primaryPressed: '#3A2BB0',
  /** Or ZKA — utilisé pour les revenus et accents premium */
  gold: '#F5A623',
  goldStrong: '#DE8F12',
} as const;

/** Dégradés de marque (pour les cartes héro, boutons, en-têtes). */
export const gradients = {
  brand: ['#6D5BF0', '#8B5CF6', '#A855F7'] as const,
  brandSubtle: ['#5A4BE0', '#7C5CEC'] as const,
  gold: ['#FBBF24', '#F5A623', '#F59E0B'] as const,
  success: ['#12B76A', '#0E9F63'] as const,
  night: ['#1E1B4B', '#3A2BB0', '#5A4BE0'] as const,
  ocean: ['#2E90FA', '#5A4BE0'] as const,
};

type Palette = {
  scheme: 'light' | 'dark';
  // Fonds
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceSunken: string;
  // Bordures
  border: string;
  borderStrong: string;
  // Texte
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  // Marque
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  // États sémantiques
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  // Divers
  overlay: string;
  shadow: string;
  tabBar: string;
  skeleton: string;
};

export const lightColors: Palette = {
  scheme: 'light',
  bg: '#F4F5FB',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F2F9',
  surfaceSunken: '#ECEEF6',
  border: '#E8EAF3',
  borderStrong: '#D8DBEA',
  text: '#141525',
  textSecondary: '#585D73',
  textMuted: '#8B90A6',
  textInverse: '#FFFFFF',
  primary: brand.primary,
  primarySoft: '#ECEAFC',
  onPrimary: '#FFFFFF',
  accent: brand.gold,
  accentSoft: '#FEF3DC',
  success: '#0F9F63',
  successSoft: '#E6F7EF',
  warning: '#B45309',
  warningSoft: '#FDF0DD',
  danger: '#E1362B',
  dangerSoft: '#FDEBE9',
  info: '#1E7FE8',
  infoSoft: '#E6F1FE',
  overlay: 'rgba(20, 21, 37, 0.45)',
  shadow: '#20233A',
  tabBar: '#FFFFFF',
  skeleton: '#E8EAF3',
};

export const darkColors: Palette = {
  scheme: 'dark',
  bg: '#0A0B12',
  bgElevated: '#14161F',
  surface: '#15171F',
  surfaceAlt: '#1C1E29',
  surfaceSunken: '#101119',
  border: '#262A38',
  borderStrong: '#343A4D',
  text: '#F3F4FA',
  textSecondary: '#A7ACC2',
  textMuted: '#6B7189',
  textInverse: '#0A0B12',
  primary: '#8072F2',
  primarySoft: '#211E3C',
  onPrimary: '#FFFFFF',
  accent: '#F7B733',
  accentSoft: '#2C2413',
  success: '#2EC97D',
  successSoft: '#0F2A1E',
  warning: '#FDB022',
  warningSoft: '#2C2110',
  danger: '#F97066',
  dangerSoft: '#2C1614',
  info: '#53B1FD',
  infoSoft: '#0E2033',
  overlay: 'rgba(0, 0, 0, 0.62)',
  shadow: '#000000',
  tabBar: '#101119',
  skeleton: '#20232F',
};

export type ThemeColors = Palette;

/** Palette de couleurs stables utilisées pour les avatars (assignation par hachage). */
export const avatarColors = [
  '#5A4BE0',
  '#F5A623',
  '#12B76A',
  '#2E90FA',
  '#F04438',
  '#EC4899',
  '#0EA5E9',
  '#8B5CF6',
  '#14B8A6',
  '#F97316',
] as const;

/** Renvoie une couleur d'avatar déterministe à partir d'une chaîne (id/nom). */
export function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}
