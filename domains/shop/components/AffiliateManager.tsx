// components/shop/AffiliateManager.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Share } from "react-native";
import { AffiliateService } from "@/lib/shop/services/affiliateService";
import { AffiliateProgram, ShopAffiliate } from "@/lib/shop/types";

interface AffiliateManagerProps {
  shopId: string;
  isOwner: boolean;
}

export default function AffiliateManager({ shopId, isOwner }: AffiliateManagerProps) {
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [myAffiliates, setMyAffiliates] = useState<ShopAffiliate[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeView, setActiveView] = useState<"overview" | "program" | "my_links">("overview");
  const [programForm, setProgramForm] = useState({ commission_type: "percentage", commission_value: "10", min_payout: "100", cookie_days: "30" });

  useEffect(() => { loadData(); }, [shopId]);

  const loadData = async () => {
    try {
      const prog = await AffiliateService.getProgram(shopId);
      setProgram(prog);
      if (prog) setProgramForm({ commission_type: prog.commission_type, commission_value: prog.commission_value.toString(), min_payout: prog.min_payout_amount.toString(), cookie_days: prog.cookie_duration_days.toString() });
      const affiliates = await AffiliateService.getMyAffiliates();
      setMyAffiliates(affiliates.filter((a) => a.shop_id === shopId));
      const myAff = affiliates.find((a) => a.shop_id === shopId);
      if (myAff) {
        const s = await AffiliateService.getAffiliateStats(myAff.id);
        setStats(s);
      }
    } catch (e) { console.error(e); }
  };

  const setupProgram = async () => {
    try {
      const data = { shop_id: shopId, commission_type: programForm.commission_type as any, commission_value: parseFloat(programForm.commission_value), min_payout_amount: parseFloat(programForm.min_payout), cookie_duration_days: parseInt(programForm.cookie_days), is_active: true };
      if (program) await AffiliateService.updateProgram(shopId, data);
      else await AffiliateService.createProgram(data);
      Alert.alert("Success", "Affiliate program updated");
      loadData();
    } catch (e) { Alert.alert("Error", (e as Error).message); }
  };

  const joinProgram = async () => {
    try { await AffiliateService.joinAffiliateProgram(shopId); Alert.alert("Success", "You are now an affiliate!"); loadData(); }
    catch (e) { Alert.alert("Error", (e as Error).message); }
  };

  const shareLink = async (link: string) => { await Share.share({ message: `Shop with me on MTAA! ${link}`, url: link }); };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Affiliate Marketing</Text>
      <View style={styles.tabRow}>
        {(["overview", "program", "my_links"] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeView === tab && styles.tabActive]} onPress={() => setActiveView(tab)}>
            <Text style={[styles.tabText, activeView === tab && styles.tabTextActive]}>{tab === "my_links" ? "My Links" : tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeView === "overview" && (
        <View style={styles.section}>
          {!program?.is_active ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔗</Text>
              <Text style={styles.emptyTitle}>No Affiliate Program</Text>
              <Text style={styles.emptyDesc}>This shop has not set up affiliate marketing yet.</Text>
              {isOwner && <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveView("program")}><Text style={styles.primaryBtnText}>Setup Program</Text></TouchableOpacity>}
              {!isOwner && <TouchableOpacity style={styles.secondaryBtn} onPress={joinProgram}><Text style={styles.secondaryBtnText}>Join as Affiliate</Text></TouchableOpacity>}
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}><Text style={styles.statValue}>{stats?.total_clicks || 0}</Text><Text style={styles.statLabel}>Clicks</Text></View>
                <View style={styles.statBox}><Text style={styles.statValue}>{stats?.total_conversions || 0}</Text><Text style={styles.statLabel}>Sales</Text></View>
                <View style={styles.statBox}><Text style={styles.statValue}>R{stats?.total_earnings?.toFixed(2) || "0.00"}</Text><Text style={styles.statLabel}>Earned</Text></View>
                <View style={styles.statBox}><Text style={styles.statValue}>R{stats?.balance?.toFixed(2) || "0.00"}</Text><Text style={styles.statLabel}>Balance</Text></View>
              </View>
              {stats && (
                <View style={styles.conversionCard}>
                  <Text style={styles.conversionTitle}>Conversion Rate</Text>
                  <Text style={styles.conversionValue}>{stats.conversion_rate}%</Text>
                  <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(stats.conversion_rate, 100)}%` }]} /></View>
                </View>
              )}
              <TouchableOpacity style={styles.shareBtn} onPress={() => { const aff = myAffiliates.find((a) => a.shop_id === shopId); if (aff) shareLink(aff.referral_link || ""); }}>
                <Text style={styles.shareBtnText}>📤 Share Referral Link</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      {activeView === "program" && isOwner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Program Settings</Text>
          <Text style={styles.label}>Commission Type</Text>
          <View style={styles.typeRow}>
            {["percentage", "fixed", "tiered"].map((type) => (
              <TouchableOpacity key={type} style={[styles.typeChip, programForm.commission_type === type && styles.typeChipActive]} onPress={() => setProgramForm({ ...programForm, commission_type: type })}>
                <Text style={[styles.typeChipText, programForm.commission_type === type && styles.typeChipTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Commission Value {programForm.commission_type === "percentage" ? "(%)" : "(R)"}</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={programForm.commission_value} onChangeText={(t) => setProgramForm({ ...programForm, commission_value: t })} />
          <Text style={styles.label}>Minimum Payout (R)</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={programForm.min_payout} onChangeText={(t) => setProgramForm({ ...programForm, min_payout: t })} />
          <Text style={styles.label}>Cookie Duration (days)</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={programForm.cookie_days} onChangeText={(t) => setProgramForm({ ...programForm, cookie_days: t })} />
          <TouchableOpacity style={styles.saveBtn} onPress={setupProgram}>
            <Text style={styles.saveBtnText}>{program ? "Update Program" : "Create Program"}</Text>
          </TouchableOpacity>
        </View>
      )}
      {activeView === "my_links" && (
        <View style={styles.section}>
          {myAffiliates.filter((a) => a.shop_id === shopId).map((affiliate) => (
            <View key={affiliate.id} style={styles.linkCard}>
              <Text style={styles.linkLabel}>Your Referral Code</Text>
              <Text style={styles.linkCode}>{affiliate.referral_code}</Text>
              <Text style={styles.linkLabel}>Referral Link</Text>
              <Text style={styles.linkUrl} numberOfLines={1}>{affiliate.referral_link}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={() => shareLink(affiliate.referral_link || "")}>
                <Text style={styles.copyBtnText}>Share Link</Text>
              </TouchableOpacity>
            </View>
          ))}
          {myAffiliates.filter((a) => a.shop_id === shopId).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Not an Affiliate Yet</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={joinProgram}><Text style={styles.primaryBtnText}>Join Program</Text></TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { color: "#f8fafc", fontSize: 24, fontWeight: "700", padding: 20 },
  tabRow: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 16, gap: 8 },
  tab: { flex: 1, backgroundColor: "#1e293b", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#3b82f6" },
  tabText: { color: "#94a3b8", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  section: { padding: 16 },
  emptyState: { alignItems: "center", padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptyDesc: { color: "#64748b", textAlign: "center", marginBottom: 20 },
  primaryBtn: { backgroundColor: "#3b82f6", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { backgroundColor: "#1e293b", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#3b82f6" },
  secondaryBtnText: { color: "#3b82f6", fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statBox: { width: "47%", backgroundColor: "#1e293b", borderRadius: 12, padding: 16, alignItems: "center" },
  statValue: { color: "#f8fafc", fontSize: 22, fontWeight: "700" },
  statLabel: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  conversionCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 20, marginBottom: 20 },
  conversionTitle: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  conversionValue: { color: "#f59e0b", fontSize: 36, fontWeight: "700", marginVertical: 8 },
  progressBar: { height: 8, backgroundColor: "#334155", borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: "#22c55e", borderRadius: 4 },
  shareBtn: { backgroundColor: "#22c55e", padding: 16, borderRadius: 12, alignItems: "center" },
  shareBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionTitle: { color: "#94a3b8", fontSize: 14, fontWeight: "600", textTransform: "uppercase", marginBottom: 16 },
  label: { color: "#94a3b8", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#1e293b", color: "#f8fafc", padding: 14, borderRadius: 10, fontSize: 16 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typeChip: { flex: 1, backgroundColor: "#1e293b", padding: 12, borderRadius: 10, alignItems: "center" },
  typeChipActive: { backgroundColor: "#3b82f6" },
  typeChipText: { color: "#94a3b8" },
  typeChipTextActive: { color: "#fff" },
  saveBtn: { backgroundColor: "#3b82f6", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  linkCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 20, marginBottom: 12 },
  linkLabel: { color: "#94a3b8", fontSize: 12, marginBottom: 4 },
  linkCode: { color: "#f59e0b", fontSize: 20, fontWeight: "700", fontFamily: "monospace", marginBottom: 12 },
  linkUrl: { color: "#3b82f6", fontSize: 13, marginBottom: 12 },
  copyBtn: { backgroundColor: "#334155", padding: 12, borderRadius: 8, alignItems: "center" },
  copyBtnText: { color: "#f8fafc", fontWeight: "600" },
});
