// app/(os)/index.tsx — MTAA OS Home with Warrior Background
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useLauncher } from "@/lib/mtaa/appstore/launcher";
import { useIdentity } from "@/lib/auth/use-identity";
import { Ionicons } from "@expo/vector-icons";
import { getAppsBySection, AppManifest } from "@/lib/mtaa/appstore/unified-registry";

const { width } = Dimensions.get("window");
const COLS = 4;
const TILE = (width - 48) / COLS;

export default function OSHomeScreen() {
  const router = useRouter();
  const { launchApp } = useLauncher();
  const { user } = useIdentity();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const mtaaApps = getAppsBySection("mtaa");
  const androidApps = getAppsBySection("android");

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayName = days[currentDate.getDay()];
  const dayNum = currentDate.getDate();
  const monthName = months[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  const renderAppTile = (app: AppManifest) => (
    <TouchableOpacity
      key={app.id}
      style={styles.tile}
      onPress={() => launchApp(app.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: app.color }]}>
        <Ionicons name={app.icon as any} size={28} color="#fff" />
      </View>
      <Text style={styles.appName} numberOfLines={1}>
        {app.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Warrior Background Image */}
      <Image
        source={require("@/assets/images/mtaa_home.jpeg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Dark overlay for readability */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.appStoreBtn}
              onPress={() => router.push("/appstore" as any)}
            >
              <Ionicons name="apps" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Date Widget */}
          <View style={styles.dateWidget}>
            <Text style={styles.dayName}>{dayName.toUpperCase()}</Text>
            <Text style={styles.dayNumber}>{dayNum}</Text>
            <Text style={styles.monthYear}>{monthName} {year}</Text>
          </View>

          {/* MTAA Apps Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MTAA Apps</Text>
              <TouchableOpacity onPress={() => router.push("/appstore" as any)}>
                <Text style={styles.appStoreLink}>App Store →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {mtaaApps.map(renderAppTile)}
            </View>
          </View>

          {/* Android Apps Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Android Apps</Text>
            <View style={styles.grid}>
              {androidApps.map(renderAppTile)}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 20,
    paddingBottom: 12,
  },
  greeting: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "400",
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  appStoreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  dateWidget: {
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dayName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 3,
    marginBottom: 4,
  },
  dayNumber: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "200",
    lineHeight: 72,
  },
  monthYear: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "400",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  appStoreLink: {
    color: "#60A5FA",
    fontSize: 14,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tile: {
    width: TILE,
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    width: TILE - 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
