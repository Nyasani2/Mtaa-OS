// app/(os)/index.tsx — MTAA OS Home Screen v7
// Reorderable apps, long-press menu, status bar, live clock, real user name

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
  Alert,
  Vibration,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Wallet, Heart, Car, Truck, Users, ShoppingBag, Store, MapPin,
  Briefcase, GraduationCap, Shield, Gavel, Phone, MessageCircle,
  Image as ImageIcon, Camera, Settings, Clock, Calendar, Calculator,
  Download, TrendingUp, CreditCard, Landmark, Bus, Bell, Wifi,
  BookOpen, Activity, QrCode, Send, ArrowDownLeft, ArrowUpRight,
  User, Sparkles, X, Lock, UtensilsCrossed, Eye, EyeOff,
  Newspaper, Zap, Home, ShieldCheck, Signal, Battery, BatteryFull,
  BatteryWarning, Trash2, RefreshCw, Info, GripVertical, ArrowUp, ArrowDown,
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

const APP_STORAGE_KEY = "@mtaa_os_app_layout_v2";
const EDIT_MODE_KEY = "@mtaa_os_edit_mode";

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 6) return `Good night, ${name}`;
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  if (hour < 21) return `Good evening, ${name}`;
  return `Good night, ${name}`;
}

const DEFAULT_SYSTEM_APPS = [
  { id: "clock", label: "Clock", icon: "Clock", route: "/(os)/clock", color: "#60A5FA" },
  { id: "calculator", label: "Calc", icon: "Calculator", route: "/(os)/calculator", color: "#FBBF24" },
  { id: "calendar", label: "Calendar", icon: "Calendar", route: "/(os)/calendar", color: "#F87171" },
  { id: "network", label: "Network", icon: "Activity", route: "/(os)/network", color: "#34D399" },
  { id: "wifi", label: "Wi-Fi", icon: "Wifi", route: "/(os)/wifi", color: "#818CF8" },
  { id: "reader", label: "Reader", icon: "BookOpen", route: "/(os)/reader", color: "#A78BFA" },
  { id: "settings", label: "Settings", icon: "Settings", route: "/(settings)", color: "#9CA3AF" },
  { id: "profile", label: "Profile", icon: "User", route: "/(os)/profile", color: "#F472B6" },
];

const DEFAULT_CORE_APPS = [
  { id: "wallet", label: "Wallet", icon: "Wallet", route: "/(os)/wallet", color: "#60A5FA" },
  { id: "messages", label: "Messages", icon: "MessageCircle", route: "/(communication)/messages", color: "#34D399" },
  { id: "phone", label: "Phone", icon: "Phone", route: "/(os)/phone", color: "#34D399" },
  { id: "gallery", label: "Gallery", icon: "ImageIcon", route: "/(media)/gallery", color: "#F472B6" },
  { id: "camera", label: "Camera", icon: "Camera", route: "/(media)/camera", color: "#9CA3AF" },
  { id: "appstore", label: "AppStore", icon: "Download", route: "/(os)/appstore", color: "#60A5FA" },
];

