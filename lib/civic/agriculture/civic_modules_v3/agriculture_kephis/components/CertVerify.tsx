"use client";

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useAgriculture } from "../controllers/useAgriculture";
import { CertificateCard } from "./CertificateCard";
import { Search, X } from "lucide-react-native";

export function CertVerify() {
  const [query, setQuery] = useState("");
  const { searchCertificate, selectedItem, isLoading, error, setSelectedItem } = useAgriculture();

  const handleSearch = async () => {
    if (!query.trim()) return;
    await searchCertificate(query.trim());
  };

  const clearSearch = () => {
    setQuery("");
    setSelectedItem(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Crop Certificate</Text>
      <View style={styles.searchBox}>
        <Search size={20} color="#64748B" />
        <TextInput
          style={styles.input}
          placeholder="Enter certificate number"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
        onPress={handleSearch}
        disabled={isLoading || !query.trim()}
      >
        <Text style={styles.searchButtonText}>
          {isLoading ? "Verifying..." : "Verify Certificate"}
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {selectedItem && "certificate_number" in selectedItem && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Certificate Verified</Text>
          <CertificateCard certificate={selectedItem} />
        </View>
      )}

      {selectedItem === null && !isLoading && !error && query.length > 0 && (
        <View style={styles.noResultBox}>
          <Text style={styles.noResultText}>No certificate found with number {query}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: { flex: 1, fontSize: 16, color: "#1E293B" },
  searchButton: {
    backgroundColor: "#166534",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  searchButtonDisabled: { opacity: 0.5 },
  searchButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  errorBox: { marginTop: 12, padding: 12, backgroundColor: "#FEE2E2", borderRadius: 8 },
  errorText: { color: "#DC2626", fontSize: 14 },
  resultBox: { marginTop: 16 },
  resultTitle: { fontSize: 18, fontWeight: "700", color: "#059669", marginBottom: 12 },
  noResultBox: { marginTop: 16, padding: 20, alignItems: "center" },
  noResultText: { fontSize: 14, color: "#64748B" },
});
