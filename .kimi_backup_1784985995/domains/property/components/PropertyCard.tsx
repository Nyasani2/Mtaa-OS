// MTAA PROPERTY OS — PROPERTY CARD COMPONENT

import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Star, MapPin, Heart } from "lucide-react-native";
import type { Property } from "../types";

interface PropertyCardProps {
  property: Property;
  onPress: (property: Property) => void;
  onSave?: (propertyId: string) => void;
  isSaved?: boolean;
  variant?: "compact" | "full";
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onSave,
  isSaved = false,
  variant = "full",
}) => {
  const priceDisplay = property.listing_type === "short_stay"
    ? `KES ${property.price_per_night?.toLocaleString()}/night`
    : `KES ${property.price_per_month?.toLocaleString()}/mo`;

  if (variant === "compact") {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={() => onPress(property)}>
        <Image source={{ uri: property.cover_image }} style={styles.compactImage} />
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>{property.town}</Text>
          <Text style={styles.compactPrice}>{priceDisplay}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(property)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: property.cover_image }} style={styles.image} />
        {onSave && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => onSave(property.id)}
          >
            <Heart size={20} color={isSaved ? "#FF6B35" : "#fff"} fill={isSaved ? "#FF6B35" : "none"} />
          </TouchableOpacity>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{property.listing_type.replace("_", " ")}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <View style={styles.rating}>
            <Star size={14} color="#FFB800" fill="#FFB800" />
            <Text style={styles.ratingText}>{property.average_rating || "New"}</Text>
          </View>
        </View>

        <View style={styles.location}>
          <MapPin size={14} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {property.town}{property.county ? `, ${property.county}` : ""}
          </Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.detailText}>{property.bedrooms} bd</Text>
          <Text style={styles.detailDot}>•</Text>
          <Text style={styles.detailText}>{property.bathrooms} ba</Text>
          {property.furnished && (
            <>
              <Text style={styles.detailDot}>•</Text>
              <Text style={styles.detailText}>Furnished</Text>
            </>
          )}
        </View>

        <Text style={styles.price}>{priceDisplay}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 220,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  saveButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#1a5c4b",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  info: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 8,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: "#666",
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#444",
  },
  detailDot: {
    fontSize: 13,
    color: "#999",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a5c4b",
  },
  compactCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  compactImage: {
    width: "100%",
    height: 140,
  },
  compactInfo: {
    padding: 10,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  compactPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a5c4b",
  },
});
