import { SignupForm } from '@/components/signup-form';
import { View } from 'react-native';

export default function SignUpScreen() {
  return (
    <View className="bg-background flex-1 justify-center p-4">
      <SignupForm />
    </View>
  );
}
