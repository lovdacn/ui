import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import '../global.css';

export default function WebRootLayout() {
  let colorScheme = useColorScheme();
  if (typeof window !== 'undefined') {
    const requestedScheme = new URLSearchParams(window.location.search).get('colorScheme');
    if (requestedScheme === 'dark' || requestedScheme === 'light') {
      colorScheme = requestedScheme;
    }
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="present" />
        <Stack.Screen name="customizer-preview" />
      </Stack>
    </ThemeProvider>
  );
}
