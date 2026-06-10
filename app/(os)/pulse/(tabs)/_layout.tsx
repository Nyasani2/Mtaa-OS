import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function PulseTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#FF6B35' }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tabs.Screen name="trending" options={{ title: 'Trending', tabBarIcon: () => <Text>🔥</Text> }} />
      <Tabs.Screen name="topics" options={{ title: 'Topics', tabBarIcon: () => <Text>📌</Text> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: () => <Text>🔔</Text> }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: () => <Text>🔍</Text> }} />
    </Tabs>
  );
}
