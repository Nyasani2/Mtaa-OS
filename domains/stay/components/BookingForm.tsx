import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarDays, Users, Minus, Plus } from 'lucide-react-native';

interface Props {
  propertyId: string;
  pricePerNight: number;
  currency?: string;
  cleaningFee?: number;
  serviceFee?: number;
  onSubmit?: (data: any) => void;
}

export default function BookingForm({ propertyId, pricePerNight, currency = 'KES', cleaningFee = 0, serviceFee = 0, onSubmit }: Props) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const subtotal = nights * pricePerNight;
  const total = subtotal + cleaningFee + serviceFee;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Dates</Text>
      <View style={styles.dateRow}>
        <View style={styles.dateInput}>
          <CalendarDays size={16} color="#6b7280" />
          <TextInput style={styles.input} value={checkIn} onChangeText={setCheckIn} placeholder="Check-in" placeholderTextColor="#9ca3af" />
        </View>
        <View style={styles.dateInput}>
          <CalendarDays size={16} color="#6b7280" />
          <TextInput style={styles.input} value={checkOut} onChangeText={setCheckOut} placeholder="Check-out" placeholderTextColor="#9ca3af" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Guests</Text>
      <View style={styles.guestRow}>
        <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(Math.max(1, guests - 1))}>
          <Minus size={16} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.guestCount}>
          <Users size={16} color="#1a5c4b" />
          <Text style={styles.guestText}>{guests}</Text>
        </View>
        <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(guests + 1)}>
          <Plus size={16} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {nights > 0 && (
        <View style={styles.breakdown}>
          <View style={styles.breakRow}><Text style={styles.breakLabel}>{currency} {pricePerNight.toLocaleString()} x {nights} nights</Text><Text style={styles.breakValue}>{currency} {subtotal.toLocaleString()}</Text></View>
          {cleaningFee > 0 && <View style={styles.breakRow}><Text style={styles.breakLabel}>Cleaning fee</Text><Text style={styles.breakValue}>{currency} {cleaningFee.toLocaleString()}</Text></View>}
          {serviceFee > 0 && <View style={styles.breakRow}><Text style={styles.breakLabel}>Service fee</Text><Text style={styles.breakValue}>{currency} {serviceFee.toLocaleString()}</Text></View>}
          <View style={[styles.breakRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{currency} {total.toLocaleString()}</Text></View>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={() => onSubmit?.({ propertyId, checkIn, checkOut, guests, total })}>
        <Text style={styles.btnText}>Reserve</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginTop: 16, marginBottom: 8 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#e5e0d5' },
  input: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e0d5' },
  guestCount: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e0d5', minWidth: 100, justifyContent: 'center' },
  guestText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  breakdown: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 16 },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakLabel: { fontSize: 14, color: '#6b7280' },
  breakValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e5e0d5', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#1a5c4b' },
  btn: { backgroundColor: '#1a5c4b', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
