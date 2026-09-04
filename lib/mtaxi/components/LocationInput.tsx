import React from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  label: string; value: string; onChangeText: (text: string) => void;
  onGetCurrentLocation?: () => void; placeholder?: string;
}

export default function LocationInput({ label, value, onChangeText, onGetCurrentLocation, placeholder }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder={placeholder || `Enter ${label.toLowerCase()}`} placeholderTextColor="#64748b" value={value} onChangeText={onChangeText} />
        {onGetCurrentLocation && (
          <TouchableOpacity style={styles.gpsButton} onPress={onGetCurrentLocation}><Text style={styles.gpsText}>📍</Text></TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { color: "#94a3b8", fontSize: 13, marginBottom: 6, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, backgroundColor: "#1e293b", color: "#fff", padding: 14, borderRadius: 10, fontSize: 15 },
  gpsButton: { backgroundColor: "#334155", padding: 14, borderRadius: 10, marginLeft: 8 },
  gpsText: { fontSize: 18 }
});
