/** Minimal `nativewind` stub. */
export function cssInterop() {}
export function remapProps() {}
export function vars(values) {
  return values;
}
export function useColorScheme() {
  return { colorScheme: 'light', setColorScheme() {}, toggleColorScheme() {} };
}
export const colorScheme = { get: () => 'light', set: () => {} };
