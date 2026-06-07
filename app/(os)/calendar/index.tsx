// app/(os)/calendar/index.tsx — MTAA OS Calendar
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth}><Ionicons name="chevron-back" size={28} color={COLORS.primary} /></TouchableOpacity>
        <Text style={styles.monthText}>{monthNames[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth}><Ionicons name="chevron-forward" size={28} color={COLORS.primary} /></TouchableOpacity>
      </View>

      <View style={styles.daysRow}>
        {days.map(d => <Text key={d} style={styles.dayLabel}>{d}</Text>)}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: firstDay }).map((_, i) => <View key={`empty-${i}`} style={styles.cell} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          return (
            <TouchableOpacity key={d} style={[styles.cell, isToday(d) && styles.todayCell]}>
              <Text style={[styles.cellText, isToday(d) && styles.todayText]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.events} contentContainerStyle={{ padding: SIZES.md }}>
        <Text style={styles.sectionTitle}>Today's Events</Text>
        <View style={styles.emptyEvent}>
          <Ionicons name="calendar-outline" size={40} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>No events today</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.md, paddingTop: SIZES.xl, paddingBottom: SIZES.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, marginBottom: SIZES.md },
  monthText: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
  daysRow: { flexDirection: 'row', paddingHorizontal: SIZES.md, marginBottom: SIZES.sm },
  dayLabel: { flex: 1, textAlign: 'center', fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.md },
  cell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  cellText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
  todayCell: { backgroundColor: COLORS.primary, borderRadius: SIZES.sm },
  todayText: { color: '#fff', fontFamily: FONTS.bold },
  events: { flex: 1, marginTop: SIZES.lg },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: SIZES.md },
  emptyEvent: { alignItems: 'center', paddingVertical: SIZES.xl },
  emptyText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary, marginTop: SIZES.sm },
});
