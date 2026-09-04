"use client";

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CBKDashboard from "./CBKDashboard";
import FraudDashboard from "./FraudDashboard";
import AuditDashboard from "./AuditDashboard";
import ComplianceDashboard from "./ComplianceDashboard";

type Tab = "cbk" | "fraud" | "audit" | "compliance";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "cbk", label: "CBK", icon: "🏛️" },
  { id: "fraud", label: "Fraud", icon: "🛡️" },
  { id: "audit", label: "Audit", icon: "📋" },
  { id: "compliance", label: "Compliance", icon: "⚖️" },
];

export default function RegulatoryShell() {
  const [activeTab, setActiveTab] = useState<Tab>("cbk");

  return (
    <View style={s.container}>
      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[s.tab, activeTab === tab.id && s.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabLabel, activeTab === tab.id && s.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.content}>
        {activeTab === "cbk" && <CBKDashboard />}
        {activeTab === "fraud" && <FraudDashboard />}
        {activeTab === "audit" && <AuditDashboard />}
        {activeTab === "compliance" && <ComplianceDashboard />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#2563eb",
    backgroundColor: "#1e293b",
  },
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },
  tabLabelActive: { color: "#2563eb", fontWeight: "700" },
  content: { flex: 1 },
});
