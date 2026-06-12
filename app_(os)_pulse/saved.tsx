// app/(os)/pulse/saved.tsx
// MTAA Pulse — Saved Items Screen

import React, { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { usePulseSaved } from "@/domains/pulse/hooks/usePulseHome";
import { Bookmark, Trash2, ExternalLink } from "lucide-react-native";

const TYPE_COLORS: Record<string, string> = {
  post: "#34D399", job: "#60A5FA", product: "#F472B6", event: "#FF6B35",
  business: "#818CF8", course: "#FBBF24", community: "#A78BFA",
  creator: "#F472B6", article: "#34D399", alert: "#FF3B30",
};

export default function PulseSavedScreen() {
  const router = useRouter();
  const { savedItems, isLoading, loadSaved, unsaveItem } = usePulseSaved();

  useEffect(() => {
    loadSaved();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bookmark size={22} color="#FF6B35" />
        <Text style={styles.headerTitle}>Saved Items</Text>
        <Text style={styles.headerCount}>{savedItems.length}</Text>
      </View>

      {isLoading && savedItems.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadSaved} tintColor="#FF6B35" />}
          showsVerticalScrollIndicator={false}
        >
          {savedItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.typeBadge, { backgroundColor: `${TYPE_COLORS[item.item_type] || "#60A5FA"}20` }]}>
                <Text style={[styles.typeText, { color: TYPE_COLORS[item.item_type] || "#60A5FA" }]}>
                  {item.item_type.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSource}>From {item.source_module}</Text>
              {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
              <View style={styles.itemActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
                  <ExternalLink size={14} color="#60A5FA" />
                  <Text style={styles.actionText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => unsaveItem(item.id)}>
                  <Trash2 size={14} color="#FF3B30" />
                  <Text style={[styles.actionText, { color: "#FF3B30" }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {savedItems.length === 0 && (
            <View style={styles.empty}>
              <Bookmark size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No saved items yet</Text>
              <Text style={styles.emptySub}>Save posts, jobs, events and more from across MTAA</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700", flex: 1 },
  headerCount: { color: "#FF6B35", fontSize: 16, fontWeight: "700" },

  itemCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16,
  },
  typeBadge: {
    alignSelf: "flex-start", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  typeText: { fontSize: 10, fontWeight: "700" },
  itemTitle: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 6 },
  itemSource: { color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8 },
  itemNotes: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontStyle: "italic", marginBottom: 12 },
  itemActions: { flexDirection: "row", gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { color: "#60A5FA", fontSize: 12, fontWeight: "600" },

  empty: { alignItems: "center", marginTop: 80, paddingHorizontal: 32 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptySub: { color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", marginTop: 8 },
});
