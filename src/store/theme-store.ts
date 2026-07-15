import { useColorScheme } from 'react-native';
import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

export type AccentColorName = 'blue' | 'pink' | 'purple' | 'green' | 'cyan' | 'orange';

export const ACCENT_COLORS: Record<AccentColorName, string> = {
  blue: '#3b82f6',
  pink: '#ec4899',
  purple: '#8b5cf6',
  green: '#22c55e',
  cyan: '#06b6d4',
  orange: '#f97316',
};

export const ACCENT_COLOR_NAMES: Record<AccentColorName, string> = {
  blue: 'Azul',
  pink: 'Rosado',
  purple: 'Morado',
  green: 'Verde',
  cyan: 'Cyan',
  orange: 'Naranja',
};

export interface ThemeColors {
  background: string;
  onBackground: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  error: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  danger: string;
  glassSurface: string;
  glassBorder: string;
  glassBorderStrong: string;
  glassOverlay: string;
  inverseSurface: string;
  inverseOnSurface: string;
}

export const darkColors: ThemeColors = {
  background: '#0e1513',
  onBackground: '#dde4e1',
  surface: '#1a211f',
  surfaceContainer: '#1a211f',
  surfaceContainerHigh: '#242b2a',
  surfaceContainerHighest: '#2f3634',
  onSurface: '#dde4e1',
  onSurfaceVariant: '#bacac5',
  outline: '#859490',
  outlineVariant: '#3c4a46',
  primary: '#57f1db',
  onPrimary: '#003731',
  primaryContainer: '#2dd4bf',
  onPrimaryContainer: '#00574d',
  secondary: '#adc6ff',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  success: '#22c55e',
  danger: '#ef4444',
  glassSurface: 'rgba(30, 41, 59, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.15)',
  glassOverlay: 'rgba(30, 41, 59, 0.85)',
  inverseSurface: '#dde4e1',
  inverseOnSurface: '#2b3230',
};

export const lightColors: ThemeColors = {
  background: '#f0f4f3',
  onBackground: '#1a211f',
  surface: '#ffffff',
  surfaceContainer: '#e6edeb',
  surfaceContainerHigh: '#dce4e1',
  surfaceContainerHighest: '#d0d9d6',
  onSurface: '#1a211f',
  onSurfaceVariant: '#3c4a46',
  outline: '#859490',
  outlineVariant: '#bacac5',
  primary: '#006b5f',
  onPrimary: '#ffffff',
  primaryContainer: '#62fae3',
  onPrimaryContainer: '#00201c',
  secondary: '#adc6ff',
  error: '#b91c1c',
  errorContainer: '#fee2e2',
  onErrorContainer: '#450a0a',
  success: '#22c55e',
  danger: '#ef4444',
  glassSurface: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBorderStrong: 'rgba(0, 0, 0, 0.15)',
  glassOverlay: 'rgba(255, 255, 255, 0.85)',
  inverseSurface: '#1a211f',
  inverseOnSurface: '#f0f4f3',
};

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  primaryAccent: AccentColorName;
  setPrimaryAccent: (color: AccentColorName) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: (mode: ThemeMode) => set({ mode }),
  primaryAccent: 'cyan',
  setPrimaryAccent: (color) => set({ primaryAccent: color }),
}));

/**
 * Hook que resuelve la paleta de colores según el modo actual y el acento.
 * Si el modo es 'system', usa el color scheme del dispositivo.
 * El primary se sobreescribe con el color de acento seleccionado.
 */
export function useThemeColors(): ThemeColors {
  const mode = useThemeStore((s) => s.mode);
  const primaryAccent = useThemeStore((s) => s.primaryAccent);
  const systemScheme = useColorScheme();

  const base =
    mode === 'light' ? lightColors
    : mode === 'dark' ? darkColors
    : systemScheme === 'light' ? lightColors
    : darkColors;

  const accentColor = ACCENT_COLORS[primaryAccent] || base.primary;

  return {
    ...base,
    primary: accentColor,
    onPrimary: '#ffffff',
  };
}
