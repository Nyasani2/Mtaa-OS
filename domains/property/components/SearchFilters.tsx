// MTAA PROPERTY OS — SEARCH FILTERS COMPONENT

import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { X, SlidersHorizontal } from "lucide-react-native";
import type { PropertySearchFilters, PropertyType, ListingType } from "../types";

interface SearchFiltersProps {
  filters: PropertySearchFilters;
  onChange: (filters: PropertySearchFilters) => void;
  onApply: () => void;
  onClear: () => void;
}

const PROPERTY_TYPES: { label: string; value: PropertyType }[] = [
  { label: "Apartment", value: "apartment" },
  { label: "Studio", value: "studio" },
  { label: "Bedsitter", value: "bedsitter" },
  { label: "Villa", value: "villa" },
  { label: "Mansion", value: "mansion" },
  { label: "Hotel Room", value: "hotel_room" },
  { label: "Office", value: "commercial_office" },
  { label: "Shop", value: "shop" },
];

const LISTING_TYPES: { label: string; value: ListingType }[] = [
  { label: "Short Stay", value: "short_stay" },
  { label: "Long Term", value: "long_term" },
  { label: "Commercial", value: "commercial" },
  { label: "Hotel", value: "hotel" },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  onApply,
  onClear,
}) => {
  const toggleType = (type: PropertyType) => {
    onChange({ ...filters, property_type: filters.property_type === type ? undefined : type });
  };

  const toggleListingType = (type: ListingType) => {
    onChange({ ...filters, listing_type: filters.listing_type === type ? undefined : type });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        <TouchableOpacity onPress={onClear}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Listing Type */}
        <Text style={styles.sectionTitle}>Listing Type</Text>
        <View style={styles.chipRow}>
          {LISTING_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.chip,
                filters.listing_type === type.value && styles.chipActive,
              ]}
              onPress={() => toggleListingType(type.value)}
            >
              <Text style={[styles.chipText, filters.listing_type === type.value && styles.chipTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Property Type */}
        <Text style={styles.sectionTitle}>Property Type</Text>
        <View style={styles.chipRow}>
          {PROPERTY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.chip,
                filters.property_type === type.value && styles.chipActive,
              ]}
              onPress={() => toggleType(type.value)}
            >
              <Text style={[styles.chipText, filters.property_type === type.value && styles.chipTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price Range */}
        <Text style={styles.sectionTitle}>Price Range (KES)</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceInput}>
            <Text style={styles.priceLabel}>Min</Text>
            <Text style={styles.priceValue}>{filters.min_price?.toLocaleString() || "Any"}</Text>
          </View>
          <Text style={styles.priceDivider}>-</Text>
          <View style={styles.priceInput}>
            <Text style={styles.priceLabel}>Max</Text>
            <Text style={styles.priceValue}>{filters.max_price?.toLocaleString() || "Any"}</Text>
          </View>
        </View>

        {/* Bedrooms */}
        <Text style={styles.sectionTitle}>Bedrooms</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.chip, filters.bedrooms === num && styles.chipActive]}
              onPress={() => onChange({ ...filters, bedrooms: filters.bedrooms === num ? undefined : num })}
            >
              <Text style={[styles.chipText, filters.bedrooms === num && styles.chipTextActive]}>
                {num}+
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.applyButton} onPress={onApply}>
        <SlidersHorizontal size={18} color="#fff" />
        <Text style={styles.applyText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  clearText: {
    fontSize: 14,
    color: "#1a5c4b",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chipActive: {
    backgroundColor: "#1a5c4b",
    borderColor: "#1a5c4b",
  },
  chipText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  priceDivider: {
    fontSize: 18,
    color: "#888",
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1a5c4b",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  applyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
