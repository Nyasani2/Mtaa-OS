import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useProperty } from "@/domains/property/hooks/useProperty";
import { PropertyList } from "@/domains/property/components";
import { Heart, Trash2 } from "lucide-react-native";

export default function PropertySavedScreen() {
  const { savedProperties, loading, toggleSaved } = useProperty();
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Properties</Text>
        <Text style={styles.headerSubtitle}>{savedProperties?.length || 0} saved</Text>
      </View>
      <PropertyList properties={savedProperties} loading={loading} emptyMessage="Tap the heart on any property to save it here" emptyIcon={<Heart size={40} color="#d1d5db" />} renderAction={(p) => (
        <TouchableOpacity onPress={() => toggleSaved(p.id)} style={styles.removeBtn}><Trash2 size={18} color="#ef4444" /></TouchableOpacity>
      )} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1a5c4b" },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  removeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center" },
});
