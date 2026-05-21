import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDocumentStore } from "@/lib/mtruck/hooks/use-document-store";
import { DocumentCard } from "@/lib/mtruck/components/DocumentCard";

export default function DocumentsScreen() {
  const { documents } = useDocumentStore();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.uploadCard}>
        <Ionicons name="cloud-upload" size={32} color="#6366F1" />
        <Text style={styles.uploadText}>Upload Document</Text>
        <Text style={styles.uploadSubtext}>Manifests, permits, invoices</Text>
      </View>
      <Text style={styles.sectionTitle}>Recent Documents</Text>
      {documents.map((doc) => <DocumentCard key={doc.id} document={doc} />)}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  uploadCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: 24, margin: 16, alignItems: "center", borderWidth: 2, borderColor: "#334155", borderStyle: "dashed" },
  uploadText: { color: "white", fontSize: 16, fontWeight: "600", marginTop: 12 },
  uploadSubtext: { color: "#94A3B8", fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 8, marginBottom: 12, paddingHorizontal: 20 },
});
