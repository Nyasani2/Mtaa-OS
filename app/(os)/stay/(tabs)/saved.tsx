import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from "expo-router";
import { useStay } from "@/domains/stay/hooks/useStay";
import { StayList } from "@/domains/stay/components";
import { Heart, Trash2 } from "lucide-react-native";
import { useEffect } from 'react';

export default function StaySavedScreen() {
  const { listings, savedIds, loading, toggleSaved, fetchListings } = useStay();
  const router = useRouter();

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const savedListings = listings.filter((l) => savedIds.includes(l.id));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.headerSubtitle}>{savedListings?.length || 0} saved stays</Text>
      </View>
      <StayList
        listings={savedListings}
        loading={loading}
        emptyMessage="Tap the heart on any stay to save it here"
        savedIds={savedIds}
        onToggleSave={toggleSaved}
        onSelect={(id) => router.push(`/(os)/stay/${id}` as any)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1a5c4b" },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
});
