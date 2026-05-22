import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/stores/auth-store";
import { supabase } from "@/lib/supabase";

// ============================================
// DEVELOPER PORTAL — Upload apps for AI review
// $15 submission fee
// ============================================

export default function DeveloperPortalScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("");
  const [appDesc, setAppDesc] = useState("");
  const [appCategory, setAppCategory] = useState("");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [reviewStatus, setReviewStatus] = useState<"idle" | "submitting" | "reviewing" | "approved" | "rejected">("idle");
  const [reviewNotes, setReviewNotes] = useState("");

  const categories = [
    "transport", "health", "finance", "commerce", "social",
    "work", "education", "government", "productivity", "media",
    "communication", "utility", "business", "entertainment"
  ];

  const handleSubmit = async () => {
    if (!user) { Alert.alert("Sign In Required"); return; }
    if (!appName || !appDesc || !appCategory) { Alert.alert("Fill all fields"); return; }

    setReviewStatus("submitting");

    // Simulate $15 payment check
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!wallet || wallet.balance < 15) {
      Alert.alert("Insufficient Funds", "You need $15 to submit an app.");
      setReviewStatus("idle");
      return;
    }

    // Deduct $15
    await supabase.rpc("deduct_balance", { p_user_id: user.id, p_amount: 15 });

    // Create submission
    const { data: submission, error } = await supabase
      .from("app_submissions")
      .insert({
        developer_id: user.id,
        app_name: appName,
        description: appDesc,
        category: appCategory,
        version: appVersion,
        status: "pending_review",
        fee_paid: 15,
      })
      .select()
      .single();

    if (error) {
      Alert.alert("Error", error.message);
      setReviewStatus("idle");
      return;
    }

    // AI Review simulation
    setReviewStatus("reviewing");
    setTimeout(() => {
      // AI checks
      const checks = [
        appName.length >= 3,
        appDesc.length >= 20,
        !appDesc.includes("spam"),
        !appDesc.includes("scam"),
        appCategory !== "",
      ];

      const passed = checks.every(c => c);

      if (passed) {
        setReviewStatus("approved");
        setReviewNotes("✅ App name is descriptive\n✅ Description is detailed\n✅ No policy violations detected\n✅ Category is valid\n\nYour app has been approved for the AppStore.");

        // Auto-publish to app_store_apps
        supabase.from("app_store_apps").insert({
          name: appName,
          description: appDesc,
          category: appCategory,
          version: appVersion,
          developer_id: user.id,
          status: "published",
          submission_id: submission.id,
        });
      } else {
        setReviewStatus("rejected");
        setReviewNotes("❌ Issues found:\n- Description too short or contains prohibited terms\n- Please revise and resubmit ($15 fee applies).");
      }
    }, 3000);
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>App Details</Text>
      <Text style={styles.label}>App Name</Text>
      <TextInput style={styles.input} value={appName} onChangeText={setAppName} placeholder="My Awesome App" placeholderTextColor="#64748B" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={appDesc} onChangeText={setAppDesc} placeholder="What does your app do?" placeholderTextColor="#64748B" multiline numberOfLines={4} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.catGrid}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, appCategory === cat && styles.catBtnActive]}
            onPress={() => setAppCategory(cat)}
          >
            <Text style={[styles.catBtnText, appCategory === cat && styles.catBtnTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Version</Text>
      <TextInput style={styles.input} value={appVersion} onChangeText={setAppVersion} placeholder="1.0.0" placeholderTextColor="#64748B" />

      <TouchableOpacity style={styles.submitBtn} onPress={() => setStep(2)}>
        <Text style={styles.submitText}>Continue to Review</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Review & Pay</Text>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewLabel}>App Name</Text>
        <Text style={styles.reviewValue}>{appName}</Text>
        <Text style={styles.reviewLabel}>Category</Text>
        <Text style={styles.reviewValue}>{appCategory}</Text>
        <Text style={styles.reviewLabel}>Version</Text>
        <Text style={styles.reviewValue}>{appVersion}</Text>
        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Submission Fee</Text>
          <Text style={styles.feeValue}>$15.00</Text>
        </View>
      </View>

      {reviewStatus === "idle" && (
        <>
          <Text style={styles.aiText}><Ionicons name="sparkles" size={16} color="#6366F1" /> AI will review your app for policy compliance</Text>
          <TouchableOpacity style={styles.payBtn} onPress={handleSubmit}>
            <Text style={styles.payText}>Pay $15 & Submit for Review</Text>
          </TouchableOpacity>
        </>
      )}

      {reviewStatus === "submitting" && (
        <View style={styles.statusBox}>
          <ActivityIndicator color="#6366F1" />
          <Text style={styles.statusText}>Processing payment...</Text>
        </View>
      )}

      {reviewStatus === "reviewing" && (
        <View style={styles.statusBox}>
          <ActivityIndicator color="#6366F1" />
          <Text style={styles.statusText}>AI is reviewing your app...</Text>
          <Text style={styles.statusSub}>Checking name, description, category, policy compliance</Text>
        </View>
      )}

      {(reviewStatus === "approved" || reviewStatus === "rejected") && (
        <View style={[styles.resultBox, reviewStatus === "approved" ? styles.approvedBox : styles.rejectedBox]}>
          <Ionicons name={reviewStatus === "approved" ? "checkmark-circle" : "close-circle"} size={48} color={reviewStatus === "approved" ? "#10B981" : "#EF4444"} />
          <Text style={styles.resultTitle}>{reviewStatus === "approved" ? "Approved!" : "Rejected"}</Text>
          <Text style={styles.resultNotes}>{reviewNotes}</Text>
          {reviewStatus === "rejected" && (
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setReviewStatus("idle"); setStep(1); }}>
              <Text style={styles.retryText}>Edit & Resubmit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Developer Portal</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
      </View>

      <View style={styles.content}>
        {step === 1 ? renderStep1() : renderStep2()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#334155' },
  stepDotActive: { backgroundColor: '#6366F1' },
  stepLine: { width: 40, height: 2, backgroundColor: '#334155', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#6366F1' },
  content: { padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  label: { color: '#94A3B8', fontSize: 14, marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#1E293B', borderRadius: 12, padding: 14, color: 'white', fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { backgroundColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  catBtnActive: { backgroundColor: '#6366F1' },
  catBtnText: { color: '#94A3B8', fontSize: 12 },
  catBtnTextActive: { color: 'white', fontWeight: '600' },
  submitBtn: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  reviewCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 20 },
  reviewLabel: { color: '#64748B', fontSize: 12, marginTop: 12 },
  reviewValue: { color: 'white', fontSize: 16, fontWeight: '600', marginTop: 2 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#334155' },
  feeLabel: { color: 'white', fontSize: 16, fontWeight: '600' },
  feeValue: { color: '#6366F1', fontSize: 18, fontWeight: 'bold' },
  aiText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  payBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center' },
  payText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  statusBox: { alignItems: 'center', padding: 20 },
  statusText: { color: 'white', fontSize: 16, marginTop: 12 },
  statusSub: { color: '#64748B', fontSize: 12, marginTop: 4, textAlign: 'center' },
  resultBox: { alignItems: 'center', padding: 24, borderRadius: 16, marginTop: 16 },
  approvedBox: { backgroundColor: '#10B98120' },
  rejectedBox: { backgroundColor: '#EF444420' },
  resultTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginTop: 12 },
  resultNotes: { color: '#94A3B8', fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryBtn: { backgroundColor: '#6366F1', padding: 14, borderRadius: 12, marginTop: 16 },
  retryText: { color: 'white', fontWeight: 'bold' },
});
