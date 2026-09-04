import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const BUDGET_OPTIONS = [
  { label: '$5 / day', value: 5, duration: 3 },
  { label: '$10 / day', value: 10, duration: 7 },
  { label: '$25 / day', value: 25, duration: 14 },
  { label: '$50 / day', value: 50, duration: 30 },
  { label: 'Custom', value: 0, duration: 0 },
];

const DURATIONS = [3, 7, 14, 30];

export default function AdsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId?: string }>();
  const { user } = useAuthStore();
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [customBudget, setCustomBudget] = useState('');
  const [duration, setDuration] = useState(7);
  const [targetAudience, setTargetAudience] = useState('all');
  const [loading, setLoading] = useState(false);

  const budget = selectedBudget === 0 ? parseFloat(customBudget) || 0 : selectedBudget || 0;
  const totalCost = budget * duration;

  const handlePromote = useCallback(() => {
    if (!postId) {
      Alert.alert('Error', 'No post selected for promotion');
      return;
    }
    if (budget <= 0) {
      Alert.alert('Error', 'Please select a valid budget');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Promotion Started',
        `Your post is now being promoted for $${totalCost} over ${duration} days.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  }, [postId, budget, duration, totalCost, router]);

  const renderBudgetOption = (opt: typeof BUDGET_OPTIONS[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.budgetCard,
        selectedBudget === opt.value && styles.budgetCardActive,
      ]}
      onPress={() => { setSelectedBudget(opt.value); if (opt.value > 0) setCustomBudget(''); }}
    >
      <Text style={[styles.budgetLabel, selectedBudget === opt.value && styles.budgetLabelActive]}>
        {opt.label}
      </Text>
      {opt.value > 0 && (
        <Text style={styles.budgetMeta}>
          Est. reach: {(opt.value * 200).toLocaleString()} people
        </Text>
      )}
      {selectedBudget === opt.value && (
        <Ionicons name="checkmark-circle" size={20} color="#2196F3" style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promote Post</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Post Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Post to Promote</Text>
          <View style={styles.postPreview}>
            <Ionicons name="image" size={40} color="#888" />
            <View style={styles.postInfo}>
              <Text style={styles.postTitle} numberOfLines={1}>
                {postId ? `Post #${postId}` : 'Select a post from your profile'}
              </Text>
              <Text style={styles.postMeta}>Your content will be shown to targeted audiences</Text>
            </View>
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Budget</Text>
          {BUDGET_OPTIONS.map(renderBudgetOption)}
          {selectedBudget === 0 && (
            <TextInput
              style={styles.customInput}
              placeholder="Enter custom daily budget ($)"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              value={customBudget}
              onChangeText={setCustomBudget}
            />
          )}
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration (Days)</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationChip, duration === d && styles.durationChipActive]}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.durationText, duration === d && styles.durationTextActive]}>
                  {d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Audience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Audience</Text>
          {['all', 'followers', 'local'].map((aud) => (
            <TouchableOpacity
              key={aud}
              style={[styles.audienceRow, targetAudience === aud && styles.audienceRowActive]}
              onPress={() => setTargetAudience(aud)}
            >
              <Ionicons
                name={
                  aud === 'all' ? 'globe-outline' :
                  aud === 'followers' ? 'people-outline' : 'location-outline'
                }
                size={20}
                color={targetAudience === aud ? '#2196F3' : '#888'}
              />
              <Text style={[styles.audienceText, targetAudience === aud && styles.audienceTextActive]}>
                {aud === 'all' ? 'Everyone' : aud === 'followers' ? 'Your Followers' : 'Local Area'}
              </Text>
              {targetAudience === aud && (
                <Ionicons name="checkmark" size={18} color="#2196F3" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Analytics Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Results</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{(totalCost * 40).toLocaleString()}</Text>
              <Text style={styles.analyticLabel}>People Reached</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{(totalCost * 2).toLocaleString()}</Text>
              <Text style={styles.analyticLabel}>Profile Visits</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{Math.round(totalCost * 0.8)}</Text>
              <Text style={styles.analyticLabel}>New Followers</Text>
            </View>
            <View style={styles.analyticItem}>
              <Text style={styles.analyticValue}>{Math.round(totalCost * 1.5)}</Text>
              <Text style={styles.analyticLabel}>Engagements</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Daily Budget</Text>
            <Text style={styles.summaryValue}>${budget.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{duration} days</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryLabelTotal}>Total Cost</Text>
            <Text style={styles.summaryValueTotal}>${totalCost.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.promoteBtn, (budget <= 0 || loading) && styles.promoteBtnDisabled]}
          onPress={handlePromote}
          disabled={budget <= 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.promoteBtnText}>Promote for ${totalCost.toFixed(2)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  postPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  postInfo: { flex: 1 },
  postTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  postMeta: { color: '#888', fontSize: 13, marginTop: 4 },
  budgetCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  budgetCardActive: { borderColor: '#2196F3', backgroundColor: '#0d1f33' },
  budgetLabel: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  budgetLabelActive: { color: '#2196F3' },
  budgetMeta: { color: '#888', fontSize: 13 },
  checkIcon: { marginLeft: 8 },
  customInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    marginTop: 8,
  },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationChip: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  durationChipActive: { borderColor: '#2196F3', backgroundColor: '#0d1f33' },
  durationText: { color: '#888', fontSize: 14, fontWeight: '600' },
  durationTextActive: { color: '#2196F3' },
  audienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  audienceRowActive: { borderColor: '#2196F3', backgroundColor: '#0d1f33' },
  audienceText: { color: '#ccc', fontSize: 15, flex: 1 },
  audienceTextActive: { color: '#fff', fontWeight: '600' },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  analyticItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
  },
  analyticValue: { color: '#2196F3', fontSize: 20, fontWeight: '700' },
  analyticLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  summaryBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryTotal: { borderTopWidth: 1, borderTopColor: '#333', marginTop: 8, paddingTop: 12 },
  summaryLabel: { color: '#888', fontSize: 14 },
  summaryValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  summaryLabelTotal: { color: '#fff', fontSize: 16, fontWeight: '700' },
  summaryValueTotal: { color: '#4CAF50', fontSize: 18, fontWeight: '700' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  promoteBtn: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  promoteBtnDisabled: { backgroundColor: '#333' },
  promoteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
