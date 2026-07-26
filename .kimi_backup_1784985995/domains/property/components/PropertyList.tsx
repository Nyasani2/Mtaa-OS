// MTAA PROPERTY OS — PROPERTY LIST COMPONENT

import React from "react";
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { PropertyCard } from "./PropertyCard";
import type { Property } from "../types";

interface PropertyListProps {
  properties: Property[];
  onPropertyPress: (property: Property) => void;
  onSaveProperty?: (propertyId: string) => void;
  savedPropertyIds?: string[];
  loading?: boolean;
  emptyMessage?: string;
  horizontal?: boolean;
}

export const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  onPropertyPress,
  onSaveProperty,
  savedPropertyIds = [],
  loading = false,
  emptyMessage = "No properties found",
  horizontal = false,
}) => {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a5c4b" />
      </View>
    );
  }

  if (properties.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={properties}
      keyExtractor={(item) => item.id}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <PropertyCard
          property={item}
          onPress={onPropertyPress}
          onSave={onSaveProperty}
          isSaved={savedPropertyIds.includes(item.id)}
          variant={horizontal ? "compact" : "full"}
        />
      )}
      contentContainerStyle={horizontal ? styles.horizontalList : styles.verticalList}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  verticalList: {
    padding: 16,
  },
});
