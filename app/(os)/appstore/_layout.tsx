import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { AppStoreBottomNav } from '@/components/appstore/BottomNav';

export default function AppStoreLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#121212' },
          animation: 'slide_from_right',
        }}
      />
      <AppStoreBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
