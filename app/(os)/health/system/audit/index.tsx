// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthStore } from '@/domains/health/state/healthStore';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  severity: "info" | "warning" | "critical";
}

const SEVERITY_COLORS: Record<string, string> = {
  info: "#3b82f6",
  warning: "#f59e0b",
  critical: "#ef4444",
};

const ACTION_ICONS: Record<string, string> = {
  create: "add-circle",
  read: "eye",
  update: "create",
  delete: "trash",
  login: "log-in",
  logout: "log-out",
  export: "download",
  print: "print",
};

export default function AuditLog() {
  const router = useRouter();
  const { fetchAuditLog } = useHealthStore();

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "info" | "warning" | "critical">("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await fetchAuditLog();
    setEntries(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filtered = entries.filter((e) => {
    const matchesSearch = e.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || e.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Log</Text>
        <TouchableOpacity onPress={() => Alert.alert("Export Audit", "Audit log export coming soon.")}>
          <Ionicons name="download-outline" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by user, action, or details..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Severity Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(["all", "info", "warning", "critical"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filterSeverity === f && styles.filterChipActive]}
              onPress={() => setFilterSeverity(f)}
            >
              <Text style={[styles.filterChipText, filterSeverity === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Entries */}
        {filtered.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[entry.severity] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.entryAction}>{entry.action.toUpperCase()} — {entry.entity_type}</Text>
                <Text style={styles.entryUser}>{entry.user} ({entry.user_role})</Text>
              </View>
              <Ionicons name={ACTION_ICONS[entry.action] || "help-circle"} size={18} color="#9ca3af" />
            </View>
            <Text style={styles.entryDetails}>{entry.details}</Text>
            <View style={styles.entryFooter}>
              <Text style={styles.entryEntity}>ID: {entry.entity_id}</Text>
              <Text style={styles.entryTime}>{new Date(entry.timestamp).toLocaleString()}</Text>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No audit entries found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  content: { padding: 12, paddingBottom: 24 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, borderWidth: 1, borderColor: "#e5e7eb",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#111827" },
  filterScroll: { marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#e5e7eb",
  },
  filterChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterChipText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  entryCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  entryHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10, marginTop: 4 },
  entryAction: { fontSize: 13, fontWeight: "700", color: "#111827" },
  entryUser: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  entryDetails: { fontSize: 12, color: "#374151", marginLeft: 20, marginBottom: 8, lineHeight: 18 },
  entryFooter: { flexDirection: "row", justifyContent: "space-between", marginLeft: 20 },
  entryEntity: { fontSize: 10, color: "#9ca3af" },
  entryTime: { fontSize: 10, color: "#9ca3af" },
  empty: { alignItems: "center", marginTop: 40 },
  emptyText: { fontSize: 14, color: "#9ca3af", marginTop: 8 },
});
