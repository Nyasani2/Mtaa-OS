import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';

interface CityTime {
  id: string;
  city: string;
  timezone: string;
  offset: number;
}

const CITIES: CityTime[] = [
  { id: "1", city: "Nairobi", timezone: "Africa/Nairobi", offset: 0 },
  { id: "2", city: "London", timezone: "Europe/London", offset: -3 },
  { id: "3", city: "New York", timezone: "America/New_York", offset: -7 },
  { id: "4", city: "Tokyo", timezone: "Asia/Tokyo", offset: 6 },
  { id: "5", city: "Dubai", timezone: "Asia/Dubai", offset: 1 },
  { id: "6", city: "Sydney", timezone: "Australia/Sydney", offset: 7 },
  { id: "7", city: "Paris", timezone: "Europe/Paris", offset: -2 },
  { id: "8", city: "Mumbai", timezone: "Asia/Kolkata", offset: 2 },
];

export default function TimeScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCities, setSelectedCities] = useState<string[]>(["1", "2", "3"]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getCityTime = (offset: number) => {
    const utc = currentTime.getTime() + currentTime.getTimezoneOffset() * 60000;
    const target = new Date(utc + offset * 3600000);
    return target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const getCityDate = (offset: number) => {
    const utc = currentTime.getTime() + currentTime.getTimezoneOffset() * 60000;
    const target = new Date(utc + offset * 3600000);
    return target.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  };

  const toggleCity = (id: string) => {
    setSelectedCities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const formatLocalTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatLocalDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>World Time</Text>
        <TouchableOpacity onPress={() => setShowAll(!showAll)}>
          <Ionicons name={showAll ? "close" : "add"} size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <View style={styles.localCard}>
        <Text style={styles.localLabel}>Local Time</Text>
        <Text style={styles.localTime}>{formatLocalTime(currentTime)}</Text>
        <Text style={styles.localDate}>{formatLocalDate(currentTime)}</Text>
      </View>

      {showAll && (
        <View style={styles.addSection}>
          <Text style={styles.addTitle}>Add Cities</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityList}>
            {CITIES.map((city) => (
              <TouchableOpacity
                key={city.id}
                style={[styles.cityChip, selectedCities.includes(city.id) && styles.cityChipActive]}
                onPress={() => toggleCity(city.id)}
              >
                <Text style={[styles.cityChipText, selectedCities.includes(city.id) && styles.cityChipTextActive]}>
                  {city.city}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {selectedCities.map((id) => {
          const city = CITIES.find((c) => c.id === id);
          if (!city) return null;
          return (
            <View key={id} style={styles.cityCard}>
              <View style={styles.cityLeft}>
                <Text style={styles.cityName}>{city.city}</Text>
                <Text style={styles.cityDate}>{getCityDate(city.offset)}</Text>
                <Text style={styles.cityOffset}>{city.offset >= 0 ? `+${city.offset}` : city.offset} hrs</Text>
              </View>
              <Text style={styles.cityTime}>{getCityTime(city.offset)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  localCard: { backgroundColor: "#1a1a1a", marginHorizontal: 16, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16 },
  localLabel: { color: "#64748B", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  localTime: { color: "#fff", fontSize: 36, fontWeight: "200", marginTop: 8, fontVariant: ["tabular-nums"] },
  localDate: { color: "#94A3B8", fontSize: 14, marginTop: 4 },
  addSection: { marginBottom: 16 },
  addTitle: { color: "#64748B", fontSize: 12, fontWeight: "700", paddingHorizontal: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  cityList: { paddingHorizontal: 16 },
  cityChip: { backgroundColor: "#1a1a1a", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#334155" },
  cityChipActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  cityChipText: { color: "#94A3B8", fontSize: 14 },
  cityChipTextActive: { color: "#fff", fontWeight: "600" },
  cityCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  cityLeft: { flex: 1 },
  cityName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cityDate: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  cityOffset: { color: "#64748B", fontSize: 11, marginTop: 2 },
  cityTime: { color: "#fff", fontSize: 24, fontWeight: "300", fontVariant: ["tabular-nums"] },
});
