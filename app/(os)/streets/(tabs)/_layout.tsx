import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function StreetsTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#E91E63' }}>
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: () => <Text>🔍</Text> }} />
      <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: () => <Text>➕</Text> }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarIcon: () => <Text>💬</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: () => <Text>👤</Text> }} />
    </Tabs>
  );
}
