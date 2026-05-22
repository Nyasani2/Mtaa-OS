import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VehicleRegistration } from '../types';

interface VehicleCardProps {
  vehicle: VehicleRegistration;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.plate}>{vehicle.plate_number}</Text>
      <Text style={styles.reg}>{vehicle.registration_number}</Text>
      <Text style={styles.make}>{vehicle.make} {vehicle.model} ({vehicle.year})</Text>
      <Text style={styles.color}>Color: {vehicle.color}</Text>
      {vehicle.expiry_date && (
        <Text style={styles.date}>Expires: {new Date(vehicle.expiry_date).toLocaleDateString()}</Text>
      )}
      {vehicle.body_type && vehicle.fuel_type && (
        <Text style={styles.meta}>{vehicle.body_type} • {vehicle.fuel_type} • {vehicle.seating_capacity} seats</Text>
      )}
      <Text style={[styles.status, { color: vehicle.status === 'active' ? '#22c55e' : '#ef4444' }]}>
        {vehicle.status.toUpperCase()}
      </Text>
      {vehicle.county && <Text style={styles.county}>{vehicle.county}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 16, marginVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  plate: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  reg: { fontSize: 12, color: '#666', marginTop: 2 },
  make: { fontSize: 16, color: '#333', marginTop: 8 },
  color: { fontSize: 14, color: '#666', marginTop: 4 },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  meta: { fontSize: 12, color: '#888', marginTop: 4 },
  status: { fontSize: 12, fontWeight: 'bold', marginTop: 8 },
  county: { fontSize: 12, color: '#666', marginTop: 4 },
});

export default VehicleCard;
