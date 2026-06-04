"use client";

import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useWalletTaxes } from "./hooks";
import { useWalletAccount } from "./hooks";
import { supabase } from "@/lib/supabase/client";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  Download,
} from "lucide-react-native";

export default function Tax() {
  const router = useRouter();
  const { account } = useWalletAccount();
  const { taxes, loading, refresh } = useWalletTaxes();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filing, setFiling] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account?.currency || "USD",
    }).format(amount);
  };

  const handleFileTax = async (taxId: string) => {
    setFiling(true);
    try {
      const { error } = await supabase
        .from("tax_records")
        .update({ status: "filed", filed_at: new Date().toISOString() })
        .eq("id", taxId);

      if (error) throw error;
      Alert.alert("Success", "Tax record filed successfully");
      refresh();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
    setFiling(false);
  };

  const handlePayTax = async (taxId: string, amount: number) => {
    Alert.alert(
      "Pay Tax",
      `Pay ${formatCurrency(amount)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay",
          onPress: async () => {
            const { error } = await supabase
              .from("tax_records")
              .update({ status: "paid", tax_paid: amount })
              .eq("id", taxId);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              Alert.alert("Success", "Tax payment recorded");
              refresh();
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return CheckCircle;
      case "filed": return FileText;
      case "overdue": return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "#10B981";
      case "filed": return "#3B82F6";
      case "overdue": return "#EF4444";
      default: return "#F59E0B";
    }
  };

  const yearTaxes = taxes.filter((t) => t.year === selectedYear);
  const totalIncome = yearTaxes.reduce((sum, t) => sum + t.total_income, 0);
  const totalTaxDue = yearTaxes.reduce((sum, t) => sum + t.tax_due, 0);
  const totalTaxPaid = yearTaxes.reduce((sum, t) => sum + t.tax_paid, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 24 }}>
          Tax Records
        </Text>

        {/* Year Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 24 }}
        >
          {[2024, 2025, 2026].map((year) => (
            <TouchableOpacity
              key={year}
              onPress={() => setSelectedYear(year)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: selectedYear === year ? "#3B82F6" : "#1E293B",
                borderRadius: 10,
                marginRight: 8,
                borderWidth: 1,
                borderColor: selectedYear === year ? "#3B82F6" : "#334155",
              }}
            >
              <Text
                style={{
                  color: selectedYear === year ? "#fff" : "#94A3B8",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary Cards */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <TrendingUp size={14} color="#10B981" />
              <Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Income</Text>
            </View>
            <Text style={{ color: "#10B981", fontSize: 18, fontWeight: "700" }}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <TrendingDown size={14} color="#EF4444" />
              <Text style={{ color: "#94A3B8", fontSize: 12 }}>Tax Due</Text>
            </View>
            <Text style={{ color: "#EF4444", fontSize: 18, fontWeight: "700" }}>
              {formatCurrency(totalTaxDue)}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <CheckCircle size={14} color="#3B82F6" />
              <Text style={{ color: "#94A3B8", fontSize: 12 }}>Paid</Text>
            </View>
            <Text style={{ color: "#3B82F6", fontSize: 18, fontWeight: "700" }}>
              {formatCurrency(totalTaxPaid)}
            </Text>
          </View>
        </View>

        {/* Quarterly Records */}
        <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 12 }}>
          Quarterly Breakdown
        </Text>

        {yearTaxes.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <FileText size={48} color="#334155" />
            <Text style={{ color: "#64748B", fontSize: 16, marginTop: 16 }}>
              No tax records for {selectedYear}
            </Text>
          </View>
        ) : (
          yearTaxes.map((tax) => {
            const StatusIcon = getStatusIcon(tax.status);
            const statusColor = getStatusColor(tax.status);
            return (
              <View
                key={tax.id}
                style={{
                  backgroundColor: "#1E293B",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: statusColor,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View>
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                      Q{tax.quarter} {tax.year}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Calendar size={12} color="#64748B" />
                      <Text style={{ color: "#64748B", fontSize: 12 }}>
                        {tax.filed_at ? `Filed ${new Date(tax.filed_at).toLocaleDateString()}` : "Not filed"}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: statusColor + "20",
                      borderRadius: 6,
                    }}
                  >
                    <StatusIcon size={12} color={statusColor} />
                    <Text
                      style={{
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      {tax.status}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 16, marginBottom: 12 }}>
                  <View>
                    <Text style={{ color: "#64748B", fontSize: 11 }}>Income</Text>
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                      {formatCurrency(tax.total_income)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "#64748B", fontSize: 11 }}>Taxable</Text>
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                      {formatCurrency(tax.taxable_amount)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "#64748B", fontSize: 11 }}>Due</Text>
                    <Text style={{ color: "#EF4444", fontSize: 14, fontWeight: "600" }}>
                      {formatCurrency(tax.tax_due)}
                    </Text>
                  </View>
                </View>

                {tax.status === "draft" && (
                  <TouchableOpacity
                    onPress={() => handleFileTax(tax.id)}
                    disabled={filing}
                    style={{
                      backgroundColor: filing ? "#1E40AF" : "#3B82F6",
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                      {filing ? "Filing..." : "File Tax Return"}
                    </Text>
                  </TouchableOpacity>
                )}

                {tax.status === "filed" && tax.tax_due > tax.tax_paid && (
                  <TouchableOpacity
                    onPress={() => handlePayTax(tax.id, tax.tax_due - tax.tax_paid)}
                    style={{
                      backgroundColor: "#10B981",
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                      Pay {formatCurrency(tax.tax_due - tax.tax_paid)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
