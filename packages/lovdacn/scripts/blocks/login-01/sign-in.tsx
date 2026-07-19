import { LoginForm } from '@/components/login-form';
import { View } from 'react-native';

export default function SignInScreen() {
  return (
    <View className="bg-background flex-1 justify-center p-4">
      <LoginForm />
    </View>
  );
}
