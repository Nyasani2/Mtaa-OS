import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FARE_RATES } from '../services/ride.service';

const VEHICLE_LIST = [
  { type: 'economy',  label: 'Economy',  icon: '🚗', desc: 'Affordable everyday rides' },
  { type: 'comfort',  label: 'Comfort',  icon: '🚙', desc: 'Newer cars, top drivers' },
  { type: 'xl',       label: 'XL',       icon: '🚐', desc: 'Fits up to 6 passengers' },
  { type: 'boda',     label: 'Boda',     icon: '🏍️', desc: 'Beat the traffic' },
  { type: 'delivery', label: 'Delivery', icon: '📦', desc: 'Send packages anywhere' },
];

interface Props {
  selected: string;
  onSelect: (type: string) => void;
  distanceKm: number;
  estimatedMinutes: number;
  surge?: number;
}

export default function VehicleSelector({ selected, onSelect, distanceKm, estimatedMinutes, surge = 1 }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Ride Type</Text>
      {VEHICLE_LIST.map((v) => {
        const rate = FARE_RATES[v.type] || FARE_RATES.economy;
        const distFare = Math.round(rate.perKm * distanceKm);
        const timeFare = Math.round(rate.perMin * estimatedMinutes);
        const rawTotal = rate.base + distFare + timeFare;
        const appliedSurge = Math.max(1, Math.min(surge, rate.surgeCap));
        const fare = Math.max(rate.minFare, Math.round(rawTotal * appliedSurge));
        const isActive = selected === v.type;

        return (
          <TouchableOpacity
            key={v.type}
            style={[styles.row, isActive && styles.activeRow]}
            onPress={() => onSelect(v.type)}
          >
            <Text style={styles.icon}>{v.icon}</Text>
            <View style={styles.info}>
              <Text style={[styles.label, isActive && styles.activeText]}>{v.label}</Text>
              <Text style={styles.sub}>{v.desc}</Text>
              <Text style={styles.breakdown}>
                Base KES {rate.base} + {rate.perKm}/km + {rate.perMin}/min
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={[styles.fare, isActive && styles.activeText]}>KES {fare.toLocaleString()}</Text>
              {appliedSurge > 1 && (
                <Text style={styles.surge}>{appliedSurge}x surge</Text>
              )}
            </View>
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
  icon: { fontSize: 28, marginRight: 12 },
  info: { flex: 1 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sub: { color: '#8892b0', fontSize: 11, marginTop: 1 },
  breakdown: { color: '#555', fontSize: 10, marginTop: 3 },
  priceCol: { alignItems: 'flex-end' },
  fare: { color: '#e94560', fontSize: 16, fontWeight: '700' },
  surge: { color: '#f39c12', fontSize: 10, fontWeight: '600', marginTop: 2 },
  activeText: { color: '#e94560' },
});
