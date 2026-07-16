import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  let colorScheme = useColorScheme();
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('colorScheme');
    if (themeParam === 'dark' || themeParam === 'light') {
      colorScheme = themeParam as 'light' | 'dark';
    }
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="present" />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
