import { Stack, Redirect } from "expo-router";
import { useOSShell } from '@/lib/shell/use-os-shell';

export default function AuthLayout() {
  const { isAuthenticated, isUnlocked, isBooting } = useOSShell();

  if (isBooting) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  if (isAuthenticated && isUnlocked) {
    return <Redirect href="/(os)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="set-pin" />
      <Stack.Screen name="lock-screen" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
