// app/(os)/index.tsx — MTAA OS Home Screen v6
// Android-style dark tiles, Restaurant visible, Wallet privacy, full-bleed background

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Wallet, Heart, Car, Truck, Users, ShoppingBag, Store, MapPin,
  Briefcase, GraduationCap, Shield, Gavel, Phone, MessageCircle,
  Image as ImageIcon, Camera, Settings, Clock, Calendar, Calculator,
  Download, TrendingUp, CreditCard, Landmark, Bus, Bell, Wifi,
  BookOpen, Activity, QrCode, Send, ArrowDownLeft, ArrowUpRight,
  User, Sparkles, X, Lock, UtensilsCrossed, Eye, EyeOff,
  Newspaper, Zap, Home,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/auth/useAuthStore";
import { useWalletStore } from "@/hooks/useWalletStore";
import { asisTester } from "@/lib/asis/asis-tester";
import { COLORS, FONTS, SIZES } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

const TILE_SIZE = 72;
const ICON_SIZE = 28;
const SMALL_TILE = 56;
const SMALL_ICON = 22;

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 6) return `Good night, ${name}`;
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  if (hour < 21) return `Good evening, ${name}`;
  return `Good night, ${name}`;
}

const SYSTEM_APPS = [
  { id: "clock", label: "Clock", icon: Clock, route: "/(os)/clock", color: "#60A5FA" },
  { id: "calculator", label: "Calc", icon: Calculator, route: "/(os)/calculator", color: "#FBBF24" },
  { id: "calendar", label: "Calendar", icon: Calendar, route: "/(os)/calendar", color: "#F87171" },
  { id: "network", label: "Network", icon: Activity, route: "/(os)/network", color: "#34D399" },
  { id: "wifi", label: "Wi-Fi", icon: Wifi, route: "/(os)/wifi", color: "#818CF8" },
  { id: "reader", label: "Reader", icon: BookOpen, route: "/(os)/reader", color: "#A78BFA" },
  { id: "settings", label: "Settings", icon: Settings, route: "/(settings)", color: "#9CA3AF" },
  { id: "profile", label: "Profile", icon: User, route: "/(os)/profile", color: "#F472B6" },
];

const CORE_APPS = [
  { id: "wallet", label: "Wallet", icon: Wallet, route: "/(os)/wallet", color: "#60A5FA" },
  { id: "messages", label: "Messages", icon: MessageCircle, route: "/(communication)/messages", color: "#34D399" },
  { id: "phone", label: "Phone", icon: Phone, route: "/(os)/phone", color: "#34D399" },
  { id: "gallery", label: "Gallery", icon: ImageIcon, route: "/(media)/gallery", color: "#F472B6" },
  { id: "camera", label: "Camera", icon: Camera, route: "/(media)/camera", color: "#9CA3AF" },
  { id: "appstore", label: "AppStore", icon: Download, route: "/(os)/appstore", color: "#60A5FA" },
];

