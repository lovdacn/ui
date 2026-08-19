import * as React from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Auto-generated registry manifest of all components
export const SYNCED_COMPONENTS = [
  {
    "name": "accordion",
    "category": "Layout",
    "isAvailable": true
  },
  {
    "name": "alert",
    "category": "Feedback",
    "isAvailable": true
  },
  {
    "name": "alert-dialog",
    "category": "Overlay",
    "isAvailable": true
  },
  {
    "name": "aspect-ratio",
    "category": "Layout",
    "isAvailable": true
  },
  {
    "name": "avatar",
    "category": "Data Display",
    "isAvailable": true
  },
  {
    "name": "badge",
    "category": "Data Display",
    "isAvailable": true
  },
  {
    "name": "bottom-sheet",
    "category": "Overlay",
    "isAvailable": true
  },
  {
    "name": "breadcrumb",
    "category": "Navigation",
    "isAvailable": true
  },
  {
    "name": "button",
    "category": "Action",
    "isAvailable": true
  },
  {
    "name": "calendar",
    "category": "Advanced",
    "isAvailable": true
  },
  {
    "name": "card",
    "category": "Layout",
    "isAvailable": true
  },
  {
    "name": "carousel",
    "category": "Advanced",
    "isAvailable": true
  },
  {
    "name": "checkbox",
    "category": "Forms",
    "isAvailable": true
  },
  {
    "name": "collapsible",
    "category": "Layout",
    "isAvailable": true
  },
  {
    "name": "context-menu",
    "category": "Overlay",
    "isAvailable": true
  },
  {
    "name": "dialog",
    "category": "Overlay",
    "isAvailable": true
  },
  {
    "name": "dropdown-menu",
    "category": "Overlay",
    "isAvailable": true
  },
  {
    "name": "hover-card",
    "category": "Overlay",
    "isAvailable": true
  },
  {
    "name": "icon",
    "category": "Data Display",
    "isAvailable": true
  },
  {
    "name": "input",
    "category": "Forms",
    "isAvailable": true
  },
  {
    "name": "input-otp",
    "category": "Forms",
    "isAvailable": true
  },
  {
    "name": "label",
    "category": "Data Display",
    "isAvailable": true
  },
  {
    "name": "menubar",
    "category": "Navigation",
    "isAvailable": true
  },
  {
    "name": "motion",
    "category": "Animation",
    "isAvailable": true
  },
  {
    "name": "motion-primitives",
    "category": "Animation",
    "isAvailable": true
  },
  {
    "name": "native-only-animated-view",
    "category": "Animation",
    "isAvailable": true
  },
  {
    "name": "popover",
    "category": "Overlay",
    "isAvailable": true
  },
  {
    "name": "primitives",
    "category": "Core",
    "isAvailable": true
  },
  {
    "name": "progress",
    "category": "Feedback",
    "isAvailable": true
  },
  {
    "name": "radio-group",
    "category": "Forms",
    "isAvailable": true
  },
  {
    "name": "select",
    "category": "Forms",
    "isAvailable": true
  },
  {
    "name": "semantic-icon",
    "category": "General",
    "isAvailable": true
  },
  {
    "name": "separator",
    "category": "Layout",
    "isAvailable": true
  },
  {
    "name": "sheet",
    "category": "Overlay",
    "isAvailable": true
  },
  {
    "name": "sidebar",
    "category": "Navigation",
    "isAvailable": true
  },
  {
    "name": "skeleton",
    "category": "Feedback",
    "isAvailable": true
  },
  {
    "name": "sonner",
    "category": "Feedback",
    "isAvailable": true
  },
  {
    "name": "spinner",
    "category": "Feedback",
    "isAvailable": true
  },
  {
    "name": "switch",
    "category": "Forms",
    "isAvailable": true
  },
  {
    "name": "tabs",
    "category": "Navigation",
    "isAvailable": true
  },
  {
    "name": "text",
    "category": "Data Display",
    "isAvailable": true
  },
  {
    "name": "textarea",
    "category": "Forms",
    "isAvailable": true
  },
  {
    "name": "toggle",
    "category": "Action",
    "isAvailable": true
  },
  {
    "name": "toggle-group",
    "category": "Action",
    "isAvailable": true
  },
  {
    "name": "tooltip",
    "category": "Overlay",
    "isAvailable": true
  }
];

export function ComponentShowroom() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const categories = ['All', ...Array.from(new Set(SYNCED_COMPONENTS.map(c => c.category)))];

  const filtered = SYNCED_COMPONENTS.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>lovdaCN Component Matrix</Text>
        <Text style={styles.subtitle}>
          Testing target: Expo 54 (NativeWind) · {SYNCED_COMPONENTS.length} total registry components
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search components (e.g. button, dialog, tabs)..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsList}>
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.pill, isSelected && styles.pillActive]}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Components Grid */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map(comp => (
          <View key={comp.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.compName}>{comp.name}</Text>
              <View style={[styles.badge, comp.isAvailable ? styles.badgeSuccess : styles.badgeWarn]}>
                <Text style={styles.badgeText}>{comp.category}</Text>
              </View>
            </View>
            <Text style={styles.cardPath}>@/components/ui/{comp.name}</Text>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No components found matching "{search}".</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b', paddingHorizontal: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  searchContainer: { marginBottom: 12 },
  searchInput: {
    backgroundColor: '#18181b',
    color: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  pillsList: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  pillActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  pillText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  pillTextActive: { color: '#ffffff', fontWeight: '600' },
  list: { paddingBottom: 40, gap: 10 },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compName: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
  cardPath: { fontSize: 12, color: '#64748b', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeSuccess: { backgroundColor: '#1e293b' },
  badgeWarn: { backgroundColor: '#451a1a' },
  badgeText: { fontSize: 11, color: '#93c5fd', fontWeight: '500' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 14 },
});
