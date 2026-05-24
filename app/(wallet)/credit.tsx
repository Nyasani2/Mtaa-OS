"use client";

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";

import { useWalletStore } from "@/hooks/useWalletStore";
import { useWalletAccount } from "@/hooks/useWalletStore";
import { useWalletCredit } from "@/hooks/useWalletStore";

import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
} from "lucide-react-native";

export default function Credit() {
  const router = useRouter();

  const { account } = useWalletAccount();
  const { credit, refresh } = useWalletCredit();
  const { requestCredit } = useWalletStore();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const currency = account?.currency || "USD";

  const format = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(v);

  const submit = async () => {
    const value = parseFloat(amount);

    if (!value || value <= 0) {
      Alert.alert("Invalid Amount", "Enter a valid credit amount");
      return;
    }

    setLoading(true);

    const res = await requestCredit(value);

    setLoading(false);

    if (res?.success) {
      Alert.alert("Success", "Credit request submitted");
      setAmount("");
      setShowForm(false);
      refresh();
    } else {
      Alert.alert("Failed", res?.error || "Request failed");
    }
  };

  const statusColor = (s?: string) => {
    switch (s) {
      case "active":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "suspended":
        return "#EF4444";
      default:
        return "#64748B";
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Credit</Text>

        {/* CREDIT CARD */}
        {credit ? (
          <View style={styles.card}>
            <Text style={styles.label}>Limit</Text>
            <Text style={styles.amount}>{format(credit.limit)}</Text>

            <Text style={styles.label}>Used</Text>
            <Text style={styles.used}>{format(credit.used)}</Text>

            <View style={styles.bar}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(
                      100,
                      (credit.used / Math.max(credit.limit, 1)) * 100
                    )}%`,
                    backgroundColor:
                      credit.used / Math.max(credit.limit, 1) > 0.8
                        ? "#EF4444"
                        : "#3B82F6",
                  },
                ]}
              />
            </View>

            <Text style={[styles.status, { color: statusColor(credit.status) }]}>
              {credit.status}
            </Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <Shield size={40} color="#64748B" />
            <Text style={styles.emptyText}>No credit line</Text>
          </View>
        )}

        {/* FORM */}
        <View style={styles.section}>
          {!showForm ? (
            <TouchableOpacity
              style={styles.btn}
              onPress={() => setShowForm(true)}
            >
              <CreditCard color="#fff" />
              <Text style={styles.btnText}>Request Credit</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TextInput
                placeholder="Amount"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
              />

              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancel]}
                  onPress={() => setShowForm(false)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.primary]}
                  onPress={submit}
                  disabled={loading}
                >
                  <Text style={styles.btnText}>
                    {loading ? "Sending..." : "Submit"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { padding: 16 },

  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },

  label: { color: "#94A3B8", fontSize: 12 },
  amount: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  used: { color: "#CBD5E1", fontSize: 16 },

  bar: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 6,
    marginTop: 12,
    overflow: "hidden",
  },

  fill: { height: "100%" },

  status: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  empty: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
  },

  emptyText: { color: "#94A3B8", marginTop: 10 },

  section: { marginTop: 20 },

  input: {
    backgroundColor: "#1E293B",
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },

  row: { flexDirection: "row", gap: 10 },

  btn: {
    flex: 1,
    backgroundColor: "#3B82F6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  cancel: { backgroundColor: "#334155" },
  primary: { backgroundColor: "#2563EB" },

  btnText: { color: "#fff", fontWeight: "600" },
});
