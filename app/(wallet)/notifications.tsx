import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bell,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Zap,
  AlertTriangle,
  CheckCheck,
  Trash2,
  Circle,
} from "lucide-react-native";
import { useWalletStore } from "@/lib/modules/wallet/store";
import type { WalletNotification } from "@/lib/modules/wallet/types";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllRead, clearNotifications } = useWalletStore();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotifIcon = (n: WalletNotification) => {
    switch (n.type) {
      case "payment_received": return <ArrowDownLeft size={18} color="#10B981" />;
      case "payment_sent": return <ArrowUpRight size={18} color="#EF4444" />;
      case "escrow_update": return <Shield size={18} color="#6366F1" />;
      case "go_fund_draw": return <Zap size={18} color="#F97316" />;
      case "go_fund_repay_due": return <AlertTriangle size={18} color="#F59E0B" />;
      case "go_fund_repayed": return <Zap size={18} color="#10B981" />;
      case "go_fund_limit_change": return <Zap size={18} color="#3B82F6" />;
      case "system_alert": return <Bell size={18} color="#6B7280" />;
      case "security_alert": return <AlertTriangle size={18} color="#EF4444" />;
      default: return <Bell size={18} color="#6B7280" />;
    }
  };

  const getNotifBg = (n: WalletNotification) => {
    switch (n.type) {
      case "payment_received": return "#ECFDF5";
      case "payment_sent": return "#FEF2F2";
      case "escrow_update": return "#E0E7FF";
      case "go_fund_draw": return "#FFF7ED";
      case "go_fund_repay_due": return "#FFFBEB";
      case "go_fund_repayed": return "#ECFDF5";
      case "go_fund_limit_change": return "#DBEAFE";
      case "system_alert": return "#F3F4F6";
      case "security_alert": return "#FEF2F2";
      default: return "#F3F4F6";
    }
  };

  const grouped = useMemo(() => {
    const today: WalletNotification[] = [];
    const yesterday: WalletNotification[] = [];
    const older: WalletNotification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    notifications.forEach((n) => {
      const d = new Date(n.createdAt);
      if (d >= todayStart) today.push(n);
      else if (d >= yesterdayStart) yesterday.push(n);
      else older.push(n);
    });

    return { today, yesterday, older };
  }, [notifications]);

  const renderGroup = (title: string, items: WalletNotification[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.group}>
        <Text style={styles.groupTitle}>{title}</Text>
        {items.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.notifRow, !n.isRead && styles.notifRowUnread]}
            onPress={() => {
              markNotificationRead(n.id);
              if (n.actionRoute) router.push(n.actionRoute as any);
            }}
          >
            <View style={[styles.notifIcon, { backgroundColor: getNotifBg(n) }]}>
              {getNotifIcon(n)}
            </View>
            <View style={styles.notifInfo}>
              <View style={styles.notifHeader}>
                <Text style={[styles.notifTitle, !n.isRead && styles.notifTitleUnread]}>
                  {n.title}
                </Text>
                {!n.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifMessage} numberOfLines={2}>{n.message}</Text>
              <Text style={styles.notifTime}>
                {new Date(n.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
            {n.amount && (
              <Text style={[styles.notifAmount, { color: n.type === "payment_received" || n.type === "go_fund_repayed" ? "#10B981" : "#EF4444" }]}>
                {n.type === "payment_received" || n.type === "go_fund_repayed" ? "+" : "-"}KSh {n.amount.toLocaleString()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {notifications.length > 0 && (
        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={markAllRead}>
            <CheckCheck size={16} color="#10B981" />
            <Text style={styles.actionBtnText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={clearNotifications}>
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderGroup("Today", grouped.today)}
        {renderGroup("Yesterday", grouped.yesterday)}
        {renderGroup("Earlier", grouped.older)}

        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Bell size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>Payment alerts and updates will appear here</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },

  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: "600", color: "#10B981" },

  group: { marginBottom: 16 },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9CA3AF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  notifRowUnread: { backgroundColor: "#F0FDF4" },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notifInfo: { flex: 1 },
  notifHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  notifTitle: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  notifTitleUnread: { color: "#1F2937", fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  notifMessage: { fontSize: 13, color: "#6B7280", marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  notifAmount: { fontSize: 14, fontWeight: "700", marginLeft: 8 },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
});
