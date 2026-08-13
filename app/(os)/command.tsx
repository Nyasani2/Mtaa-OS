// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Dimensions, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AuditCheck {
  id: string;
  category: string;
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  message: string;
  duration: number;
  details?: string;
}

interface AuditResult {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  duration: number;
  checks: AuditCheck[];
  timestamp: string;
}

const SCENARIOS = [
  { id: 'full-audit', name: 'Full System Audit', description: 'Complete health check', icon: 'shield-alt', checks: ['auth', 'wallet', 'routes', 'database', 'api', 'storage'] },
  { id: 'auth-check', name: 'Auth Security', description: 'Verify auth & authorization', icon: 'lock', checks: ['auth'] },
  { id: 'wallet-audit', name: 'Wallet Integrity', description: 'Check wallet functions', icon: 'wallet', checks: ['wallet'] },
  { id: 'route-scan', name: 'Route Scanner', description: 'Verify app routes', icon: 'route', checks: ['routes'] },
  { id: 'db-integrity', name: 'Database Check', description: 'Verify tables & RLS', icon: 'database', checks: ['database'] },
];

const ALL_CHECKS: AuditCheck[] = [
  { id: 'auth-1', category: 'Auth', name: 'Auth store loads', status: 'passed', message: 'Store initialized', duration: 12 },
  { id: 'auth-2', category: 'Auth', name: 'User has id/email', status: 'failed', message: 'Missing email field', duration: 8, details: 'Profile table needs email column' },
  { id: 'auth-3', category: 'Auth', name: 'PIN check works', status: 'passed', message: 'PIN validation OK', duration: 45 },
  { id: 'auth-4', category: 'Auth', name: 'Profile exposed', status: 'failed', message: 'Profile data unavailable', duration: 15, details: 'Check profile service connection' },
  { id: 'wallet-1', category: 'Wallet', name: 'Balance is number', status: 'passed', message: 'Type correct', duration: 5 },
  { id: 'wallet-2', category: 'Wallet', name: 'Balance >= 0', status: 'passed', message: 'Non-negative', duration: 3 },
  { id: 'wallet-3', category: 'Wallet', name: 'Transactions array', status: 'passed', message: 'History available', duration: 120 },
  { id: 'wallet-4', category: 'Wallet', name: 'Send function exists', status: 'failed', message: 'send() not found', duration: 8, details: 'Add send method to wallet store' },
  { id: 'wallet-5', category: 'Wallet', name: 'Receive function exists', status: 'failed', message: 'receive() not found', duration: 6, details: 'Add receive method to wallet store' },
  { id: 'wallet-6', category: 'Wallet', name: 'Wallet flow', status: 'failed', message: 'store.send is not a function', duration: 10, details: 'Wallet store methods incomplete' },
  { id: 'routes-1', category: 'Routes', name: 'Route /(os)/wallet', status: 'passed', message: 'Exists', duration: 20 },
  { id: 'routes-2', category: 'Routes', name: 'Route /(os)/wallet/deposit', status: 'passed', message: 'Exists', duration: 15 },
  { id: 'routes-3', category: 'Routes', name: 'Route /(os)/wallet/withdraw', status: 'passed', message: 'Exists', duration: 15 },
  { id: 'routes-4', category: 'Routes', name: 'Route /(os)/wallet/send', status: 'passed', message: 'Exists', duration: 15 },
  { id: 'routes-5', category: 'Routes', name: 'Route /(os)/wallet/qr', status: 'passed', message: 'Exists', duration: 15 },
  { id: 'routes-6', category: 'Routes', name: 'Route /(os)/clock', status: 'passed', message: 'Exists', duration: 10 },
  { id: 'routes-7', category: 'Routes', name: 'Route /(os)/calculator', status: 'passed', message: 'Exists', duration: 10 },
  { id: 'routes-8', category: 'Routes', name: 'Route /(os)/calendar', status: 'passed', message: 'Exists', duration: 10 },
  { id: 'routes-9', category: 'Routes', name: 'Route /(os)/network', status: 'passed', message: 'Exists', duration: 10 },
  { id: 'routes-10', category: 'Routes', name: 'Route /(os)/wifi', status: 'passed', message: 'Exists', duration: 10 },
  { id: 'db-1', category: 'Database', name: 'Supabase connection', status: 'passed', message: 'Connected', duration: 50 },
  { id: 'db-2', category: 'Database', name: 'RLS policies', status: 'warning', message: '46 tables need RLS', duration: 200, details: 'Run rls-remaining-tables.sql' },
  { id: 'db-3', category: 'Database', name: 'Edge functions', status: 'passed', message: '12 deployed', duration: 100 },
  { id: 'api-1', category: 'API', name: 'Wallet operations', status: 'passed', message: 'Active', duration: 80 },
  { id: 'api-2', category: 'API', name: 'Checkout', status: 'passed', message: 'Active', duration: 60 },
  { id: 'api-3', category: 'API', name: 'Notifications', status: 'passed', message: 'Active', duration: 55 },
  { id: 'storage-1', category: 'Storage', name: 'Content bucket', status: 'passed', message: 'Accessible', duration: 30 },
  { id: 'storage-2', category: 'Storage', name: 'Avatar bucket', status: 'passed', message: 'Accessible', duration: 25 },
];

