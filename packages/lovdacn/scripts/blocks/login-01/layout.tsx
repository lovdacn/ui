import { Stack } from 'expo-router';

/**
 * Layout for the (auth) route group. The parentheses make it a layout group,
 * so it does not add a segment to the URL — `sign-in.tsx` is still `/sign-in`.
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
