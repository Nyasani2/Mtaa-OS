import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  forecast: { day: string; high: number; low: number; condition: string }[];
}

const CONDITIONS: Record<string, { icon: string; color: string }> = {
  sunny: { icon: "sunny", color: "#F59E0B" },
  cloudy: { icon: "cloudy", color: "#94A3B8" },
  rainy: { icon: "rainy", color: "#3B82F6" },
  stormy: { icon: "thunderstorm", color: "#6366F1" },
};

export default function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Nairobi");

  useEffect(() => {
    loadWeather(city);
  }, []);

  const loadWeather = async (cityName: string) => {
    setLoading(true);
    // Simulate API call — in production, use OpenWeatherMap or similar
    setTimeout(() => {
      const mockData: WeatherData = {
        city: cityName,
        temp: 24,
        condition: "sunny",
        humidity: 65,
        wind: 12,
        forecast: [
          { day: "Mon", high: 26, low: 18, condition: "sunny" },
          { day: "Tue", high: 25, low: 17, condition: "cloudy" },
          { day: "Wed", high: 23, low: 16, condition: "rainy" },
          { day: "Thu", high: 24, low: 17, condition: "sunny" },
          { day: "Fri", high: 27, low: 19, condition: "sunny" },
        ],
      };
      setWeather(mockData);
      setLoading(false);
    }, 800);
  };

  const handleSearch = () => {
    if (search.trim()) {
      setCity(search.trim());
      loadWeather(search.trim());
      setSearch("");
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({});
    // Reverse geocode would go here
    setCity("Current Location");
    loadWeather("Current Location");
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading weather...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weather</Text>
        <TouchableOpacity onPress={getLocation}>
          <Ionicons name="location-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search city..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Ionicons name="search" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {weather && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.currentCard}>
            <Text style={styles.cityName}>{weather.city}</Text>
            <View style={styles.tempRow}>
              <Ionicons name={CONDITIONS[weather.condition]?.icon as any || "sunny"} size={48} color={CONDITIONS[weather.condition]?.color || "#F59E0B"} />
              <Text style={styles.temp}>{weather.temp}°</Text>
            </View>
            <Text style={styles.condition}>{weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)}</Text>
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Ionicons name="water-outline" size={18} color="#3B82F6" />
                <Text style={styles.detailText}>{weather.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="speedometer-outline" size={18} color="#6366F1" />
                <Text style={styles.detailText}>{weather.wind} km/h</Text>
              </View>
            </View>
          </View>

          <Text style={styles.forecastTitle}>5-Day Forecast</Text>
          {weather.forecast.map((day, i) => (
            <View key={i} style={styles.forecastRow}>
              <Text style={styles.forecastDay}>{day.day}</Text>
              <Ionicons name={CONDITIONS[day.condition]?.icon as any || "sunny"} size={20} color={CONDITIONS[day.condition]?.color || "#F59E0B"} />
              <View style={styles.forecastTemps}>
                <Text style={styles.forecastHigh}>{day.high}°</Text>
                <Text style={styles.forecastLow}>{day.low}°</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  loadingText: { color: "#94A3B8", marginTop: 16, fontSize: 15 },
  searchWrap: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 15 },
  searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  currentCard: { backgroundColor: "#1a1a1a", marginHorizontal: 16, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16 },
  cityName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  tempRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  temp: { color: "#fff", fontSize: 56, fontWeight: "200" },
  condition: { color: "#94A3B8", fontSize: 16, marginTop: 8 },
  details: { flexDirection: "row", gap: 24, marginTop: 16 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { color: "#94A3B8", fontSize: 14 },
  forecastTitle: { color: "#64748B", fontSize: 14, fontWeight: "700", paddingHorizontal: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  forecastRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  forecastDay: { color: "#fff", fontSize: 15, width: 40 },
  forecastTemps: { flexDirection: "row", gap: 12 },
  forecastHigh: { color: "#fff", fontSize: 15, fontWeight: "600" },
  forecastLow: { color: "#64748B", fontSize: 15 },
});
