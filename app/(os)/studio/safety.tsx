import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

type SafetyTab = 'guidelines' | 'reports' | 'tools' | 'audit' | 'appeals';

interface Report {
  id: string;
  reporter: string;
  content_type: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: string;
  ai_flagged: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  target: string;
  performed_by: string;
  created_at: string;
  reason?: string;
}

interface Appeal {
  id: string;
  original_action: string;
  reason: string;
  status: 'pending' | 'under_review' | 'approved' | 'denied';
  submitted_at: string;
}

export default function SafetyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SafetyTab>('guidelines');
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [isModerator, setIsModerator] = useState(false);

  // Moderation settings
  const [autoMod, setAutoMod] = useState(true);
  const [spamFilter, setSpamFilter] = useState(true);
  const [scamFilter, setScamFilter] = useState(true);
  const [childSafety, setChildSafety] = useState(true);
  const [hateSpeechFilter, setHateSpeechFilter] = useState(true);
  const [harassmentFilter, setHarassmentFilter] = useState(true);

  // Appeal form
  const [appealReason, setAppealReason] = useState('');
  const [appealAction, setAppealAction] = useState('');

  useEffect(() => {
    checkModerator();
    fetchSafetyData();
  }, []);

  const checkModerator = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('user_profiles').select('is_moderator, is_admin').eq('id', user.id).single();
      setIsModerator(!!(data?.is_moderator || data?.is_admin));
    } catch (e) { console.error(e); }
  };

  const fetchSafetyData = async () => {
    try {
      const { data: rep } = await supabase.from('studio_reports').select('*').order('created_at', { ascending: false }).limit(50);
      setReports(rep || []);
      const { data: aud } = await supabase.from('studio_audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      setAuditLogs(aud || []);
      const { data: app } = await supabase.from('studio_appeals').select('*').eq('user_id', user?.id).order('submitted_at', { ascending: false });
      setAppeals(app || []);
    } catch (e) { console.error(e); }
  };

  const submitAppeal = async () => {
    if (!appealReason.trim() || !appealAction.trim() || !user?.id) return;
    try {
      await supabase.from('studio_appeals').insert({
        user_id: user.id,
        original_action: appealAction,
        reason: appealReason,
        status: 'pending',
      });
      setAppealReason(''); setAppealAction('');
      fetchSafetyData();
    } catch (e) { console.error(e); }
  };

  const actionReport = async (reportId: string, action: 'actioned' | 'dismissed') => {
    if (!isModerator) {
      Alert.alert('Access Denied', 'Only moderators can action reports.');
      return;
    }
    try {
      await supabase.from('studio_reports').update({ status: action, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', reportId);
      fetchSafetyData();
    } catch (e) { console.error(e); }
  };

  const renderGuidelines = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.guidelinesContainer}>
      <View style={styles.guidelinesHeader}>
        <Feather name="shield" size={32} color="#6366f1" />
        <Text style={styles.guidelinesTitle}>Community Guidelines</Text>
        <Text style={styles.guidelinesDesc}>MStudio is a safe space for creators. These guidelines keep our community healthy.</Text>
      </View>

      {[
        { icon: 'heart', title: 'Respect Everyone', desc: 'Treat all creators and viewers with respect. No harassment, bullying, or hate speech.' },
        { icon: 'lock', title: 'Protect Privacy', desc: 'Do not share personal information without consent. Respect data privacy laws.' },
        { icon: 'smile', title: 'Child Safety First', desc: 'Content involving minors must be educational and safe. No exploitation of any kind.' },
        { icon: 'music', title: 'Respect Copyright', desc: 'Only upload content you own or have licensed. Respect intellectual property rights.' },
        { icon: 'dollar-sign', title: 'No Scams or Fraud', desc: 'Do not use MStudio for fraudulent schemes, pyramid schemes, or deceptive practices.' },
        { icon: 'message-circle', title: 'Authentic Engagement', desc: 'No spam, bot activity, or artificial engagement manipulation.' },
        { icon: 'globe', title: 'Cultural Sensitivity', desc: 'Respect African cultures, traditions, and diverse communities across the continent.' },
        { icon: 'flag', title: 'Report Violations', desc: 'If you see content that violates these guidelines, report it immediately.' },
      ].map((g, i) => (
        <View key={i} style={styles.guidelineItem}>
          <View style={styles.guidelineIcon}>
            <Feather name={g.icon as any} size={18} color="#6366f1" />
          </View>
          <View style={styles.guidelineInfo}>
            <Text style={styles.guidelineTitle}>{g.title}</Text>
            <Text style={styles.guidelineDesc}>{g.desc}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderReports = () => (
    <FlatList
      data={reports}
      keyExtractor={r => r.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="check-circle" size={48} color="#333" />
          <Text style={styles.emptyText}>No pending reports</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportType}>{item.content_type}</Text>
            {item.ai_flagged && (
              <View style={styles.aiBadge}>
                <Feather name="cpu" size={10} color="#6366f1" />
                <Text style={styles.aiBadgeText}>AI FLAGGED</Text>
              </View>
            )}
            <View style={[styles.reportStatus, item.status === 'pending' && styles.statusPending, item.status === 'actioned' && styles.statusActioned, item.status === 'dismissed' && styles.statusDismissed]}>
              <Text style={styles.reportStatusText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.reportReason}>{item.reason}</Text>
          <Text style={styles.reportMeta}>Reported by {item.reporter} • {new Date(item.created_at).toLocaleDateString()}</Text>
          {isModerator && item.status === 'pending' && (
            <View style={styles.modActions}>
              <TouchableOpacity style={styles.modActionBtn} onPress={() => actionReport(item.id, 'actioned')}>
                <Feather name="check" size={14} color="#10b981" />
                <Text style={styles.modActionText}>Action</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modActionBtn} onPress={() => actionReport(item.id, 'dismissed')}>
                <Feather name="x" size={14} color="#ef4444" />
                <Text style={styles.modActionText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  );

  const renderTools = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.toolsContainer}>
      <View style={styles.toolsHeader}>
        <Feather name="sliders" size={24} color="#6366f1" />
        <Text style={styles.toolsTitle}>Moderation Tools</Text>
        <Text style={styles.toolsDesc}>Configure AI-assisted moderation and safety filters for your content.</Text>
      </View>

      <View style={styles.toolSection}>
        <Text style={styles.toolSectionTitle}>AI Moderation</Text>
        <View style={styles.toolRow}>
          <View style={styles.toolLeft}>
            <Feather name="cpu" size={18} color="#6366f1" />
            <View>
              <Text style={styles.toolName}>Auto-Moderation</Text>
              <Text style={styles.toolDesc}>AI reviews content before publication</Text>
            </View>
          </View>
          <Switch value={autoMod} onValueChange={setAutoMod} trackColor={{ false: '#333', true: '#6366f1' }} thumbColor={autoMod ? '#fff' : '#666'} />
        </View>
      </View>

      <View style={styles.toolSection}>
        <Text style={styles.toolSectionTitle}>Content Filters</Text>
        {[
          { name: 'Spam Detection', desc: 'Block repetitive and low-quality content', value: spamFilter, setter: setSpamFilter, icon: 'message-square', color: '#f59e0b' },
          { name: 'Scam Detection', desc: 'Identify fraudulent schemes and phishing', value: scamFilter, setter: setScamFilter, icon: 'alert-triangle', color: '#ef4444' },
          { name: 'Child Safety', desc: 'Protect minors from harmful content', value: childSafety, setter: setChildSafety, icon: 'smile', color: '#10b981' },
          { name: 'Hate Speech Filter', desc: 'Detect and block discriminatory language', value: hateSpeechFilter, setter: setHateSpeechFilter, icon: 'flag', color: '#ec4899' },
          { name: 'Harassment Filter', desc: 'Identify bullying and targeted abuse', value: harassmentFilter, setter: setHarassmentFilter, icon: 'shield-off', color: '#8b5cf6' },
        ].map(tool => (
          <View key={tool.name} style={styles.toolRow}>
            <View style={styles.toolLeft}>
              <Feather name={tool.icon as any} size={18} color={tool.color} />
              <View>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDesc}>{tool.desc}</Text>
              </View>
            </View>
            <Switch value={tool.value} onValueChange={tool.setter} trackColor={{ false: '#333', true: tool.color }} thumbColor={tool.value ? '#fff' : '#666'} />
          </View>
        ))}
      </View>

      {isModerator && (
        <View style={styles.modPanel}>
          <Text style={styles.modPanelTitle}>Moderator Actions</Text>
          <TouchableOpacity style={styles.modPanelBtn}>
            <Feather name="user-x" size={16} color="#ef4444" />
            <Text style={styles.modPanelBtnText}>Ban User</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modPanelBtn}>
            <Feather name="trash-2" size={16} color="#ef4444" />
            <Text style={styles.modPanelBtnText}>Remove Content</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modPanelBtn}>
            <Feather name="alert-octagon" size={16} color="#f59e0b" />
            <Text style={styles.modPanelBtnText}>Issue Warning</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderAudit = () => (
    <FlatList
      data={auditLogs}
      keyExtractor={a => a.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="clipboard" size={48} color="#333" />
          <Text style={styles.emptyText}>No audit logs</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.auditCard}>
          <View style={styles.auditHeader}>
            <Feather name="activity" size={14} color="#6366f1" />
            <Text style={styles.auditAction}>{item.action}</Text>
          </View>
          <Text style={styles.auditTarget}>Target: {item.target}</Text>
          <Text style={styles.auditMeta}>By {item.performed_by} • {new Date(item.created_at).toLocaleString()}</Text>
          {item.reason && <Text style={styles.auditReason}>Reason: {item.reason}</Text>}
        </View>
      )}
    />
  );

  const renderAppeals = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.appealsContainer}>
      <View style={styles.appealForm}>
        <Text style={styles.appealFormTitle}>Submit an Appeal</Text>
        <TextInput style={styles.formInput} value={appealAction} onChangeText={setAppealAction} placeholder="What action are you appealing?" placeholderTextColor="#666" />
        <TextInput style={[styles.formInput, styles.appealInput]} value={appealReason} onChangeText={setAppealReason} placeholder="Explain why this action was incorrect..." placeholderTextColor="#666" multiline numberOfLines={4} textAlignVertical="top" />
        <TouchableOpacity style={styles.appealBtn} onPress={submitAppeal}>
          <Text style={styles.appealBtnText}>Submit Appeal</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Appeals</Text>
      {appeals.map(item => (
        <View key={item.id} style={styles.appealCard}>
          <View style={styles.appealHeader}>
            <Text style={styles.appealAction}>{item.original_action}</Text>
            <View style={[styles.appealStatus, item.status === 'approved' && styles.appealApproved, item.status === 'denied' && styles.appealDenied]}>
              <Text style={styles.appealStatusText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.appealReason}>{item.reason}</Text>
          <Text style={styles.appealDate}>Submitted {new Date(item.submitted_at).toLocaleDateString()}</Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Moderation</Text>
        {isModerator && (
          <View style={styles.modBadge}>
            <Feather name="shield" size={12} color="#fff" />
            <Text style={styles.modBadgeText}>MOD</Text>
          </View>
        )}
        {!isModerator && <View style={{ width: 24 }} />}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[
          { id: 'guidelines' as SafetyTab, label: 'Guidelines', icon: 'book-open' },
          { id: 'reports' as SafetyTab, label: 'Reports', icon: 'flag' },
          { id: 'tools' as SafetyTab, label: 'Tools', icon: 'sliders' },
          { id: 'audit' as SafetyTab, label: 'Audit Log', icon: 'clipboard' },
          { id: 'appeals' as SafetyTab, label: 'Appeals', icon: 'git-pull-request' },
        ].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}>
            <Feather name={t.icon as any} size={14} color={activeTab === t.id ? '#6366f1' : '#666'} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'guidelines' && renderGuidelines()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'tools' && renderTools()}
        {activeTab === 'audit' && renderAudit()}
        {activeTab === 'appeals' && renderAppeals()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  modBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  tabScroll: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: '#6366f1' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },

  content: { flex: 1 },

  // Guidelines
  guidelinesContainer: { padding: 16 },
  guidelinesHeader: { alignItems: 'center', marginBottom: 24 },
  guidelinesTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
  guidelinesDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  guidelineItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#141414', padding: 14, borderRadius: 12, marginBottom: 10 },
  guidelineIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' },
  guidelineInfo: { flex: 1 },
  guidelineTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  guidelineDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2, lineHeight: 18 },

  // Reports
  reportCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 10 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reportType: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  aiBadgeText: { color: '#6366f1', fontSize: 9, fontWeight: '800' },
  reportStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusPending: { backgroundColor: 'rgba(245,158,11,0.2)' },
  statusActioned: { backgroundColor: 'rgba(16,185,129,0.2)' },
  statusDismissed: { backgroundColor: 'rgba(100,100,100,0.2)' },
  reportStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  reportReason: { color: '#e5e5e5', fontSize: 13, marginBottom: 4 },
  reportMeta: { color: '#666', fontSize: 11 },
  modActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  modActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1f1f1f', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  modActionText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Tools
  toolsContainer: { padding: 16 },
  toolsHeader: { alignItems: 'center', marginBottom: 20 },
  toolsTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12 },
  toolsDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  toolSection: { marginBottom: 20 },
  toolSectionTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  toolRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  toolLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toolName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  toolDesc: { color: '#666', fontSize: 12, marginTop: 2, lineHeight: 18 },
  modPanel: { backgroundColor: '#141414', borderRadius: 12, padding: 16, marginTop: 10 },
  modPanelTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  modPanelBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1f1f1f', padding: 12, borderRadius: 8, marginBottom: 8 },
  modPanelBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Audit
  auditCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 8 },
  auditHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  auditAction: { color: '#fff', fontSize: 13, fontWeight: '600' },
  auditTarget: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  auditMeta: { color: '#666', fontSize: 11, marginTop: 4 },
  auditReason: { color: '#6366f1', fontSize: 11, marginTop: 4, fontStyle: 'italic' },

  // Appeals
  appealsContainer: { padding: 16 },
  appealForm: { backgroundColor: '#141414', borderRadius: 12, padding: 16, marginBottom: 20 },
  appealFormTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  formInput: { backgroundColor: '#1f1f1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14, marginBottom: 10 },
  appealInput: { minHeight: 80, textAlignVertical: 'top' },
  appealBtn: { backgroundColor: '#6366f1', padding: 12, borderRadius: 8, alignItems: 'center' },
  appealBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  appealCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginBottom: 10 },
  appealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  appealAction: { color: '#fff', fontSize: 14, fontWeight: '600' },
  appealStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: '#1f1f1f' },
  appealApproved: { backgroundColor: 'rgba(16,185,129,0.2)' },
  appealDenied: { backgroundColor: 'rgba(239,68,68,0.2)' },
  appealStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  appealReason: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  appealDate: { color: '#666', fontSize: 11, marginTop: 4 },

  // Empty
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
});
