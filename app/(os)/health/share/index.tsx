// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useHealthSharing } from '@/lib/health/hooks/useHealthSharing';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ShareScreen() {
  const { user } = useAuthStore();
  const { grants, loading, error, refresh, revoke } = useHealthSharing(user?.id);
  const [activeTab, setActiveTab] = useState<'active' | 'expired' | 'revoked'>('active');

  useEffect(() => {
    refresh();
  }, []);

  const filteredGrants = (grants || []).filter((g: any) => g.status === activeTab);

  const handleRevoke = (grantId: string) => {
    Alert.alert('Revoke Access', 'Are you sure you want to revoke this sharing grant?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => revoke(grantId) },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Records</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Records</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/health/share/grant' as any)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.tabActive]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active ({(grants || []).filter((g: any) => g.status === 'active').length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'expired' && styles.tabActive]} onPress={() => setActiveTab('expired')}>
          <Text style={[styles.tabText, activeTab === 'expired' && styles.tabTextActive]}>Expired ({(grants || []).filter((g: any) => g.status === 'expired').length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'revoked' && styles.tabActive]} onPress={() => setActiveTab('revoked')}>
          <Text style={[styles.tabText, activeTab === 'revoked' && styles.tabTextActive]}>Revoked ({(grants || []).filter((g: any) => g.status === 'revoked').length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {filteredGrants.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="share-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No {activeTab} sharing grants</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/health/share/grant' as any)}>
              <Text style={styles.emptyBtnText}>Grant Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredGrants.map((grant: any) => (
            <View key={grant.id} style={styles.grantCard}>
              <View style={styles.grantHeader}>
                <Ionicons name="medical" size={20} color="#007AFF" />
                <Text style={styles.grantTitle}>{grant.hospitalName}</Text>
                {grant.status === 'active' && (
                  <TouchableOpacity onPress={() => handleRevoke(grant.id)}>
                    <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.grantScope}>Access: {grant.scope.join(', ')}</Text>
              <Text style={styles.grantExpiry}>Expires: {new Date(grant.expiresAt).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', gap: 8 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { fontSize: 13, color: '#666' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#007AFF', borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  grantCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  grantHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  grantTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  grantScope: { fontSize: 14, color: '#666', marginBottom: 4 },
  grantExpiry: { fontSize: 13, color: '#999' },
});
