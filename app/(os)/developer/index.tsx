import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIdentity } from "@/lib/auth/identity";
import { supabase } from "@/lib/supabase";

// ============================================
// DEVELOPER PORTAL — Upload apps for AI review
// $15 submission fee
// ============================================

export default function DeveloperPortalScreen() {
  const router = useRouter();
  const { user } = useIdentity();

  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("");
  const [appDesc, setAppDesc] = useState("");
  const [appCategory, setAppCategory] = useState("");
  const [appVersion, setAppVersion] = useState("1.0.0");

  const [reviewStatus, setReviewStatus] = useState<
    "idle" | "submitting" | "reviewing" | "approved" | "rejected"
  >("idle");

  const [reviewNotes, setReviewNotes] = useState("");

  const categories = [
    "transport", "health", "finance", "commerce", "social",
    "work", "education", "government", "productivity", "media",
    "communication", "utility", "business", "entertainment"
  ];

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to submit an app.");
      return;
    }

    if (!appName || !appDesc || !appCategory) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setReviewStatus("submitting");

    try {
      // FIX: Use .maybeSingle() to avoid crash on missing wallet
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletError) {
        Alert.alert("Wallet Error", walletError.message);
        setReviewStatus("idle");
        return;
      }

      if (!wallet || wallet.balance < 15) {
        Alert.alert("Insufficient Funds", "You need $15 to submit an app. Please top up your wallet.");
        setReviewStatus("idle");
        return;
      }

      // FIX: Handle RPC error gracefully
      const { error: deductError } = await supabase.rpc("deduct_balance", {
        p_user_id: user.id,
        p_amount: 15,
      });

      if (deductError) {
        Alert.alert("Payment Failed", deductError.message);
        setReviewStatus("idle");
        return;
      }

      // Create submission
      const { data: submission, error: submitError } = await supabase
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

      if (submitError) {
        Alert.alert("Submission Error", submitError.message);
        setReviewStatus("idle");
        return;
      }

      setReviewStatus("reviewing");

      // AI Review simulation
      setTimeout(async () => {
        const passed =
          appName.length >= 3 &&
          appDesc.length >= 20 &&
          !appDesc.includes("spam") &&
          !appDesc.includes("scam") &&
          appCategory !== "";

        if (passed) {
          setReviewStatus("approved");
          setReviewNotes(
            "✅ App approved\n✅ Policy check passed\n✅ Ready for store"
          );

          // FIX: Await the insert + handle error
          const { error: publishError } = await supabase
            .from("app_store_apps")
            .insert({
              name: appName,
              description: appDesc,
              category: appCategory,
              version: appVersion,
              developer_id: user.id,
              status: "published",
              submission_id: submission.id,
            });

          if (publishError) {
            console.error("[DeveloperPortal] Publish failed:", publishError);
            setReviewNotes(
              "✅ App approved but publishing failed. Please contact support."
            );
          }
        } else {
          setReviewStatus("rejected");
          setReviewNotes("❌ Failed policy checks. Please revise and resubmit.");
        }
      }, 2500);
    } catch (err: any) {
      console.error("[DeveloperPortal] Submit error:", err);
      Alert.alert("Error", err.message || "Something went wrong. Please try again.");
      setReviewStatus("idle");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Developer Portal</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {step === 1 && (
          <>
            <Text style={styles.label}>App Name *</Text>
            <TextInput
              style={styles.input}
              value={appName}
              onChangeText={setAppName}
              placeholder="My Awesome App"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={appDesc}
              onChangeText={setAppDesc}
              placeholder="What does your app do? (min 20 chars)"
              placeholderTextColor="#64748B"
              multiline
            />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.catGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catBtn,
                    appCategory === cat && styles.catBtnActive,
                  ]}
                  onPress={() => setAppCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catBtnText,
                      appCategory === cat && styles.catBtnTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Version</Text>
            <TextInput
              style={styles.input}
              value={appVersion}
              onChangeText={setAppVersion}
              placeholder="1.0.0"
              placeholderTextColor="#64748B"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={() => setStep(2)}>
              <Text style={styles.submitText}>Continue to Review</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
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
                <Text style={styles.aiText}>
                  <Ionicons name="sparkles" size={16} color="#6366F1" /> AI will review your app
                </Text>
                <TouchableOpacity style={styles.payBtn} onPress={handleSubmit}>
                  <Text style={styles.payText}>Pay $15 & Submit</Text>
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
                <Text style={styles.statusText}>AI reviewing...</Text>
              </View>
            )}

            {(reviewStatus === "approved" || reviewStatus === "rejected") && (
              <View
                style={[
                  styles.resultBox,
                  reviewStatus === "approved" ? styles.approvedBox : styles.rejectedBox,
                ]}
              >
                <Ionicons
                  name={reviewStatus === "approved" ? "checkmark-circle" : "close-circle"}
                  size={48}
                  color={reviewStatus === "approved" ? "#10B981" : "#EF4444"}
                />
                <Text style={styles.resultTitle}>
                  {reviewStatus === "approved" ? "Approved" : "Rejected"}
                </Text>
                <Text style={styles.resultNotes}>{reviewNotes}</Text>
                {reviewStatus === "rejected" && (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                      setReviewStatus("idle");
                      setStep(1);
                    }}
                  >
                    <Text style={styles.retryText}>Edit & Resubmit</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
  },
  title: { fontSize: 20, fontWeight: "bold", color: "white" },
  content: { padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: "bold", color: "white", marginBottom: 20 },
  label: { color: "#94A3B8", marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    color: "white",
  },
  textArea: { height: 100 },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  catBtn: {
    backgroundColor: "#1E293B",
    padding: 10,
    borderRadius: 20,
  },
  catBtnActive: { backgroundColor: "#6366F1" },
  catBtnText: { color: "#94A3B8" },
  catBtnTextActive: { color: "white" },
  submitBtn: {
    backgroundColor: "#6366F1",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  submitText: { color: "white", fontWeight: "bold" },
  reviewCard: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  reviewLabel: { color: "#64748B", marginTop: 10 },
  reviewValue: { color: "white", fontSize: 16 },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 16,
  },
  feeLabel: { color: "white", fontSize: 16, fontWeight: "600" },
  feeValue: { color: "#6366F1", fontSize: 16, fontWeight: "bold" },
  aiText: { color: "#94A3B8", marginBottom: 12 },
  payBtn: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  payText: { color: "white", fontWeight: "bold", fontSize: 16 },
  statusBox: { alignItems: "center", padding: 20 },
  statusText: { color: "white", marginTop: 10 },
  resultBox: { alignItems: "center", padding: 20, borderRadius: 16 },
  approvedBox: { backgroundColor: "#10B98120" },
  rejectedBox: { backgroundColor: "#EF444420" },
  resultTitle: { color: "white", fontSize: 18, marginTop: 10, fontWeight: "bold" },
  resultNotes: { color: "#94A3B8", textAlign: "center", marginTop: 8 },
  retryBtn: { marginTop: 12, backgroundColor: "#6366F1", padding: 12, borderRadius: 8 },
  retryText: { color: "white" },
});
