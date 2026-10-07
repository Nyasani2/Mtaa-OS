// @ts-nocheck
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function CommandRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Immediately redirect to the new unified WeChat-style admin dashboard
    router.replace('/(admin)');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
});
