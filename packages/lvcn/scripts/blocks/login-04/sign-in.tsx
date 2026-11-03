import { LoginForm } from '@/components/login-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

export default function SignInScreen() {
  return (
    <KeyboardAvoidingView
      className="bg-muted flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center p-4 sm:p-6 md:p-10">
          <LoginForm />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
