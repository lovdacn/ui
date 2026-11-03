import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { PortalHost } from '@rn-primitives/portal';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useLvcnFonts } from '@/lib/lvcn-fonts';
import AppTabs from '@/components/app-tabs';

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const lvcnFontsReady = useLvcnFonts();
  if (!lvcnFontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