const DOMAIN_APPS = [
  { id: "mtaxi", label: "MTaxi", icon: Car, route: "/(transport)/mtaxi", color: "#FBBF24", badge: "SOON" },
  { id: "mtruck", label: "MTruck", icon: Truck, route: "/(transport)/mtruck", color: "#FB923C", badge: "SOON" },
  { id: "boda", label: "Boda", icon: Bus, route: "/(transport)/boda", color: "#F87171", badge: "SOON" },
  { id: "tribes", label: "Tribes", icon: Users, route: "/(social)/tribes", color: "#A78BFA" },
  { id: "shop", label: "Shop", icon: ShoppingBag, route: "/(commerce)/shop", color: "#F472B6" },
  { id: "marketplace", label: "Market", icon: Store, route: "/(commerce)/marketplace", color: "#60A5FA" },
  { id: "jobs", label: "Jobs", icon: Briefcase, route: "/(work)/jobs", color: "#34D399" },
  { id: "education", label: "Edu", icon: GraduationCap, route: "/(education)", color: "#FBBF24" },
  { id: "health", label: "Health", icon: Heart, route: "/(health)", color: "#F87171" },
  { id: "streets", label: "Streets", icon: Users, route: "/(os)/streets", color: "#E91E63" },
  { id: "pulse", label: "Pulse", icon: Zap, route: "/(os)/pulse", color: "#FF6B35" },
  { id: "nearby", label: "Nearby", icon: MapPin, route: "/(local)/nearby", color: "#34D399" },
  { id: "property", label: "Property", icon: Home, route: "/(os)/property", color: "#8B5CF6" },
  { id: "civic", label: "Civic", icon: Shield, route: "/(civic)", color: "#60A5FA" },
  { id: "courts", label: "Courts", icon: Gavel, route: "/(civic)/courts", color: "#9CA3AF" },
  { id: "finance", label: "Finance", icon: TrendingUp, route: "/(finance)", color: "#34D399" },
  { id: "credit", label: "Credit", icon: CreditCard, route: "/(finance)/credit", color: "#FBBF24" },
  { id: "land", label: "Land", icon: Landmark, route: "/(civic)/land", color: "#A78BFA" },
  { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, route: "/(os)/restaurant", color: "#F97316" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated, pinSet, verifyPIN, checkPinRequired } = useAuthStore();
  const { balance } = useWalletStore();

  const [refreshing, setRefreshing] = useState(false);
  const [liveStats] = useState({ users: 1247, transactions: 8934, online: 342 });
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [asisReport, setAsisReport] = useState<string | null>(null);
  const [showAsis, setShowAsis] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Warrior";
  const greeting = getGreeting(displayName);
  const safeBalance = (balance ?? 0).toLocaleString("en-KE", { minimumFractionDigits: 2 });

  useEffect(() => {
    checkPinRequired?.().then((required: boolean) => {
      if (required && isAuthenticated) setPinModalVisible(true);
    });
  }, [checkPinRequired, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const handlePinSubmit = async () => {
    if (!pinInput || pinInput.length < 4) {
      setPinError("Enter your PIN");
      return;
    }
    const result = await verifyPIN(pinInput);
    if (result.valid) {
      setPinModalVisible(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError(result.error || "Invalid PIN");
      setPinInput("");
    }
  };

  const runAsisAudit = async () => {
    setShowAsis(true);
    setAsisReport("ASIS is running full audit...");
    try {
      const report = await asisTester.runFullAudit();
      setAsisReport(report.summary + "\n\n" + report.results.map(r =>
        `${r.passed ? "✅" : "❌"} ${r.module}: ${r.test}${r.error ? ` — ${r.error}` : ""}`
      ).join("\n"));
    } catch (err: any) {
      setAsisReport("ASIS Audit Failed: " + err.message);
    }
  };

  const renderTile = (app: any, size: number = TILE_SIZE, iconSize: number = ICON_SIZE) => (
    <TouchableOpacity
      key={app.id}
      style={styles.tileContainer}
      onPress={() => router.push(app.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.tile, { width: size, height: size }]}>
        <app.icon size={iconSize} color={app.color} strokeWidth={2} />
        {app.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{app.badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>{app.label}</Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require("@/assets/images/mtaa_home.jpg")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(settings)")}>
              <Settings size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.liveStats}>
              <View style={styles.statDot} />
              <Text style={styles.statText}>{liveStats.online.toLocaleString()} online</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(os)/wallet/notifications")}>
              <Bell size={20} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          <Text style={styles.greeting}>{greeting}</Text>

          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                {balanceVisible ? <EyeOff size={16} color="rgba(255,255,255,0.6)" /> : <Eye size={16} color="rgba(255,255,255,0.6)" />}
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceValue}>
              {balanceVisible ? `KSh ${safeBalance}` : "KSh ••••••"}
            </Text>
            <View style={styles.quickActions}>
              {[
                { icon: QrCode, label: "Scan", route: "/(os)/wallet/qr" },
                { icon: Send, label: "Send", route: "/(os)/wallet/send" },
                { icon: ArrowDownLeft, label: "Deposit", route: "/(os)/wallet/deposit" },
                { icon: ArrowUpRight, label: "Withdraw", route: "/(os)/wallet/withdraw" },
              ].map((action) => (
                <TouchableOpacity key={action.label} style={styles.qaBtn} onPress={() => router.push(action.route as any)}>
                  <action.icon size={20} color="#fff" />
                  <Text style={styles.qaText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SYSTEM</Text>
            <View style={styles.tileRow}>
              {SYSTEM_APPS.map(app => renderTile(app, SMALL_TILE, SMALL_ICON))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CORE</Text>
            <View style={styles.tileRow}>
              {CORE_APPS.map(app => renderTile(app, TILE_SIZE, ICON_SIZE))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>APPS</Text>
            <View style={styles.tileRow}>
              {DOMAIN_APPS.map(app => renderTile(app, TILE_SIZE, ICON_SIZE))}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {liveStats.users.toLocaleString()} users • {liveStats.transactions.toLocaleString()} transactions
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.asisBtn} onPress={runAsisAudit}>
          <Sparkles size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={pinModalVisible} transparent animationType="fade">
        <View style={styles.pinOverlay}>
          <View style={styles.pinCard}>
            <Lock size={32} color={COLORS.primary} />
            <Text style={styles.pinTitle}>Enter PIN</Text>
            <Text style={styles.pinSub}>Secure your MTAA OS</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="••••"
              placeholderTextColor="#666"
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              value={pinInput}
              onChangeText={setPinInput}
              onSubmitEditing={handlePinSubmit}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <TouchableOpacity style={styles.pinBtn} onPress={handlePinSubmit}>
              <Text style={styles.pinBtnText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAsis} transparent animationType="slide">
        <View style={styles.asisOverlay}>
          <View style={styles.asisCard}>
            <View style={styles.asisHeader}>
              <Text style={styles.asisTitle}>🤖 ASIS AI Report</Text>
              <TouchableOpacity onPress={() => setShowAsis(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.asisScroll}>
              <Text style={styles.asisReport}>{asisReport}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width, height },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.50)" },
  scroll: { paddingHorizontal: SIZES.md, paddingBottom: SIZES.xl * 3 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.sm,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  liveStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34D399" },
  statText: { fontFamily: FONTS.medium, fontSize: 12, color: "#fff" },
  notifDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30" },

  greeting: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: "#fff",
    marginTop: SIZES.sm,
    marginBottom: SIZES.md,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  balanceCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: SIZES.lg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: { fontFamily: FONTS.medium, fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 },
  balanceValue: { fontFamily: FONTS.bold, fontSize: 34, color: "#fff", marginTop: 4, marginBottom: SIZES.md },
  quickActions: { flexDirection: "row", justifyContent: "space-between", gap: SIZES.sm },
  qaBtn: { flex: 1, alignItems: "center", paddingVertical: SIZES.sm, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: SIZES.md },
  qaText: { fontFamily: FONTS.medium, fontSize: 11, color: "#fff", marginTop: 4 },

  section: { marginBottom: SIZES.lg },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: SIZES.sm, textTransform: "uppercase", letterSpacing: 1.5 },

  tileRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "flex-start",
    gap: 0,
  },

  tileContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    marginVertical: 6,
    width: TILE_SIZE + 8,
  },

  tile: {
    backgroundColor: "rgba(30, 30, 40, 0.75)",
    borderRadius: TILE_SIZE * 0.22,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },

  tileLabel: { 
    fontFamily: FONTS.medium, 
    fontSize: 11, 
    color: "#fff", 
    textAlign: "center", 
    marginTop: 6,
    opacity: 0.9,
    letterSpacing: 0.2,
    width: TILE_SIZE,
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#1a1a2e",
  },
  badgeText: { fontFamily: FONTS.bold, fontSize: 10, color: "#fff" },

  footer: { alignItems: "center", marginTop: SIZES.lg, paddingBottom: SIZES.xl },
  footerText: { fontFamily: FONTS.regular, fontSize: 11, color: "rgba(255,255,255,0.4)" },

  asisBtn: {
    position: "absolute",
    bottom: SIZES.xl,
    right: SIZES.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#AF52DE",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#AF52DE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  pinOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" },
  pinCard: { backgroundColor: "#1C1C1E", borderRadius: SIZES.lg, padding: SIZES.xl, width: width * 0.8, alignItems: "center" },
  pinTitle: { fontFamily: FONTS.bold, fontSize: 20, color: "#fff", marginTop: SIZES.md },
  pinSub: { fontFamily: FONTS.regular, fontSize: 13, color: "#8E8E93", marginTop: 4, marginBottom: SIZES.lg },
  pinInput: { backgroundColor: "#2C2C2E", borderRadius: SIZES.md, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, color: "#fff", fontSize: 24, fontFamily: FONTS.bold, textAlign: "center", width: "100%", letterSpacing: 8 },
  pinError: { fontFamily: FONTS.medium, fontSize: 13, color: "#FF3B30", marginTop: SIZES.sm },
  pinBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.md, paddingVertical: SIZES.md, width: "100%", alignItems: "center", marginTop: SIZES.lg },
  pinBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: "#fff" },

  asisOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  asisCard: { backgroundColor: COLORS.background, borderTopLeftRadius: SIZES.lg, borderTopRightRadius: SIZES.lg, padding: SIZES.lg, maxHeight: height * 0.7 },
  asisHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SIZES.md },
  asisTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  asisScroll: { maxHeight: height * 0.5 },
  asisReport: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
