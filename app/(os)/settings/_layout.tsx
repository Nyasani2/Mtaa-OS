import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings', headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="security" options={{ title: 'Security' }} />
      <Stack.Screen name="kyc" options={{ title: 'Identity Verification' }} />
      <Stack.Screen name="linked" options={{ title: 'Linked Accounts' }} />
      <Stack.Screen name="payment-methods" options={{ title: 'Payment Methods' }} />
      <Stack.Screen name="tx-alerts" options={{ title: 'Transaction Alerts' }} />
      <Stack.Screen name="subscriptions" options={{ title: 'Subscriptions' }} />
      <Stack.Screen name="gofund" options={{ title: 'GoFund Settings' }} />
      <Stack.Screen name="quiet-hours" options={{ title: 'Quiet Hours' }} />
      <Stack.Screen name="app-notifications" options={{ title: 'App Notifications' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="block-list" options={{ title: 'Block List' }} />
      <Stack.Screen name="devices" options={{ title: 'Active Devices' }} />
      <Stack.Screen name="theme" options={{ title: 'Theme' }} />
      <Stack.Screen name="accent" options={{ title: 'Accent Color' }} />
      <Stack.Screen name="font-size" options={{ title: 'Font Size' }} />
      <Stack.Screen name="language" options={{ title: 'Language' }} />
      <Stack.Screen name="installed-apps" options={{ title: 'Installed Apps' }} />
      <Stack.Screen name="permissions" options={{ title: 'Permissions' }} />
      <Stack.Screen name="storage" options={{ title: 'Storage' }} />
      <Stack.Screen name="rails" options={{ title: 'Active Rails' }} />
      <Stack.Screen name="network" options={{ title: 'Network' }} />
      <Stack.Screen name="tribes" options={{ title: 'Tribe Settings' }} />
      <Stack.Screen name="reputation" options={{ title: 'Reputation' }} />
      <Stack.Screen name="visibility" options={{ title: 'Visibility' }} />
      <Stack.Screen name="help" options={{ title: 'Help Center' }} />
      <Stack.Screen name="support" options={{ title: 'Contact Support' }} />
      <Stack.Screen name="bug-report" options={{ title: 'Report Bug' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms of Service' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="licenses" options={{ title: 'Licenses' }} />
      <Stack.Screen name="api-keys" options={{ title: 'API Keys' }} />
      <Stack.Screen name="webhooks" options={{ title: 'Webhooks' }} />
      <Stack.Screen name="logs" options={{ title: 'Debug Logs' }} />
      <Stack.Screen name="features" options={{ title: 'Feature Flags' }} />
    </Stack>
  );
}
