import { View, Text, StyleSheet } from 'react-native';
import { CreditScoreRing } from "@/lib/credit/components/CreditScoreRing";
import { useCreditStore } from "@/lib/credit/hooks/use-credit-store";

export default function CreditScreen() {
  const { score } = useCreditStore();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Credit</Text>
      <CreditScoreRing score={score || 650} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
