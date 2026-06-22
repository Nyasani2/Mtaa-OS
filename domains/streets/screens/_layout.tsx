// domains/streets/screens/_layout.tsx
// MTAA Streets — Tab Layout: Feed (TikTok) + Articles + Other screens

import { Tabs } from 'expo-router';
import { Home, BookOpen, Search, User, Settings } from 'lucide-react-native';

export default function StreetsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FF2D55',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
      }}
    >
      <Tabs.Screen
        name="FeedScreen"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ArticlesScreen"
        options={{
          title: 'Articles',
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="DiscoverScreen"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="SettingsScreen"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          tabBarButton: () => null, // Hide from tab bar, accessible via menu
        }}
      />
      {/* Hide these from tab bar — accessed via navigation */}
      <Tabs.Screen
        name="CommentsScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="ShareScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="InboxScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="LiveScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="CreatorScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="AdsScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="ShopScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="JobsScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="WalletScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
      <Tabs.Screen
        name="CreateScreen"
        options={{ href: null, tabBarButton: () => null }}
      />
    </Tabs>
  );
}
