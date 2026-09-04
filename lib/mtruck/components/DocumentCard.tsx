// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TruckDocument } from "@/lib/mtruck/types";

interface Props {
  document: TruckDocument;
}

export function DocumentCard({ document }: Props) {
  const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = { manifest: "document", permit: "shield", invoice: "receipt", insurance: "medical", license: "card" };
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.iconBox}><Ionicons name={typeIcons[document.type] || "document"} size={20} color="#6366F1" /></View>
      <View style={styles.info}>
        <Text style={(styles as any).full_name}>{(document as any).full_name}</Text>
        <Text style={styles.meta}>{document.type.toUpperCase()} • {document.uploaded_at}</Text>
      </View>
      <Ionicons name="download-outline" size={20} color="#64748B" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#6366F120", justifyContent: "center", alignItems: "center" },
  info: { flex: 1 },
  name: { color: "white", fontSize: 14, fontWeight: "600" },
  meta: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
});
