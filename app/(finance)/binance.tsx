import { View, Text, StyleSheet } from 'react-native';
import { BinanceIndex } from "@/domains/binance/pages/index";

export default function BinanceScreen() {
  return (
    <View style={styles.container}>
      <BinanceIndex />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
