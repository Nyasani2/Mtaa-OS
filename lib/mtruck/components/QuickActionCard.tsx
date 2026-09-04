import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export function QuickActionCard({ label, icon, color, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.card, { borderColor: color + "30" }]} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: "23%", backgroundColor: "#1E293B", borderRadius: 12, padding: 12, borderWidth: 1, alignItems: "center" },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  label: { color: "white", fontSize: 11, fontWeight: "600", textAlign: "center" },
});
