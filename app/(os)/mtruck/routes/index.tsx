import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useRouteStore } from "@/lib/mtruck/hooks/use-route-store";
import { RouteCard } from "@/lib/mtruck/components/RouteCard";

export default function RoutesScreen() {
  const { routes, optimizeRoute } = useRouteStore();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputCard}>
        <TextInput style={styles.input} placeholder="Origin" placeholderTextColor="#64748B" value={origin} onChangeText={setOrigin} />
        <TextInput style={styles.input} placeholder="Destination" placeholderTextColor="#64748B" value={destination} onChangeText={setDestination} />
        <TouchableOpacity style={[styles.btn, (!origin || !destination) && styles.btnDisabled]} onPress={() => optimizeRoute(origin, destination)} disabled={!origin || !destination}>
          <Text style={styles.btnText}>Optimize Route</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Saved Routes</Text>
      {routes.map((route) => <RouteCard key={route.id} route={route} />)}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  inputCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: 16, margin: 16 },
  input: { backgroundColor: "#0F172A", borderRadius: 10, padding: 12, color: "white", marginBottom: 10 },
  btn: { backgroundColor: "#6366F1", borderRadius: 10, padding: 14, alignItems: "center" },
  btnDisabled: { backgroundColor: "#334155" },
  btnText: { color: "white", fontWeight: "bold" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 8, marginBottom: 12, paddingHorizontal: 20 },
});
