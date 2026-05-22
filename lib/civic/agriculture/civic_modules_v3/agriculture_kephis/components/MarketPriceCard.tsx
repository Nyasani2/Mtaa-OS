"use client";

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MarketPrice } from "../types";
import { TrendingUp, TrendingDown, Minus, MapPin, Calendar } from "lucide-react-native";

interface Props {
  price: MarketPrice;
}

export function MarketPriceCard({ price }: Props) {
  const TrendIcon = price.trend === "up" ? TrendingUp : price.trend === "down" ? TrendingDown : Minus;
  const trendColor = price.trend === "up" ? "#059669" : price.trend === "down" ? "#DC2626" : "#64748B";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.commodity}>{price.commodity}</Text>
          {price.variety && <Text style={styles.variety}>{price.variety}</Text>}
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>{price.currency} {price.price_per_kg.toLocaleString()}</Text>
          <Text style={styles.perUnit}>/ kg</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.detailText}>{price.market}, {price.county}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color="#64748B" />
          <Text style={styles.detailText}>{new Date(price.date_recorded).toLocaleDateString()}</Text>
        </View>
        <View style={styles.trendRow}>
          <TrendIcon size={16} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {price.trend === "up" ? "Rising" : price.trend === "down" ? "Falling" : "Stable"}
          </Text>
          {price.volume_traded && (
            <Text style={styles.volumeText}>Vol: {price.volume_traded.toLocaleString()} kg</Text>
          )}
        </View>
        {price.quality_grade && (
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>Grade {price.quality_grade}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  headerText: { flex: 1 },
  commodity: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  variety: { fontSize: 13, color: "#64748B", marginTop: 2 },
  priceBox: { alignItems: "flex-end" },
  priceText: { fontSize: 18, fontWeight: "700", color: "#059669" },
  perUnit: { fontSize: 12, color: "#64748B" },
  details: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#64748B" },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  trendText: { fontSize: 13, fontWeight: "600" },
  volumeText: { fontSize: 12, color: "#64748B", marginLeft: "auto" },
  gradeBadge: { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "#F1F5F9", borderRadius: 6 },
  gradeText: { fontSize: 11, color: "#475569", fontWeight: "600" },
});
