// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkspaceScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Simulate loading real workspace data
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const userName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'User';
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const stats = [
    { label: 'Active Tasks', value: '12', icon: 'checkmark-circle', color: '#10B981', route: '/(work)/tasks' },
    { label: 'Pending Jobs', value: '3', icon: 'briefcase', color: '#F59E0B', route: '/(work)/jobs' },
    { label: 'Messages', value: '5', icon: 'chatbubble', color: '#3B82F6', route: '/(communication)/messages' },
  ];

  const quickActions = [
    { label: 'New Task', icon: 'add-circle', color: '#10B981', route: '/tasks/new' },
    { label: 'Find Jobs', icon: 'search', color: '#F59E0B', route: '/(work)/jobs' },
    { label: 'Calendar', icon: 'calendar', color: '#8B5CF6', route: '/(os)/calendar' },
    { label: 'Documents', icon: 'document-text', color: '#3B82F6', route: '/(os)/reader' },
  ];

  const recentActivity = [
    { id: 1, icon: 'document-attach', color: '#3B82F6', title: 'Contract Updated', time: '2 hours ago', desc: 'MTaxi Driver Agreement v2.1' },
    { id: 2, icon: 'checkmark-done', color: '#10B981', title: 'Task Completed', time: '5 hours ago', desc: 'Weekly Revenue Report submitted' },
    { id: 3, icon: 'people', color: '#8B5CF6', title: 'New Tribe Member', time: '1 day ago', desc: 'John Doe joined "Nairobi Tech"' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Workspace...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(os)/profile')}>
            <Ionicons name="person-circle" size={48} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.statCard}
              onPress={() => stat.route && router.push(stat.route)}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.actionCard}
                onPress={() => action.route && router.push(action.route)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(os)/notifications')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <TouchableOpacity key={activity.id} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                  <Ionicons name={activity.icon} size={20} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDesc}>{activity.desc}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  scrollContent: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { color: '#94A3B8', fontSize: 16 },
  userName: { color: '#F8FAFC', fontSize: 28, fontWeight: '800', marginTop: 4 },
  profileBtn: { padding: 4 },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { 
    flex: 1, 
    backgroundColor: '#1E293B', 
    borderRadius: 16, 
    padding: 16, 
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { color: '#94A3B8', fontSize: 12, textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  seeAllText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  
  actionsScroll: { paddingRight: 20 },
  actionCard: { 
    width: 100, 
    backgroundColor: '#1E293B', 
    borderRadius: 16, 
    padding: 16, 
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { color: '#F8FAFC', fontSize: 13, fontWeight: '600', textAlign: 'center' },

  activityList: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
  activityItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#334155' 
  },
  activityIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  activityDesc: { color: '#94A3B8', fontSize: 13 },
  activityTime: { color: '#64748B', fontSize: 12 },
});
