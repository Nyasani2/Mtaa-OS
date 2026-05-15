// app/(os)/settings/index.tsx
// MTAA OS V10 — Settings Home / Menu Screen
// Complete replacement. All buttons connect to real screens.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import {
  Bell,
  User,
  Shield,
  CreditCard,
  Smartphone,
  Globe,
  Moon,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Palette,
  KeyRound,
  Lock,
  Eye,
  MapPin,
  Truck,
  ShoppingBag,
  Users,
  Briefcase,
  GraduationCap,
  Building2,
  Heart,
  Zap,
  BarChart3,
  Wallet,
  Receipt,
  History,
  Bug,
  MessageSquare,
  Languages,
  Type,
  Paintbrush,
  Database,
  Wifi,
  QrCode,
  Fingerprint,
  ScanFace,
  BellRing,
  Volume2,
  Vibrate,
  Sun,
  MonitorSmartphone,
  Link2,
  Trash2,
  CircleDollarSign,
  Landmark,
  ScrollText,
  ShieldCheck,
  Ban,
  Ticket,
  Award,
  TrendingUp,
  Radio,
  Webhook,
  Settings,
  Gauge,
  Activity,
  Boxes,
  FolderOpen,
  AppWindow,
  Rocket,
  Terminal,
  Cpu,
  Network,
  Server,
  HardDrive,
  Cloud,
  LockKeyhole,
  FileKey,
  ScanLine,
  BadgeCheck,
  Stethoscope,
  Plane,
  Send,
  Bus,
  Car,
  Bike,
  Ambulance,
  Pill,
  Syringe,
  Microscope,
  Brain,
  HeartPulse,
  Baby,
  Accessibility,
  Verified,
  Gavel,
  Scale,
  FileCheck,
  BookOpen,
  School,
  Medal,
  Trophy,
  Crown,
  Star,
  Sparkles,
  Flame,
  Snowflake,
  CloudRain,
  CloudSun,
  Wind,
  Thermometer,
  Droplets,
  Waves,
  Mountain,
  TreePine,
  Flower,
  Leaf,
  Compass,
  Map,
  MapPinned,
  Navigation,
  Locate,
  Crosshair,
  Target,
  Focus,
  Scan,
  ScanSearch,
  ScanEye,
  ScanBarcode,
  ScanText,
  Rss,
  Bluetooth,
  Usb,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Plug,
  Power,
  PowerOff,
  Sunrise,
  Sunset,
  StarHalf,
  ThumbsUp,
  ThumbsDown,
  Hand,
  HandMetal,
  HandHelping,
  HandHeart,
  HandCoins,
  Handshake,
  Clapperboard,
  Film,
  Popcorn,
  Tv,
  Monitor,
  Laptop,
  Tablet,
  Headphones,
  Headset,
  Ear,
  Speaker,
  Mic,
  Webcam,
  Keyboard,
  Mouse,
  Gamepad,
  Joystick,
  Cable,
  CircuitBoard,
} from "lucide-react-native-native";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SettingsMenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route: string;
  badge?: string | number | null;
  section: string;
}

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url?: string;
  kyc_level: number;
  reputation_score: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

