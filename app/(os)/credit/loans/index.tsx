import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useCreditStore } from "@/lib/credit/hooks/use-credit-store";
import { LoanCard } from "@/lib/credit/components/LoanCard";

export default function LoansScreen() {
  const { loans } = useCreditStore();
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Loans</Text>
      {loans.map((loan) => <LoanCard key={loan.id} loan={loan} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
});
