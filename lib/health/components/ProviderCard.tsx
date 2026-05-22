"use client";

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  provider: any;
  onPress?: () => void;
}

export function ProviderCard({ provider, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={styles.name}>{provider.full_name || "Unknown"}</Text>
      <Text style={styles.specialty}>{provider.specialty}</Text>
      {provider.facility_name && <Text style={styles.facility}>{provider.facility_name}</Text>}
      {provider.available_for_telemedicine && <Text style={styles.tele}>Telemedicine Available</Text>}
      {provider.consultation_fee && <Text style={styles.fee}>${provider.consultation_fee}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1F1F1F", padding: 16, borderRadius: 12, marginBottom: 12 },
  name: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  specialty: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  facility: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  tele: { fontSize: 12, color: "#10b981", marginTop: 4 },
  fee: { fontSize: 14, color: "#2563eb", marginTop: 4, fontWeight: "600" },
});
