import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function CivicLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="police" options={{ title: 'Police' }} />
        <Stack.Screen name="courts" options={{ title: 'Courts' }} />
        <Stack.Screen name="prisons" options={{ title: 'Prisons' }} />
      </Stack>
    </View>
  );
}
