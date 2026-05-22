import { View, Text, StyleSheet } from 'react-native';
import { ListingCard } from "@/lib/marketplace/components/ListingCard";
import { useMarketplaceStore } from "@/lib/marketplace/hooks/use-marketplace-store";

export default function MarketplaceScreen() {
  const { listings } = useMarketplaceStore();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Marketplace</Text>
      {listings?.slice(0, 3).map((item: any) => (
        <ListingCard key={item.id} listing={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
});
