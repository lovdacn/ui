import { Stack } from 'expo-router';

import '../global.css';

// The web layout supplies its optimized theme wrapper. This universal fallback
// stays dependency-light because `/present` owns gesture/portal providers while
// the customizer route does not need them.
export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="present" />
      <Stack.Screen name="customizer-preview" />
    </Stack>
  );
}
