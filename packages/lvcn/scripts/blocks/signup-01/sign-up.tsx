import { SignupForm } from '@/components/signup-form';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  return (
    <SafeAreaView className="bg-background flex-1 justify-center p-4">
      <SignupForm />
    </SafeAreaView>
  );
}
