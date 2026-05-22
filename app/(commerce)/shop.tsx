import { View, Text, StyleSheet } from 'react-native';
import { ShopDashboard } from "@/domains/shop/components/ShopDashboard";

export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <ShopDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
