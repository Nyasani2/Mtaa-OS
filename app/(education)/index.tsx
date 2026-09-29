// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const MOCK_FEED = [
  { id: '1', title: 'School Reopens', desc: 'Term 2 begins next Monday. Please ensure uniforms are ready.', time: '2h ago', icon: 'school', color: '#3B82F6' },
  { id: '2', title: 'Transport Update', desc: 'Bus Route 4 will be delayed by 15 mins due to traffic.', time: '5h ago', icon: 'bus', color: '#F59E0B' },
  { id: '3', title: 'Parent-Teacher Meeting', desc: 'Scheduled for Friday at 3:00 PM in the main hall.', time: '1d ago', icon: 'people', color: '#10B981' },
];

export default function EducationDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.email?.split('@')[0] || 'Parent'} 👋</Text>
          <Text style={styles.subGreeting}>Here's what's happening in Education</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle" size={40} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Live Transport Map CTA */}
      <TouchableOpacity 
        style={styles.mapCard} 
        onPress={() => router.push('/(education)/transport/map')}
      >
        <View style={styles.mapIconBox}>
          <Ionicons name="map" size={28} color="#fff" />
        </View>
        <View style={styles.mapInfo}>
          <Text style={styles.mapTitle}>Live Transport Map</Text>
          <Text style={styles.mapDesc}>Track your child's bus in real-time</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(education)/transport/scan')}>
          <Ionicons name="qr-code" size={24} color="#3B82F6" />
          <Text style={styles.actionText}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(education)/attendance')}>
          <Ionicons name="clipboard" size={24} color="#10B981" />
          <Text style={styles.actionText}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(education)/fees')}>
          <Ionicons name="card" size={24} color="#F59E0B" />
          <Text style={styles.actionText}>Fees</Text>
        </TouchableOpacity>
      </View>

      {/* Education Feed */}
      <View style={styles.feedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Education Feed</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
        {MOCK_FEED.map((item) => (
          <View key={item.id} style={styles.feedCard}>
            <View style={[styles.feedIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={styles.feedContent}>
              <Text style={styles.feedTitle}>{item.title}</Text>
              <Text style={styles.feedDesc} numberOfLines={2}>{item.desc}</Text>
              <Text style={styles.feedTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subGreeting: { fontSize: 14, color: '#64748B', marginTop: 4 },
  profileBtn: { padding: 4 },
  
  mapCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', marginHorizontal: 20, padding: 20, borderRadius: 16, marginBottom: 20 },
  mapIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  mapInfo: { flex: 1 },
  mapTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  mapDesc: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginBottom: 24 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  
  feedSection: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  seeAll: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  feedCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  feedIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  feedContent: { flex: 1 },
  feedTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  feedDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  feedTime: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
});
