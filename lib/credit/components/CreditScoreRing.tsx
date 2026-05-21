import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  score: number;
  tier: string;
}

export function CreditScoreRing({ score, tier }: Props) {
  const color = score >= 750 ? "#10B981" : score >= 600 ? "#F59E0B" : "#EF4444";
  return (
    <View style={styles.container}>
      <View style={[styles.ring, { borderColor: color }]}>
        <Text style={[styles.score, { color }]}>{score}</Text>
        <Text style={styles.tier}>{tier.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 20 },
  ring: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, justifyContent: "center", alignItems: "center" },
  score: { fontSize: 36, fontWeight: "bold" },
  tier: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
});
