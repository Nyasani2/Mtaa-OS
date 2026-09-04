import React, { useState, useEffect, useCallback } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Alert, Ionicons } from "@expo/vector-icons";

// OpenWeatherMap API — free tier: 1000 calls/day
// User must add OPENWEATHER_API_KEY to environment
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';
const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  forecast: { day: string; high: number; low: number; condition: string }[];
}

const CONDITIONS: Record<string, { icon: string; color: string }> = {
  Clear: { icon: "sunny", color: "#F59E0B" },
  Clouds: { icon: "cloudy", color: "#94A3B8" },
  Rain: { icon: "rainy", color: "#3B82F6" },
  Drizzle: { icon: "rainy", color: "#3B82F6" },
  Thunderstorm: { icon: "thunderstorm", color: "#6366F1" },
  Snow: { icon: "snow", color: "#60A5FA" },
  Mist: { icon: "cloudy", color: "#94A3B8" },
  Fog: { icon: "cloudy", color: "#94A3B8" },
};

function mapCondition(apiCondition: string): string {
  return CONDITIONS[apiCondition]?.icon || "sunny";
}

function mapConditionColor(apiCondition: string): string {
  return CONDITIONS[apiCondition]?.color || "#F59E0B";
}

export default function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Nairobi");
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (cityName: string) => {
    setLoading(true);
    setError(null);

    try {
      if (!OPENWEATHER_API_KEY) {
        throw new Error('OpenWeatherMap API key not configured. Add EXPO_PUBLIC_OPENWEATHER_API_KEY to your environment.');
      }

      // Current weather
      const currentRes = await fetch(
        `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(cityName)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!currentRes.ok) {
        if (currentRes.status === 404) {
          throw new Error(`City "${cityName}" not found`);
        }
        throw new Error(`Weather API error: ${currentRes.status}`);
      }

      const currentData = await currentRes.json();

      // 5-day forecast
      const forecastRes = await fetch(
        `${OPENWEATHER_BASE}/forecast?q=${encodeURIComponent(cityName)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      let forecastData: any = null;
      if (forecastRes.ok) {
        forecastData = await forecastRes.json();
      }

      // Parse forecast — group by day, take max/min
      const dailyForecast: Record<string, { high: number; low: number; condition: string }> = {};

      if (forecastData?.list) {
        forecastData.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

          if (!dailyForecast[dayName]) {
            dailyForecast[dayName] = { high: item.main.temp_max, low: item.main.temp_min, condition: item.weather[0]?.main || 'Clear' };
          } else {
            dailyForecast[dayName].high = Math.max(dailyForecast[dayName].high, item.main.temp_max);
            dailyForecast[dayName].low = Math.min(dailyForecast[dayName].low, item.main.temp_min);
          }
        });
      }

      // Build forecast array (next 5 days, skip today)
      const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
      const forecast = Object.entries(dailyForecast)
        .filter(([day]) => day !== today)
        .slice(0, 5)
        .map(([day, data]) => ({
          day,
          high: Math.round(data.high),
          low: Math.round(data.low),
          condition: mapCondition(data.condition),
        }));

      setWeather({
        city: currentData.name,
        temp: Math.round(currentData.main.temp),
        condition: mapCondition(currentData.weather[0]?.main || 'Clear'),
        humidity: currentData.main.humidity,
        wind: Math.round(currentData.wind.speed * 3.6), // m/s to km/h
        forecast,
      });
    } catch (err: any) {
      console.error('[Weather] Fetch error:', err);
      setError(err.message || 'Failed to load weather data');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(city);
  }, [fetchWeather, city]);

  const handleSearch = () => {
    if (search.trim()) {
      setCity(search.trim());
      setSearch("");
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert('Permission Denied', 'Location permission is required for local weather.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      // Reverse geocode using OpenWeatherMap
      if (OPENWEATHER_API_KEY) {
        const res = await fetch(
          `${OPENWEATHER_BASE}/weather?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );

        if (res.ok) {
          const data = await res.json();
          setCity(data.name);
        }
      }
    } catch (err: any) {
      console.error('[Weather] Location error:', err);
      Alert.alert('Location Error', err.message || 'Could not get your location');
    }
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

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={18} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {weather && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.currentCard}>
            <Text style={styles.cityName}>{weather.city}</Text>
            <View style={styles.tempRow}>
              <Ionicons 
                name={weather.condition as any || "sunny"} 
                size={48} 
                color={mapConditionColor(weather.condition)} 
              />
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
              <Ionicons 
                name={day.condition as any || "sunny"} 
                size={20} 
                color={mapConditionColor(day.condition)} 
              />
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B3015',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: { color: '#FF3B30', fontSize: 13, flex: 1 },
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
