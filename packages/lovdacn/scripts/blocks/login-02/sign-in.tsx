import { LoginForm } from '@/components/login-form';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  return (
    <SafeAreaView className="bg-background flex-1 justify-center p-4">
      <LoginForm />
    </SafeAreaView>
  );
}
