// app/(os)/pulse/analytics.tsx
// MTAA Pulse — Analytics Dashboard

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions
} from "react-native";
import { pulseService } from "@/domains/pulse/services/pulseService";
import type { PulseAnalytics } from "@/domains/pulse/types";
import { TrendingUp, Users, Activity, DollarSign, BarChart3 } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function PulseAnalyticsScreen() {
  const [analytics, setAnalytics] = useState<PulseAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await pulseService.getAnalytics({ period: "daily", limit: 30 });
      setAnalytics(data);
    } catch (e: any) {
      console.error("Failed to load analytics:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const metrics = Array.from(new Set(analytics.map((a) => a.metric_name)));

  const getMetricIcon = (name: string) => {
    if (name.includes("user")) return Users;
    if (name.includes("revenue")) return DollarSign;
    if (name.includes("engagement")) return Activity;
    return BarChart3;
  };

  const getMetricColor = (name: string) => {
    if (name.includes("user")) return "#60A5FA";
    if (name.includes("revenue")) return "#34D399";
    if (name.includes("engagement")) return "#FF6B35";
    return "#A78BFA";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TrendingUp size={22} color="#A78BFA" />
        <Text style={styles.headerTitle}>Pulse Analytics</Text>
      </View>

      {loading && analytics.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            {metrics.slice(0, 4).map((metric) => {
              const latest = analytics.filter((a) => a.metric_name === metric).sort((a, b) => new Date(b.snapshot_at).getTime() - new Date(a.snapshot_at).getTime())[0];
              if (!latest) return null;
              const Icon = getMetricIcon(metric);
              const color = getMetricColor(metric);
              return (
                <View key={metric} style={[styles.summaryCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
                  <Icon size={20} color={color} />
                  <Text style={styles.summaryValue}>{latest.metric_value.toLocaleString()}</Text>
                  <Text style={styles.summaryLabel}>{metric.replace(/_/g, " ").toUpperCase()}</Text>
                </View>
              );
            })}
          </View>

          {/* Metric Sections */}
          {metrics.map((metric) => {
            const data = analytics.filter((a) => a.metric_name === metric).slice(0, 10);
            const Icon = getMetricIcon(metric);
            const color = getMetricColor(metric);
            return (
              <View key={metric} style={styles.metricSection}>
                <View style={styles.metricHeader}>
                  <Icon size={16} color={color} />
                  <Text style={styles.metricTitle}>{metric.replace(/_/g, " ").toUpperCase()}</Text>
                </View>
                <View style={styles.barChart}>
                  {data.map((d, i) => {
                    const max = Math.max(...data.map((x) => x.metric_value));
                    const height = max > 0 ? (d.metric_value / max) * 100 : 0;
                    return (
                      <View key={i} style={styles.barWrap}>
                        <View style={[styles.bar, { height: `${height}%`, backgroundColor: color }]} />
                        <Text style={styles.barLabel}>{new Date(d.snapshot_at).getDate()}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {analytics.length === 0 && (
            <View style={styles.empty}>
              <BarChart3 size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No analytics data yet</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 16 },
  summaryCard: {
    width: (width - 42) / 2,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16, padding: 16,
  },
  summaryValue: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 8 },
  summaryLabel: { color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "600", marginTop: 4, textTransform: "uppercase" },

  metricSection: { marginHorizontal: 16, marginBottom: 20 },
  metricHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  metricTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  barChart: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 120, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 12 },
  barWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "80%", borderRadius: 4, minHeight: 4 },
  barLabel: { color: "rgba(255,255,255,0.3)", fontSize: 9, marginTop: 4 },

  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 14, marginTop: 12 },
});
