import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const VEHICLES = [
  { type: 'economy', label: 'Economy', rate: 40, icon: '🚗' },
  { type: 'comfort', label: 'Comfort', rate: 60, icon: '🚙' },
  { type: 'xl', label: 'XL', rate: 80, icon: '🚐' },
  { type: 'boda', label: 'Boda', rate: 25, icon: '🏍️' },
  { type: 'delivery', label: 'Delivery', rate: 50, icon: '📦' },
];

interface Props {
  selected: string;
  onSelect: (type: string, rate: number) => void;
  distanceKm: number;
}

export default function VehicleSelector({ selected, onSelect, distanceKm }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Ride Type</Text>
      {VEHICLES.map((v) => {
        const fare = Math.round(v.rate * distanceKm);
        const isActive = selected === v.type;
        return (
          <TouchableOpacity
            key={v.type}
            style={[styles.row, isActive && styles.activeRow]}
            onPress={() => onSelect(v.type, v.rate)}
          >
            <Text style={styles.icon}>{v.icon}</Text>
            <View style={styles.info}>
              <Text style={[styles.label, isActive && styles.activeText]}>{v.label}</Text>
              <Text style={styles.sub}>KES {v.rate}/km</Text>
            </View>
            <Text style={[styles.fare, isActive && styles.activeText]}>KES {fare}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#1a1a2e', borderRadius: 12, marginVertical: 8 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 6, backgroundColor: '#16213e' },
  activeRow: { backgroundColor: '#0f3460', borderWidth: 1, borderColor: '#e94560' },
  icon: { fontSize: 24, marginRight: 12 },
  info: { flex: 1 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sub: { color: '#8892b0', fontSize: 12, marginTop: 2 },
  fare: { color: '#e94560', fontSize: 16, fontWeight: '700' },
  activeText: { color: '#e94560' },
});
