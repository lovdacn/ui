import * as WebBrowser from 'expo-web-browser';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const DOCS_URL = 'https://lovdacn.vercel.app/docs';

const FEATURES = [
  {
    title: 'Own your code',
    body: 'Components are copied straight into your project. Tweak the markup, styles and logic — no black boxes, no runtime dependency.',
  },
  {
    title: 'Two styling engines',
    body: 'Ships for NativeWind and Uniwind so you keep the Tailwind workflow you already know across every platform.',
  },
  {
    title: 'Accessible by default',
    body: 'Built on well-tested primitives with sensible roles, labels and pressed states out of the box.',
  },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Badge label="Docs" />
          <ThemedText type="subtitle" style={styles.centerText}>
            Explore lovdaCN
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Everything you need to ship a polished mobile interface, fast.
          </ThemedText>
        </View>

        <View style={styles.list}>
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <ThemedText type="smallBold">{feature.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {feature.body}
              </ThemedText>
            </Card>
          ))}
        </View>

        <Button
          label="Browse all components"
          variant="primary"
          style={styles.docsButton}
          onPress={() => void WebBrowser.openBrowserAsync(DOCS_URL)}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
  list: {
    gap: Spacing.three,
  },
  docsButton: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
});
