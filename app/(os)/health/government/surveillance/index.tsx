import React, { useState, useCallback } from "react";
import { Alert,
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, TextInput, Alert,
} from "react-native";
import { Alert, useRouter, useLocalSearchParams } from "expo-router";
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import { Alert, Ionicons } from "@expo/vector-icons";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, useGovernment } from "@/lib/health/hooks/useGovernment";

export default function SurveillanceScreen() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams();
  const user = useAuthStore((s) => s.user);
  const { alerts, outbreaks, loading, error, refreshing, refresh, createOutbreak, dismissAlert } = useGovernment(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", location: "" });

  const handleSubmit = useCallback(async () => {
    if (!form.title || !form.description) { Alert.alert("Error", "Title and description required"); return; }
    const result = await createOutbreak(form);
    if (result.success) { setShowForm(false); setForm({ title: "", description: "", severity: "medium", location: "" }); }
    else { Alert.alert("Error", result.error || "Failed"); }
  }, [form, createOutbreak]);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={s.headerTitle}>Surveillance</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)} style={s.headerAction}>
          <Ionicons name={showForm ? "close" : "add"} size={22} color="#fff"/>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={s.form}>
          <TextInput style={s.input} placeholder="Outbreak title" placeholderTextColor="#94a3b8" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
          <TextInput style={[s.input, s.textArea]} placeholder="Description" placeholderTextColor="#94a3b8" multiline numberOfLines={3} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
          <TextInput style={s.input} placeholder="Location" placeholderTextColor="#94a3b8" value={form.location} onChangeText={(t) => setForm({ ...form, location: t })} />
          <View style={s.severityRow}>
            {(["low", "medium", "high", "critical"] as const).map((sev) => (
              <TouchableOpacity key={sev} style={[s.severityBtn, form.severity === sev && s.severityBtnActive]} onPress={() => setForm({ ...form, severity: sev })}>
                <Text style={[s.severityText, form.severity === sev && s.severityTextActive]}>{sev}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}><Text style={s.submitText}>Report Outbreak</Text></TouchableOpacity>
        </View>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}/>} contentContainerStyle={s.scrollContent}>
        {loading && !refreshing ? (
          <View style={s.center}><ActivityIndicator size="large" color="#2563eb"/><Text style={s.loadingText}>Loading...</Text></View>
        ) : error ? (
          <View style={s.center}><Ionicons name="alert-circle" size={48} color="#ef4444"/><Text style={s.errorText}>{error}</Text><TouchableOpacity style={s.retryBtn} onPress={refresh}><Text style={s.retryText}>Retry</Text></TouchableOpacity></View>
        ) : (
          <>
            <Text style={s.sectionTitle}>Active Outbreaks</Text>
            {outbreaks.length === 0 ? (
              <View style={s.emptyCard}><Ionicons name="shield-checkmark" size={40} color="#059669"/><Text style={s.emptyText}>No active outbreaks</Text></View>
            ) : outbreaks.map((o) => (
              <View key={o.id} style={s.outbreakCard}>
                <View style={[s.outbreakSeverity, { backgroundColor: getSeverityColor(o.severity) }]} />
                <View style={s.outbreakContent}>
                  <Text style={s.outbreakTitle}>{o.title}</Text>
                  <Text style={s.outbreakDesc}>{o.description}</Text>
                  <Text style={s.outbreakMeta}>{o.location} · {o.cases || 0} cases · {formatDate(o.created_at)}</Text>
                </View>
              </View>
            ))}

            <Text style={s.sectionTitle}>Alerts</Text>
            {alerts.length === 0 ? (
              <View style={s.emptyCard}><Ionicons name="notifications-off" size={40} color="#94a3b8"/><Text style={s.emptyText}>No alerts</Text></View>
            ) : alerts.map((a) => (
              <TouchableOpacity key={a.id} style={s.alertCard} onPress={() => Alert.alert(a.title, a.description, [{ text: "Dismiss", onPress: () => dismissAlert(a.id) }, { text: "OK" }])}>
                <View style={[s.alertSeverity, { backgroundColor: getSeverityColor(a.severity) }]} />
                <View style={s.alertContent}>
                  <Text style={s.alertTitle}>{a.title}</Text>
                  <Text style={s.alertDesc} numberOfLines={2}>{a.description}</Text>
                  <Text style={s.alertMeta}>{a.location} · {formatDate(a.created_at)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#dc2626";
    case "high": return "#ea580c";
    case "medium": return "#f59e0b";
    default: return "#2563eb";
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#0f3d5e", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: "row", alignItems: "center" },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", flex: 1 },
  headerAction: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  form: { backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 12, fontSize: 14, color: "#1e293b", marginBottom: 10, backgroundColor: "#f8fafc" },
  textArea: { height: 80, textAlignVertical: "top" },
  severityRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  severityBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: "#f1f5f9" },
  severityBtnActive: { backgroundColor: "#0f3d5e" },
  severityText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  severityTextActive: { color: "#fff" },
  submitBtn: { backgroundColor: "#0f3d5e", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, color: "#64748b" },
  errorText: { marginTop: 12, fontSize: 15, color: "#ef4444", textAlign: "center" },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#0f3d5e", borderRadius: 10 },
  retryText: { color: "#fff", fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 12, marginTop: 8 },
  emptyCard: { backgroundColor: "#fff", borderRadius: 14, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 16 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
  outbreakCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  outbreakSeverity: { width: 4, height: 60, borderRadius: 2, marginRight: 12 },
  outbreakContent: { flex: 1 },
  outbreakTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  outbreakDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  outbreakMeta: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  alertCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  alertSeverity: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  alertDesc: { fontSize: 12, color: "#64748b", marginTop: 2 },
  alertMeta: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
});
