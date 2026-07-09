import { useColorScheme as useNWColorScheme } from 'nativewind';

/**
 * Wraps NativeWind's `useColorScheme` so the returned value matches
 * React Native's `'light' | 'dark' | 'unspecified'` type and NativeWind
 * automatically toggles the `.dark` class on the root when the system
 * scheme changes.
 */
export function useColorScheme() {
  const { colorScheme } = useNWColorScheme();
  return colorScheme ?? 'light';
}