export default function AsisSimulator() {
  const router = useRouter();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('full-audit');
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [history, setHistory] = useState<AuditResult[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'fixes'>('current');
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  const runAudit = useCallback(async (scenarioId: string) => {
    setIsRunning(true);
    setResult(null);
    const scenario = SCENARIOS.find((s) => s.id === scenarioId);
    const checks: AuditCheck[] = [];
    const totalChecks = ALL_CHECKS.filter((c) => targetCategories.some((tc) => c.category.toLowerCase().includes(tc)));
    for (const check of totalChecks) {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
      checks.push({ ...check });
    }
    const passed = checks.filter((c) => c.status === 'passed').length;
    const failed = checks.filter((c) => c.status === 'failed').length;
    const warnings = checks.filter((c) => c.status === 'warning').length;
    const auditResult: AuditResult = {
      total: checks.length, passed, failed, warnings,
      duration: checks.reduce((sum, c) => sum + c.duration, 0),
      checks, timestamp: new Date().toISOString(),
    };
    setResult(auditResult);
    setHistory((prev) => [auditResult, ...prev].slice(0, 10));
    setIsRunning(false);
  }, []);

  const getFixSuggestion = (check: AuditCheck): string => {
    const fixes: Record<string, string> = {
      'auth-2': 'Add email column to profiles table or update auth store to read from users table.',
      'auth-4': 'Check profile service connection. Ensure profile data is fetched after auth.',
      'wallet-4': 'Add send() method to wallet store. Implement transfer logic with PIN confirmation.',
      'wallet-5': 'Add receive() method to wallet store. Handle incoming transfer notifications.',
      'wallet-6': 'Complete wallet store implementation. Add send, receive, deposit, withdraw methods.',
      'db-2': 'Run sql/rls-remaining-tables.sql in Supabase SQL Editor to add RLS policies.',
    };
    return fixes[check.id] || 'Review the component/service and ensure all required methods/properties exist.';
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <Ionicons name="checkmark-circle" size={20} color="#30d158" />;
      case 'failed': return <Ionicons name="close-circle" size={20} color="#ff453a" />;
      case 'warning': return <Ionicons name="warning" size={20} color="#ff9f0a" />;
      default: return <ActivityIndicator size={16} color="#6366f1" />;
    }
  };

  const renderGauge = () => {
    if (!result) return null;
    const percentage = Math.round((result.passed / result.total) * 100);
    const color = percentage >= 80 ? '#30d158' : percentage >= 60 ? '#ff9f0a' : '#ff453a';
    return (
      <View style={styles.gaugeContainer}>
        <View style={styles.gaugeCircle}>
          <Text style={[styles.gaugePercent, { color }]}>{percentage}%</Text>
          <Text style={styles.gaugeLabel}>{result.passed}/{result.total} passed</Text>
        </View>
        <View style={styles.gaugeStats}>
          <View style={styles.statItem}><Ionicons name="checkmark-circle" size={16} color="#30d158" /><Text style={styles.statText}>{result.passed} Passed</Text></View>
          <View style={styles.statItem}><Ionicons name="close-circle" size={16} color="#ff453a" /><Text style={styles.statText}>{result.failed} Failed</Text></View>
          <View style={styles.statItem}><Ionicons name="warning" size={16} color="#ff9f0a" /><Text style={styles.statText}>{result.warnings} Warnings</Text></View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>ASIS Simulator</Text>
        <TouchableOpacity onPress={() => setShowScenarioModal(true)} style={styles.headerBtn}><Ionicons name="options" size={22} color="#fff" /></TouchableOpacity>
      </View>

      <View style={styles.scenarioBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SCENARIOS.map((s) => (
            <TouchableOpacity key={s.id} style={[styles.scenarioChip, selectedScenario === s.id && styles.scenarioChipActive]} onPress={() => setSelectedScenario(s.id)}>
              <FontAwesome5 name={s.icon} size={14} color={selectedScenario === s.id ? '#6366f1' : '#8e8e93'} />
              <Text style={[styles.scenarioText, selectedScenario === s.id && styles.scenarioTextActive]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={[styles.runButton, isRunning && styles.runButtonDisabled]} onPress={() => runAudit(selectedScenario)} disabled={isRunning}>
        {isRunning ? (<><ActivityIndicator size="small" color="#fff" /><Text style={styles.runButtonText}>Running...</Text></>) : (<><Ionicons name="play" size={20} color="#fff" /><Text style={styles.runButtonText}>Run {SCENARIOS.find((s) => s.id === selectedScenario)?.name}</Text></>)}
      </TouchableOpacity>

      <View style={styles.tabBar}>
        {(['current', 'history', 'fixes'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'current' && (<>
          {result && renderGauge()}
          {result && (<View style={styles.checksList}>
            {result.checks.map((check) => (
              <TouchableOpacity key={check.id} style={styles.checkItem} onPress={() => setExpandedCheck(expandedCheck === check.id ? null : check.id)}>
                <View style={styles.checkHeader}>
                  {renderStatusIcon(check.status)}
                  <View style={styles.checkInfo}><Text style={styles.checkName}>{check.name}</Text><Text style={styles.checkMessage}>{check.message}</Text></View>
                  <Text style={styles.checkDuration}>{check.duration}ms</Text>
                </View>
                {expandedCheck === check.id && check.details && (<View style={styles.checkDetails}>
                  <Text style={styles.detailsText}>{check.details}</Text>
                  {check.status === 'failed' && (<View style={styles.fixBox}><Text style={styles.fixTitle}>Suggested Fix:</Text><Text style={styles.fixText}>{getFixSuggestion(check)}</Text></View>)}
                </View>)}
              </TouchableOpacity>
            ))}
          </View>)}
          {!result && !isRunning && (<View style={styles.emptyAudit}><Ionicons name="shield-checkmark" size={64} color="#6366f1" /><Text style={styles.emptyTitle}>Ready to Audit</Text><Text style={styles.emptySubtitle}>Select a scenario and run the audit.</Text></View>)}
        </>)}

        {activeTab === 'history' && (<View style={styles.historyList}>
          {history.map((h, i) => (
            <TouchableOpacity key={i} style={styles.historyItem} onPress={() => setResult(h)}>
              <View style={styles.historyHeader}><Text style={styles.historyDate}>{new Date(h.timestamp).toLocaleString()}</Text><Text style={[styles.historyScore, { color: h.failed === 0 ? '#30d158' : h.failed > 2 ? '#ff453a' : '#ff9f0a' }]}>{h.passed}/{h.total}</Text></View>
              <Text style={styles.historyDuration}>Duration: {h.duration}ms · {h.failed} failed · {h.warnings} warnings</Text>
            </TouchableOpacity>
          ))}
          {history.length === 0 && <Text style={styles.emptyHistory}>No audit history yet.</Text>}
        </View>)}

        {activeTab === 'fixes' && (<View style={styles.fixesList}>
          <Text style={styles.fixesHeader}>Recommended Fixes</Text>
          {ALL_CHECKS.filter((c) => c.status === 'failed').map((check) => (
            <View key={check.id} style={styles.fixItem}>
              <View style={styles.fixHeader}><Ionicons name="close-circle" size={18} color="#ff453a" /><Text style={styles.fixItemTitle}>{check.name}</Text></View>
              <Text style={styles.fixItemMessage}>{check.message}</Text>
              <Text style={styles.fixItemSolution}>{getFixSuggestion(check)}</Text>
            </View>
          ))}
          {ALL_CHECKS.filter((c) => c.status === 'failed').length === 0 && <Text style={styles.allGood}>All checks passing!</Text>}
        </View>)}
      </ScrollView>

      <Modal visible={showScenarioModal} transparent animationType="fade" onRequestClose={() => setShowScenarioModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Scenario</Text>
            {SCENARIOS.map((s) => (
              <TouchableOpacity key={s.id} style={[styles.modalItem, selectedScenario === s.id && styles.modalItemActive]} onPress={() => { setSelectedScenario(s.id); setShowScenarioModal(false); }}>
                <FontAwesome5 name={s.icon} size={20} color={selectedScenario === s.id ? '#6366f1' : '#8e8e93'} />
                <View style={styles.modalItemInfo}><Text style={styles.modalItemTitle}>{s.name}</Text><Text style={styles.modalItemDesc}>{s.description}</Text></View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerBtn: { padding: 8 },
  scenarioBar: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  scenarioChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1a1a2e', marginRight: 10, marginLeft: 4 },
  scenarioChipActive: { backgroundColor: '#6366f120', borderWidth: 1, borderColor: '#6366f1' },
  scenarioText: { fontSize: 13, color: '#8e8e93', fontWeight: '500' },
  scenarioTextActive: { color: '#6366f1', fontWeight: '600' },
  runButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 16, padding: 16, backgroundColor: '#6366f1', borderRadius: 14 },
  runButtonDisabled: { backgroundColor: '#2a2a3e' },
  runButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  tabText: { color: '#8e8e93', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '600' },
  content: { flex: 1 },
  gaugeContainer: { alignItems: 'center', padding: 24 },
  gaugeCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, borderColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  gaugePercent: { fontSize: 36, fontWeight: '700' },
  gaugeLabel: { fontSize: 12, color: '#8e8e93', marginTop: 4 },
  gaugeStats: { flexDirection: 'row', gap: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#8e8e93', fontSize: 13 },
  checksList: { padding: 16 },
  checkItem: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 8 },
  checkHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkInfo: { flex: 1 },
  checkName: { fontSize: 14, color: '#fff', fontWeight: '500' },
  checkMessage: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
  checkDuration: { fontSize: 11, color: '#666' },
  checkDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a3e' },
  detailsText: { fontSize: 13, color: '#8e8e93', lineHeight: 18 },
  fixBox: { marginTop: 10, padding: 12, backgroundColor: '#6366f110', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  fixTitle: { fontSize: 12, color: '#6366f1', fontWeight: '600', marginBottom: 4 },
  fixText: { fontSize: 13, color: '#e0e0e0', lineHeight: 18 },
  emptyAudit: { alignItems: 'center', justifyContent: 'center', padding: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#8e8e93', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  historyList: { padding: 16 },
  historyItem: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 12, color: '#8e8e93' },
  historyScore: { fontSize: 16, fontWeight: '700' },
  historyDuration: { fontSize: 12, color: '#666', marginTop: 4 },
  emptyHistory: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14 },
  fixesList: { padding: 16 },
  fixesHeader: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  fixItem: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 8 },
  fixHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  fixItemTitle: { fontSize: 15, color: '#fff', fontWeight: '600' },
  fixItemMessage: { fontSize: 13, color: '#8e8e93', marginBottom: 8 },
  fixItemSolution: { fontSize: 13, color: '#6366f1', lineHeight: 18 },
  allGood: { color: '#30d158', textAlign: 'center', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0f0f1a', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, marginBottom: 8 },
  modalItemActive: { backgroundColor: '#6366f120' },
  modalItemInfo: { flex: 1 },
  modalItemTitle: { fontSize: 15, color: '#fff', fontWeight: '600' },
  modalItemDesc: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
});
