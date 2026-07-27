import { Tabs } from "expo-router";
import { Home, Search, Calendar, Heart, User } from "lucide-react-native";

export default function StayTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1a5c4b",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { height: 64, paddingBottom: 8 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Explore", tabBarIcon: ({ color, size }) => <Home size={size} color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: ({ color, size }) => <Search size={size} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: "Trips", tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} /> }} />
      <Tabs.Screen name="saved" options={{ title: "Saved", tabBarIcon: ({ color, size }) => <Heart size={size} color={color} /> }} />
      <Tabs.Screen name="host" options={{ title: "Host", tabBarIcon: ({ color, size }) => <User size={size} color={color} /> }} />
    </Tabs>
  );
}
