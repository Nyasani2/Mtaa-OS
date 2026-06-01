import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Plan {
  id: string;
  name: string;
  price: number;
  data: string;
  validity: string;
  type: "airtime" | "data";
}

const PLANS: Plan[] = [
  { id: "1", name: "Daily 1GB", price: 50, data: "1GB", validity: "24hrs", type: "data" },
  { id: "2", name: "Weekly 5GB", price: 250, data: "5GB", validity: "7 days", type: "data" },
  { id: "3", name: "Monthly 15GB", price: 1000, data: "15GB", validity: "30 days", type: "data" },
  { id: "4", name: "Airtime 100", price: 100, data: "KSh 100", validity: "No expiry", type: "airtime" },
  { id: "5", name: "Airtime 500", price: 500, data: "KSh 500", validity: "No expiry", type: "airtime" },
  { id: "6", name: "Airtime 1000", price: 1000, data: "KSh 1000", validity: "No expiry", type: "airtime" },
];

export default function SIMShell() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"airtime" | "data">("data");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleBuy = (plan: Plan) => {
    Alert.alert(
      "Confirm Purchase",
      `${plan.name} — KSh ${plan.price}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay with Wallet",
          onPress: () => {
            router.push({
              pathname: "/wallet/send",
              params: { amount: plan.price.toString(), recipient: "SIM Purchase", note: plan.name },
            } as any);
          },
        },
      ]
    );
  };

  const filtered = PLANS.filter((p) => p.type === activeTab);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SIM Manager</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="phone-portrait-outline" size={20} color="#6366F1" />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>SIM 1</Text>
            <Text style={styles.infoValue}>Safaricom • +254 7XX XXX XXX</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="wifi-outline" size={20} color="#22C55E" />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Data Balance</Text>
            <Text style={styles.infoValue}>2.4 GB remaining</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#F59E0B" />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Airtime Balance</Text>
            <Text style={styles.infoValue}>KSh 145.00</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === "data" && styles.tabActive]} onPress={() => setActiveTab("data")}>
          <Text style={[styles.tabText, activeTab === "data" && styles.tabTextActive]}>Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "airtime" && styles.tabActive]} onPress={() => setActiveTab("airtime")}>
          <Text style={[styles.tabText, activeTab === "airtime" && styles.tabTextActive]}>Airtime</Text>
        </TouchableOpacity>
      </View>

      {filtered.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.planCard, selectedPlan === plan.id && styles.planCardActive]}
          onPress={() => setSelectedPlan(plan.id)}
        >
          <View style={styles.planLeft}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planData}>{plan.data}</Text>
            <Text style={styles.planValidity}>Valid for {plan.validity}</Text>
          </View>
          <View style={styles.planRight}>
            <Text style={styles.planPrice}>KSh {plan.price}</Text>
            <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(plan)}>
              <Text style={styles.buyText}>Buy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  infoCard: { backgroundColor: "#1a1a1a", marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  infoText: { flex: 1 },
  infoLabel: { color: "#64748B", fontSize: 12 },
  infoValue: { color: "#fff", fontSize: 15, fontWeight: "600", marginTop: 2 },
  tabs: { flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { paddingHorizontal: 16, paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#6366F1" },
  tabText: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#6366F1" },
  planCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1a1a1a", marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#1a1a1a" },
  planCardActive: { borderColor: "#6366F1" },
  planLeft: { flex: 1 },
  planName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  planData: { color: "#6366F1", fontSize: 14, fontWeight: "700", marginTop: 4 },
  planValidity: { color: "#64748B", fontSize: 12, marginTop: 2 },
  planRight: { alignItems: "flex-end" },
  planPrice: { color: "#fff", fontSize: 18, fontWeight: "700" },
  buyBtn: { backgroundColor: "#6366F1", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  buyText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
