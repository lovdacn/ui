import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { Link } from 'expo-router';
import { Apple, GalleryVerticalEnd, Mail } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

export function LoginForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <View className="mx-auto w-full max-w-sm gap-6">
      <View className="flex-row items-center justify-center gap-2">
        <View className="bg-primary size-7 items-center justify-center rounded-lg">
          <Icon as={GalleryVerticalEnd} className="text-primary-foreground" size={16} />
        </View>
        <Text className="font-medium">Acme Inc.</Text>
      </View>

      <Card>
        <CardHeader className="items-center gap-1">
          <CardTitle className="text-center text-xl">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Sign in with Apple, Google, or your email
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="gap-2">
            <Button variant="outline" className="w-full" accessibilityLabel="Sign in with Apple">
              <Icon as={Apple} />
              <Text>Continue with Apple</Text>
            </Button>
            <Button variant="outline" className="w-full" accessibilityLabel="Sign in with Google">
              <Icon as={Mail} />
              <Text>Continue with Google</Text>
            </Button>
          </View>

          <View className="flex-row items-center gap-3">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground text-xs">OR CONTINUE WITH</Text>
            <Separator className="flex-1" />
          </View>

          <View className="gap-2">
            <Label nativeID="email">
              <Text>Email</Text>
            </Label>
            <Input
              aria-labelledby="email"
              value={email}
              onChangeText={setEmail}
              placeholder="m@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Label nativeID="password">
                <Text>Password</Text>
              </Label>
              <Button variant="link" size="sm" className="h-auto p-0" onPress={() => {}}>
                <Text>Forgot password?</Text>
              </Button>
            </View>
            <Input
              aria-labelledby="password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              returnKeyType="done"
            />
          </View>

          <Button className="w-full" onPress={() => {}}>
            <Text>Sign in</Text>
          </Button>

          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-muted-foreground text-sm">Don&apos;t have an account?</Text>
            <Link href="/sign-up" asChild>
              <Button variant="link" size="sm" className="h-auto p-0">
                <Text>Sign up</Text>
              </Button>
            </Link>
          </View>
        </CardContent>
      </Card>

      <Text className="text-muted-foreground px-6 text-center text-xs leading-5">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </View>
  );
}
