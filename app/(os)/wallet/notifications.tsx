// @ts-nocheck
import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useWalletStore } from "@/lib/modules/wallet/store";
import { WalletNotification } from "@/lib/modules/wallet/types";
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Bell, CheckCircle, Clock, ShieldAlert, AlertTriangle } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationRead } = useWalletStore();
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case "payment_received": return <ArrowDownLeft size={20} color="#10B981" />;
      case "payment_sent": return <ArrowUpRight size={20} color="#EF4444" />;
      case "escrow_update": return <Clock size={20} color="#8B5CF6" />;
      case "go_fund_draw": return <ArrowLeftRight size={20} color="#F97316" />;
      case "go_fund_repay_due": return <AlertTriangle size={20} color="#F59E0B" />;
      case "go_fund_repayed": return <CheckCircle size={20} color="#10B981" />;
      case "go_fund_limit_change": return <ArrowLeftRight size={20} color="#3B82F6" />;
      case "security_alert": return <ShieldAlert size={20} color="#EF4444" />;
      case "system_alert": return <Bell size={20} color="#6B7280" />;
      default: return <Bell size={20} color="#6B7280" />;
    }
  };

  const renderItem = ({ item }: { item: WalletNotification }) => (
    <TouchableOpacity
      style={[styles.notifRow, !item.read && !item.isRead && styles.notifUnread]}
      onPress={() => markNotificationRead(item.id)}
    >
      <View style={styles.notifIcon}>{getIcon(item.type)}</View>
      <View style={styles.notifInfo}>
        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifMessage}>{item.message}</Text>
        <Text style={styles.notifDate}>{new Date(item.createdAt || item.timestamp).toLocaleString()}</Text>
      </View>
      {item.amount && (
        <Text style={[styles.notifAmount, item.type === "payment_received" ? styles.income : styles.expense]}>
          {item.type === "payment_received" ? "+" : "-"} KSh {item.amount.toLocaleString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <View style={styles.filterRow}>
        {(["all", "payment_received", "payment_sent", "escrow_update", "go_fund_draw", "security_alert", "system_alert"] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.replace(/_/g, " ")}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  header: { fontSize: 22, fontWeight: "700", color: "#1F2937", marginBottom: 16 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: "#E5E7EB" },
  filterBtnActive: { backgroundColor: "#3B82F6" },
  filterText: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#FFF" },
  list: { gap: 8 },
  notifRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 12, gap: 12 },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: "#3B82F6" },
  notifIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  notifMessage: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  notifDate: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  notifAmount: { fontSize: 14, fontWeight: "700" },
  income: { color: "#10B981" },
  expense: { color: "#EF4444" },
});
