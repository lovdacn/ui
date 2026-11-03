import { Stats } from '@/components/stats';
import { Text } from '@/components/ui/text';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="bg-background flex-1">
      <ScrollView className="flex-1">
        <View className="gap-1 p-4 pb-0">
          <Text variant="h3">Dashboard</Text>
          <Text className="text-muted-foreground">Your key metrics at a glance</Text>
        </View>
        <Stats />
      </ScrollView>
    </SafeAreaView>
  );
}
