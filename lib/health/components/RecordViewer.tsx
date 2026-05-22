"use client";

import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRecords } from "../hooks/useRecords";

interface Props {
  patientId: string;
}

export function RecordViewer({ patientId }: Props) {
  const { data: records, isLoading } = useRecords(patientId);

  if (isLoading) return <Text style={styles.loading}>Loading records...</Text>;

  const renderRecord = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.type}>{item.record_type || item.type}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      {item.is_confidential && <Text style={styles.confidential}>Confidential</Text>}
      {item.health_providers && <Text style={styles.provider}>{item.health_providers.full_name}</Text>}
      {item.attachments && item.attachments.length > 0 && (
        <Text style={styles.attachments}>{item.attachments.length} attachment(s)</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Medical Records</Text>
      <FlatList
        data={records || []}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0F0F0F" },
  loading: { color: "#9CA3AF", padding: 16 },
  header: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginBottom: 16 },
  card: { backgroundColor: "#1F1F1F", padding: 16, borderRadius: 12, marginBottom: 12 },
  type: { fontSize: 12, color: "#10b981", textTransform: "uppercase", marginBottom: 4 },
  title: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  description: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  confidential: { fontSize: 12, color: "#ef4444", marginTop: 4 },
  provider: { fontSize: 14, color: "#2563eb", marginTop: 4 },
  attachments: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
});
