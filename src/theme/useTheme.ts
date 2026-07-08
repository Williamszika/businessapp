import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './colors';

export type ResolvedTheme = {
  colors: ThemeColors;
  isDark: boolean;
  scheme: 'light' | 'dark';
};

/**
 * Hook central du thème : renvoie la palette résolue selon le mode
 * clair/sombre du système.
 */
export function useTheme(): ResolvedTheme {
  const system = useColorScheme();
  const scheme = system === 'dark' ? 'dark' : 'light';
  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    isDark: scheme === 'dark',
    scheme,
  };
}
