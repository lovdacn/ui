import { Dashboard01 } from '@/components/dashboard';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="bg-background flex-1">
      <Dashboard01 />
    </SafeAreaView>
  );
}
