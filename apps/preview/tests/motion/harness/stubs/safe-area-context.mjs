/**
 * Minimal `react-native-safe-area-context` stub. The real package loads native modules at
 * import time. Components read `SafeAreaInsetsContext`, which is `null` outside a provider.
 */
import * as React from 'react';

export const SafeAreaInsetsContext = React.createContext(null);

const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export function SafeAreaProvider({ children, initialMetrics }) {
  return React.createElement(
    SafeAreaInsetsContext.Provider,
    { value: initialMetrics?.insets ?? ZERO_INSETS },
    children
  );
}

export function useSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext) ?? ZERO_INSETS;
}
