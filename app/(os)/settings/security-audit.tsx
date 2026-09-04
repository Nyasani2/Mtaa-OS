import { useState } from 'react';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { securityTests, SecurityTestResult } from '@/lib/security/security-tests';
import { Ionicons } from '@expo/vector-icons';

interface AuditLog {
  id: string;
  event_type: string;
  metadata: any;
  created_at: string;
}

export default function SecurityAuditScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLogs().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  const runTests = async () => {
    setTesting(true);
    const results = await securityTests.runAllTests();
    setTestResults(results);
    setTesting(false);
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('success')) return 'checkmark-circle';
    if (eventType.includes('failed')) return 'close-circle';
    if (eventType.includes('lock')) return 'lock-closed';
    if (eventType.includes('pin')) return 'keypad';
    if (eventType.includes('biometric')) return 'finger-print';
    if (eventType.includes('device')) return 'phone-portrait';
    if (eventType.includes('payment')) return 'card';
    return 'shield';
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('success')) return '#22c55e';
    if (eventType.includes('failed')) return '#ef4444';
    if (eventType.includes('lockout')) return '#f59e0b';
    return '#3b82f6';
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const passedCount = testResults.filter((r) => r.passed).length;
  const totalCount = testResults.length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Security Center</Text>
        <Text style={styles.subtitle}>Audit logs and security tests</Text>
      </View>

      {/* Security Tests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security Tests</Text>
          <TouchableOpacity style={styles.testButton} onPress={runTests} disabled={testing}>
            {testing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.testButtonText}>Run Tests</Text>
            )}
          </TouchableOpacity>
        </View>

        {testResults.length > 0 && (
          <View style={styles.testSummary}>
            <Text style={[styles.testSummaryText, passedCount === totalCount ? styles.allPass : styles.someFail]}>
              {passedCount}/{totalCount} passed
            </Text>
          </View>
        )}

        {testResults.map((result, index) => (
          <View key={index} style={styles.testItem}>
            <Ionicons
              name={result.passed ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={result.passed ? '#22c55e' : '#ef4444'}
            />
            <View style={styles.testText}>
              <Text style={styles.testName}>{result.test}</Text>
              <Text style={styles.testMessage}>{result.message}</Text>
            </View>
            <View style={[styles.severityBadge, styles[`severity${result.severity}`]]}>
              <Text style={styles.severityText}>{result.severity}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Audit Logs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#ffffff" />
        ) : logs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-checkmark" size={40} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No security events yet</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={[styles.logIcon, { backgroundColor: `${getEventColor(log.event_type)}20` }]}>
                <Ionicons
                  name={getEventIcon(log.event_type) as any}
                  size={18}
                  color={getEventColor(log.event_type)}
                />
              </View>
              <View style={styles.logText}>
                <Text style={styles.logEvent}>{log.event_type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={styles.logTime}>{formatDate(log.created_at)}</Text>
                {log.metadata && (
                  <Text style={styles.logMeta} numberOfLines={2}>
                    {JSON.stringify(log.metadata)}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  testButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  testSummary: {
    marginBottom: 12,
  },
  testSummaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  allPass: {
    color: '#22c55e',
  },
  someFail: {
    color: '#ef4444',
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  testText: {
    flex: 1,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  testMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severitycritical: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  severityhigh: {
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  severitymedium: {
    backgroundColor: 'rgba(59,130,246,0.2)',
  },
  severitylow: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  loader: {
    marginVertical: 24,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logText: {
    flex: 1,
  },
  logEvent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  logMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'monospace',
  },
});