const SETTINGS_API = {
  async getUserProfile(): Promise<UserProfile | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, email, avatar_url, kyc_level, reputation_score")
      .eq("id", user.user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as UserProfile;
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function SettingsIndexScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await SETTINGS_API.getUserProfile();
      setProfile(p);
    } catch (err: any) {
      console.log("Profile load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await SETTINGS_API.signOut();
              router.replace("/(auth)/login" as any);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  // ─── Theme ─────────────────────────────────────────────────────────────────

  const theme = {
    bg: isDark ? "#0a0a0f" : "#f5f5f7",
    card: isDark ? "#1a1a24" : "#ffffff",
    text: isDark ? "#ffffff" : "#1a1a2e",
    textSecondary: isDark ? "#8b8b9e" : "#6b6b7b",
    border: isDark ? "#2a2a3a" : "#e5e5ea",
    accent: "#6366f1",
    accentLight: isDark ? "#4338ca" : "#e0e7ff",
    danger: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b",
  };

  // ─── Menu Data ─────────────────────────────────────────────────────────────

  const menuItems: SettingsMenuItem[] = [
    // ── Account ──
    {
      id: "profile",
      title: "Profile",
      subtitle: "Name, photo, bio, KYC status",
      icon: <User size={22} color={theme.accent} />,
      route: "/(os)/settings/profile",
      section: "Account",
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Push, email, SMS, alerts",
      icon: <Bell size={22} color={theme.accent} />,
      route: "/(os)/settings/notifications",
      section: "Account",
    },
    {
      id: "security",
      title: "Security",
      subtitle: "Password, 2FA, biometric, sessions",
      icon: <Shield size={22} color={theme.accent} />,
      route: "/(os)/settings/security",
      section: "Account",
    },
    {
      id: "privacy",
      title: "Privacy",
      subtitle: "Visibility, data, permissions",
      icon: <Lock size={22} color={theme.accent} />,
      route: "/(os)/settings/privacy",
      section: "Account",
    },
    {
      id: "kyc",
      title: "Identity Verification",
      subtitle: "KYC level, documents, trust score",
      icon: <BadgeCheck size={22} color={theme.accent} />,
      route: "/(os)/settings/kyc",
      badge: profile?.kyc_level ? `Level ${profile.kyc_level}` : "Required",
      section: "Account",
    },
    {
      id: "devices",
      title: "Devices",
      subtitle: "Manage active devices",
      icon: <Smartphone size={22} color={theme.accent} />,
      route: "/(os)/settings/devices",
      section: "Account",
    },

    // ── Wallet & Payments ──
    {
      title: "Wallet Preferences",
      subtitle: "Currency, limits, alerts",
      icon: <Wallet size={22} color={theme.accent} />,
      section: "Wallet",
    },
    {
      id: "payment-methods",
      title: "Payment Methods",
      subtitle: "Cards, banks, mobile money",
      icon: <CreditCard size={22} color={theme.accent} />,
      route: "/(os)/settings/payment-methods",
      section: "Wallet",
    },
    {
      id: "tx-alerts",
      title: "Transaction Alerts",
      subtitle: "Alert rules for payments",
      icon: <Receipt size={22} color={theme.accent} />,
      route: "/(os)/settings/tx-alerts",
      section: "Wallet",
    },

    // ── Appearance ──
    {
      id: "theme",
      title: "Theme",
      subtitle: "Light, dark, system",
      icon: <Palette size={22} color={theme.accent} />,
      route: "/(os)/settings/theme",
      section: "Appearance",
    },
    {
      id: "accent",
      title: "Accent Color",
      subtitle: "Primary UI color",
      icon: <Paintbrush size={22} color={theme.accent} />,
      route: "/(os)/settings/accent",
      section: "Appearance",
    },
    {
      id: "font-size",
      title: "Font Size",
      subtitle: "Text scaling",
      icon: <Type size={22} color={theme.accent} />,
      route: "/(os)/settings/font-size",
      section: "Appearance",
    },
    {
      id: "language",
      title: "Language",
      subtitle: "App language",
      icon: <Languages size={22} color={theme.accent} />,
      route: "/(os)/settings/language",
      section: "Appearance",
    },

    // ── Communication ──
    {
      id: "quiet-hours",
      title: "Quiet Hours",
      subtitle: "Do Not Disturb schedule",
      icon: <Moon size={22} color={theme.accent} />,
      route: "/(os)/settings/quiet-hours",
      section: "Communication",
    },
    {
      id: "app-notifications",
      title: "Per-App Notifications",
      subtitle: "Granular app controls",
      icon: <BellRing size={22} color={theme.accent} />,
      route: "/(os)/settings/app-notifications",
      section: "Communication",
    },
    {
      id: "block-list",
      title: "Block List",
      subtitle: "Blocked users and apps",
      icon: <Ban size={22} color={theme.accent} />,
      route: "/(os)/settings/block-list",
      section: "Communication",
    },

    // ── Apps & Services ──
    {
      id: "installed-apps",
      title: "Installed Apps",
      subtitle: "Manage your apps",
      icon: <AppWindow size={22} color={theme.accent} />,
      route: "/(os)/settings/installed-apps",
      section: "Apps",
    },
    {
      id: "permissions",
      title: "Permissions",
      subtitle: "App permissions",
      icon: <ShieldCheck size={22} color={theme.accent} />,
      route: "/(os)/settings/permissions",
      section: "Apps",
    },
    {
      id: "storage",
      title: "Storage",
      subtitle: "Cache, downloads, data",
      icon: <Database size={22} color={theme.accent} />,
      route: "/(os)/settings/storage",
      section: "Apps",
    },
    {
      id: "network",
      title: "Network",
      subtitle: "Data usage, sync",
      icon: <Wifi size={22} color={theme.accent} />,
      route: "/(os)/settings/network",
      section: "Apps",
    },

    // ── Developer & Advanced ──
    {
      id: "api-keys",
      title: "API Keys",
      subtitle: "Developer access tokens",
      icon: <KeyRound size={22} color={theme.accent} />,
      route: "/(os)/settings/api-keys",
      section: "Developer",
    },
    {
      id: "webhooks",
      title: "Webhooks",
      subtitle: "Event endpoints",
      icon: <Webhook size={22} color={theme.accent} />,
      route: "/(os)/settings/webhooks",
      section: "Developer",
    },
    {
      id: "logs",
      title: "System Logs",
      subtitle: "Debug and error logs",
      icon: <Terminal size={22} color={theme.accent} />,
      route: "/(os)/settings/logs",
      section: "Developer",
    },
    {
      id: "rails",
      title: "Rails",
      subtitle: "Feature flags and toggles",
      icon: <Gauge size={22} color={theme.accent} />,
      route: "/(os)/settings/rails",
      section: "Developer",
    },

    // ── Support ──
    {
      id: "help",
      title: "Help Center",
      subtitle: "FAQs and guides",
      icon: <HelpCircle size={22} color={theme.accent} />,
      route: "/(os)/settings/help",
      section: "Support",
    },
    {
      id: "bug-report",
      title: "Report a Bug",
      subtitle: "Submit issues",
      icon: <Bug size={22} color={theme.accent} />,
      route: "/(os)/settings/bug-report",
      section: "Support",
    },
    {
      id: "support",
      title: "Contact Support",
      subtitle: "Chat with support team",
      icon: <MessageSquare size={22} color={theme.accent} />,
      route: "/(os)/settings/support",
      section: "Support",
    },

    // ── Legal ──
    {
      id: "terms",
      title: "Terms of Service",
      subtitle: "User agreement",
      icon: <ScrollText size={22} color={theme.accent} />,
      route: "/(os)/settings/terms",
      section: "Legal",
    },
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      subtitle: "Data handling",
      icon: <FileText size={22} color={theme.accent} />,
      route: "/(os)/settings/privacy-policy",
      section: "Legal",
    },
    {
      id: "licenses",
      title: "Licenses",
      subtitle: "Open source licenses",
      icon: <FileCheck size={22} color={theme.accent} />,
      route: "/(os)/settings/licenses",
      section: "Legal",
    },
  ];

  // Group by section
  const sections = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, SettingsMenuItem[]>);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }]}>
        <Stack.Screen options={{ title: "Settings", headerShown: true }} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ title: "Settings", headerShown: true }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Profile Header ── */}
        <TouchableOpacity
          onPress={() => navigateTo("/(os)/settings/profile")}
          style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.profileAvatar}>
            <User size={32} color={theme.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {profile?.full_name || "Your Profile"}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>
              {profile?.email || "Tap to complete setup"}
            </Text>
            {profile?.reputation_score !== undefined && (
              <View style={styles.reputationBadge}>
                <Star size={12} color={theme.warning} />
                <Text style={[styles.reputationText, { color: theme.warning }]}>
                  {profile.reputation_score} rep
                </Text>
              </View>
            )}
          </View>
          <ChevronRight size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* ── Menu Sections ── */}
        {Object.entries(sections).map(([sectionName, items]) => (
          <View key={sectionName} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {sectionName.toUpperCase()}
            </Text>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigateTo(item.route)}
                  style={[
                    styles.menuRow,
                    index !== items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                    },
                  ]}>
                  <View style={styles.menuIcon}>{item.icon}</View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <View style={styles.menuRight}>
                    {item.badge && (
                      <View style={[styles.badge, { backgroundColor: theme.accentLight }]}>
                        <Text style={[styles.badgeText, { color: theme.accent }]}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                    <ChevronRight size={20} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign Out ── */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutButton, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LogOut size={20} color={theme.danger} />
          <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out</Text>
        </TouchableOpacity>

        {/* ── Version Footer ── */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            MTAA OS V10.0.0
          </Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Build 2026.05.11
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  reputationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  reputationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 36,
    alignItems: "center",
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 2,
  },
});