const DEFAULT_DOMAIN_APPS = [
  { id: "mtaxi", label: "MTaxi", icon: "Car", route: "/(transport)/mtaxi", color: "#FBBF24", badge: "SOON" },
  { id: "mtruck", label: "MTruck", icon: "Truck", route: "/(transport)/mtruck", color: "#FB923C", badge: "SOON" },
  { id: "boda", label: "Boda", icon: "Bus", route: "/(transport)/boda", color: "#F87171", badge: "SOON" },
  { id: "tribes", label: "Tribes", icon: "Users", route: "/(social)/tribes", color: "#A78BFA" },
  { id: "shop", label: "Shop", icon: "ShoppingBag", route: "/(commerce)/shop", color: "#F472B6" },
  { id: "marketplace", label: "Market", icon: "Store", route: "/(commerce)/marketplace", color: "#60A5FA" },
  { id: "jobs", label: "Jobs", icon: "Briefcase", route: "/(work)/jobs", color: "#34D399" },
  { id: "education", label: "Edu", icon: "GraduationCap", route: "/(education)", color: "#FBBF24" },
  { id: "health", label: "Health", icon: "Heart", route: "/(os)/health", color: "#F87171" },
  { id: "streets", label: "Streets", icon: "Users", route: "/(os)/streets", color: "#E91E63" },
  { id: "pulse", label: "Pulse", icon: "Zap", route: "/(os)/pulse", color: "#FF6B35" },
  { id: "nearby", label: "Nearby", icon: "MapPin", route: "/(local)/nearby", color: "#34D399" },
  { id: "property", label: "Property", icon: "Home", route: "/(os)/property", color: "#8B5CF6" },
  { id: "civic", label: "Civic", icon: "Shield", route: "/(civic)", color: "#60A5FA" },
  { id: "regulatory", label: "Regulatory", icon: "ShieldCheck", route: "/regulatory", color: "#059669" },
  { id: "courts", label: "Courts", icon: "Gavel", route: "/(civic)/courts", color: "#9CA3AF" },
  { id: "finance", label: "Finance", icon: "TrendingUp", route: "/(finance)", color: "#34D399" },
  { id: "credit", label: "Credit", icon: "CreditCard", route: "/(finance)/credit", color: "#FBBF24" },
  { id: "land", label: "Land", icon: "Landmark", route: "/(civic)/land", color: "#A78BFA" },
  { id: "restaurant", label: "Restaurant", icon: "UtensilsCrossed", route: "/(os)/restaurant", color: "#F97316" },
];

const ICON_MAP: Record<string, any> = {
  Wallet, Heart, Car, Truck, Users, ShoppingBag, Store, MapPin,
  Briefcase, GraduationCap, Shield, Gavel, Phone, MessageCircle,
  ImageIcon, Camera, Settings, Clock, Calendar, Calculator,
  Download, TrendingUp, CreditCard, Landmark, Bus, Bell, Wifi,
  BookOpen, Activity, QrCode, Send, ArrowDownLeft, ArrowUpRight,
  User, Sparkles, X, Lock, UtensilsCrossed, Eye, EyeOff,
  Newspaper, Zap, Home, ShieldCheck, Signal, Battery, BatteryFull,
  BatteryWarning, Trash2, RefreshCw, Info, GripVertical, ArrowUp, ArrowDown,
};

interface AppDef {
  id: string;
  label: string;
  icon: string;
  route: string;
  color: string;
  badge?: string;
}

interface AppLayout {
  system: AppDef[];
  core: AppDef[];
  domain: AppDef[];
}

function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function StatusBar() {
  const now = useCurrentTime();
  const [networkInfo] = useState({ type: "5G", strength: 4, wifi: true, battery: 78 });

  const timeStr = now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });

  const BatteryIcon = networkInfo.battery > 80 ? BatteryFull : networkInfo.battery > 20 ? Battery : BatteryWarning;

  return (
    <View style={statusStyles.container}>
      <View style={statusStyles.left}>
        <Text style={statusStyles.timeText}>{timeStr}</Text>
        <Text style={statusStyles.dateText}>{dateStr}</Text>
      </View>
      <View style={statusStyles.right}>
        <View style={statusStyles.iconGroup}>
          <Signal size={14} color="#fff" />
          <Text style={statusStyles.iconText}>{networkInfo.type}</Text>
        </View>
        {networkInfo.wifi && <Wifi size={14} color="#fff" />}
        <View style={statusStyles.iconGroup}>
          <BatteryIcon size={14} color={networkInfo.battery > 20 ? "#34D399" : "#EF4444"} />
          <Text style={statusStyles.iconText}>{networkInfo.battery}%</Text>
        </View>
      </View>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  left: { flexDirection: "row", alignItems: "center" },
  timeText: { fontFamily: FONTS.bold, fontSize: 13, color: "#fff" },
  dateText: { fontFamily: FONTS.medium, fontSize: 11, color: "rgba(255,255,255,0.7)", marginLeft: 6 },
  right: { flexDirection: "row", alignItems: "center" },
  iconGroup: { flexDirection: "row", alignItems: "center", marginLeft: 10 },
  iconText: { fontFamily: FONTS.medium, fontSize: 10, color: "#fff", marginLeft: 2 },
});

