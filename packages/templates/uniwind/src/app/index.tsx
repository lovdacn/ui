import * as WebBrowser from 'expo-web-browser';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GitHubStarButton } from '@/components/ui/github-star-button';
import { Logo } from '@/components/ui/logo';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const DOCS_URL = 'https://lovdacn.vercel.app/docs';
const GITHUB_URL = 'https://github.com/lovdacn/ui';

function openExternal(url: string) {
  void WebBrowser.openBrowserAsync(url);
}

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Logo size={92} />
            <Badge label="Expo · React Native" />
            <ThemedText type="title" style={styles.title}>
              Welcome to{'\n'}lovdaCN
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Beautiful, accessible UI components for Expo and React Native. Copy, paste and own
              every line of code.
            </ThemedText>
          </View>

          <Card style={styles.card}>
            <ThemedText type="code" style={styles.cardLabel}>
              GET STARTED
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              1. Edit <ThemedText type="code">src/app/index.tsx</ThemedText>
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              2. Add components — <ThemedText type="code">npx lovda add button</ThemedText>
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              3. Browse the full catalog in the docs
            </ThemedText>
          </Card>

          <View style={styles.actions}>
            <Button
              label="Read the docs"
              variant="primary"
              style={styles.action}
              onPress={() => openExternal(DOCS_URL)}
            />
            <GitHubStarButton style={styles.action} onPress={() => openExternal(GITHUB_URL)} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 440,
  },
  card: {
    alignSelf: 'stretch',
  },
  cardLabel: {
    marginBottom: Spacing.one,
  },
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  action: {
    alignSelf: 'stretch',
  },
});