function LongPressMenu({
  visible,
  app,
  onClose,
  onUninstall,
  onUpdate,
  onAppInfo,
}: {
  visible: boolean;
  app: AppDef | null;
  onClose: () => void;
  onUninstall: () => void;
  onUpdate: () => void;
  onAppInfo: () => void;
}) {
  if (!app) return null;

  const AppIcon = ICON_MAP[app.icon] || Shield;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={menuStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={menuStyles.card}>
          <View style={menuStyles.header}>
            <View style={[menuStyles.appIcon, { backgroundColor: app.color + "20" }]}>
              <AppIcon size={24} color={app.color} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={menuStyles.appName}>{app.label}</Text>
              <Text style={menuStyles.appRoute}>{app.route}</Text>
            </View>
          </View>
          <View style={menuStyles.divider} />
          <TouchableOpacity style={menuStyles.action} onPress={onUninstall}>
            <Trash2 size={18} color="#EF4444" />
            <Text style={[menuStyles.actionText, { color: "#EF4444" }]}>Uninstall</Text>
          </TouchableOpacity>
          <TouchableOpacity style={menuStyles.action} onPress={onUpdate}>
            <RefreshCw size={18} color="#3B82F6" />
            <Text style={menuStyles.actionText}>Check for Updates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={menuStyles.action} onPress={onAppInfo}>
            <Info size={18} color="#6B7280" />
            <Text style={menuStyles.actionText}>App Info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[menuStyles.action, { borderBottomWidth: 0 }]} onPress={onClose}>
            <X size={18} color="#6B7280" />
            <Text style={menuStyles.actionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const menuStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#1C1C1E", borderRadius: 20, width: width * 0.8, paddingVertical: 8 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  appIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  appName: { fontFamily: FONTS.bold, fontSize: 16, color: "#fff" },
  appRoute: { fontFamily: FONTS.regular, fontSize: 12, color: "#8E8E93", marginTop: 2 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginHorizontal: 16 },
  action: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  actionText: { fontFamily: FONTS.medium, fontSize: 15, color: "#fff", marginLeft: 12 },
});

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

  const [systemApps, setSystemApps] = useState<AppDef[]>(DEFAULT_SYSTEM_APPS);
  const [coreApps, setCoreApps] = useState<AppDef[]>(DEFAULT_CORE_APPS);
  const [domainApps, setDomainApps] = useState<AppDef[]>(DEFAULT_DOMAIN_APPS);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuApp, setMenuApp] = useState<AppDef | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    loadLayout();
    loadEditMode();
  }, []);

  const loadLayout = async () => {
    try {
      const saved = await AsyncStorage.getItem(APP_STORAGE_KEY);
      if (saved) {
        const layout: AppLayout = JSON.parse(saved);
        if (layout.system?.length) setSystemApps(layout.system);
        if (layout.core?.length) setCoreApps(layout.core);
        if (layout.domain?.length) setDomainApps(layout.domain);
      }
    } catch (e) {
      console.log("No saved layout, using defaults");
    }
  };

  const loadEditMode = async () => {
    try {
      const saved = await AsyncStorage.getItem(EDIT_MODE_KEY);
      if (saved) setEditMode(JSON.parse(saved));
    } catch (e) {}
  };

  const saveLayout = async (sys: AppDef[], core: AppDef[], dom: AppDef[]) => {
    try {
      const layout: AppLayout = { system: sys, core: core, domain: dom };
      await AsyncStorage.setItem(APP_STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      console.log("Failed to save layout");
    }
  };

  const toggleEditMode = async () => {
    const next = !editMode;
    setEditMode(next);
    await AsyncStorage.setItem(EDIT_MODE_KEY, JSON.stringify(next));
    if (!next) {
      await saveLayout(systemApps, coreApps, domainApps);
    }
  };

  const moveApp = (apps: AppDef[], index: number, direction: "up" | "down") => {
    const newApps = [...apps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newApps.length) return apps;
    [newApps[index], newApps[targetIndex]] = [newApps[targetIndex], newApps[index]];
    return newApps;
  };

  const handleMove = (section: "system" | "core" | "domain", index: number, direction: "up" | "down") => {
    if (section === "system") {
      const moved = moveApp(systemApps, index, direction);
      setSystemApps(moved);
    } else if (section === "core") {
      const moved = moveApp(coreApps, index, direction);
      setCoreApps(moved);
    } else {
      const moved = moveApp(domainApps, index, direction);
      setDomainApps(moved);
    }
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || user?.user_metadata?.full_name || user?.user_metadata?.name || "Warrior";
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

  const handleLongPress = (app: AppDef) => {
    Vibration.vibrate(50);
    setMenuApp(app);
    setMenuVisible(true);
  };

  const handleUninstall = () => {
    if (!menuApp) return;
    Alert.alert("Uninstall App", `Remove ${menuApp.label}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Uninstall", style: "destructive", onPress: () => {
          setDomainApps(prev => prev.filter(a => a.id !== menuApp.id));
          setMenuVisible(false);
          setTimeout(() => saveLayout(systemApps, coreApps, domainApps.filter(a => a.id !== menuApp.id)), 100);
        }
      },
    ]);
  };

  const handleUpdate = () => {
    Alert.alert("Check for Updates", "This app is up to date.");
    setMenuVisible(false);
  };

  const handleAppInfo = () => {
    Alert.alert("App Info", `${menuApp?.label}\nRoute: ${menuApp?.route}\nVersion: 1.0.0`);
    setMenuVisible(false);
  };

  const renderTile = (app: AppDef, index: number, section: "system" | "core" | "domain", size: number = TILE_SIZE, iconSize: number = ICON_SIZE) => {
    const AppIcon = ICON_MAP[app.icon] || Shield;

    return (
      <View key={app.id} style={styles.tileWrapper}>
        {editMode && (
          <View style={styles.editControls}>
            <TouchableOpacity onPress={() => handleMove(section, index, "up")} disabled={index === 0}>
              <ArrowUp size={14} color={index === 0 ? "#4B5563" : "#fff"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMove(section, index, "down")}>
              <ArrowDown size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.tileContainer}
          onPress={() => !editMode && router.push(app.route)}
          onLongPress={() => handleLongPress(app)}
          delayLongPress={400}
          activeOpacity={0.7}
        >
          <View style={[styles.tile, { width: size, height: size }, editMode && { borderColor: "#3B82F6", borderWidth: 1.5 }]}>
            <AppIcon size={iconSize} color={app.color} strokeWidth={2} />
            {app.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{app.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.tileLabel} numberOfLines={1}>{app.label}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("@/assets/images/mtaa_home.jpg")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar />

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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SYSTEM</Text>
              <TouchableOpacity onPress={toggleEditMode}>
                <Text style={styles.editToggle}>{editMode ? "Done" : "Edit"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tileRow}>
              {systemApps.map((app, i) => renderTile(app, i, "system", SMALL_TILE, SMALL_ICON))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CORE</Text>
            </View>
            <View style={styles.tileRow}>
              {coreApps.map((app, i) => renderTile(app, i, "core", TILE_SIZE, ICON_SIZE))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>APPS</Text>
            </View>
            <View style={styles.tileRow}>
              {domainApps.map((app, i) => renderTile(app, i, "domain", TILE_SIZE, ICON_SIZE))}
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

      <LongPressMenu
        visible={menuVisible}
        app={menuApp}
        onClose={() => setMenuVisible(false)}
        onUninstall={handleUninstall}
        onUpdate={handleUpdate}
        onAppInfo={handleAppInfo}
      />
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
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.sm,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  liveStats: { flexDirection: "row", alignItems: "center" },
  statDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34D399", marginRight: 6 },
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
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SIZES.sm },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5 },
  editToggle: { fontFamily: FONTS.bold, fontSize: 12, color: "#3B82F6" },

  tileRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "flex-start",
  },

  tileWrapper: {
    alignItems: "center",
    marginHorizontal: 4,
    marginVertical: 6,
    width: TILE_SIZE + 8,
  },

  tileContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  editControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
    backgroundColor: "rgba(59,130,246,0.3)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
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
