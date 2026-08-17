import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreditHubScreen() {
  const router = useRouter();
  const [creditScore, setCreditScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCreditScore(650);
      setLoading(false);
    }, 1000);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 800) return '#00D68F';
    if (score >= 600) return '#FFD700';
    if (score >= 400) return '#FF8C00';
    return '#FF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 800) return 'Excellent';
    if (score >= 600) return 'Good';
    if (score >= 400) return 'Fair';
    return 'Building';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Credit Score</Text>
      </View>

      <View style={styles.scoreCard}>
        <View style={[styles.scoreCircle, { borderColor: getScoreColor(creditScore) }]}>
          <Text style={[styles.scoreNumber, { color: getScoreColor(creditScore) }]}>
            {loading ? '...' : creditScore}
          </Text>
          <Text style={styles.scoreLabel}>{loading ? 'Calculating...' : getScoreLabel(creditScore)}</Text>
        </View>

        {!loading && (
          <View style={styles.scoreDetails}>
            <Text style={styles.limitText}>Suggested Limit: KSh {(creditScore * 100).toLocaleString()}</Text>
            <Text style={styles.eligibilityText}>
              {creditScore >= 600 ? 'Eligible for MTAA Advance' : 'Keep building your score'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.factorsList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Score Factors</Text>

        {[
          { name: 'Wallet Age', score: 180, max: 200, icon: '📅' },
          { name: 'Transaction Volume', score: 120, max: 250, icon: '💸' },
          { name: 'Transaction Count', score: 80, max: 150, icon: '📊' },
          { name: 'Savings Balance', score: 45, max: 100, icon: '💰' },
          { name: 'Escrow Completion', score: 75, max: 100, icon: '🛡️' },
          { name: 'Community Trust', score: 150, max: 200, icon: '🤝' },
        ].map((factor) => (
          <View key={factor.name} style={styles.factorItem}>
            <Text style={styles.factorIcon}>{factor.icon}</Text>
            <View style={styles.factorContent}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorName}>{factor.name}</Text>
                <Text style={styles.factorScore}>{factor.score}/{factor.max}</Text>
              </View>
              <View style={styles.factorBar}>
                <View style={[styles.factorFill, { width: `${(factor.score / factor.max) * 100}%` }]} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.advanceButton, creditScore < 600 && styles.advanceButtonDisabled]}
          onPress={() => router.push('/(os)/wallet/advance')}
          disabled={creditScore < 600}
        >
          <Text style={styles.advanceButtonText}>
            {creditScore >= 600 ? 'Request MTAA Advance' : 'Build Score to Unlock Advance'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  scoreCard: { alignItems: 'center', paddingVertical: 32 },
  scoreCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  scoreNumber: { fontSize: 48, fontWeight: '800' },
  scoreLabel: { fontSize: 16, color: '#888888', marginTop: 4 },
  scoreDetails: { alignItems: 'center' },
  limitText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  eligibilityText: { color: '#00D68F', fontSize: 14 },
  factorsList: { flex: 1, paddingHorizontal: 24 },
  sectionTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  factorItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  factorIcon: { fontSize: 24, marginRight: 12 },
  factorContent: { flex: 1 },
  factorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  factorName: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  factorScore: { color: '#888888', fontSize: 14 },
  factorBar: { height: 6, backgroundColor: '#333333', borderRadius: 3 },
  factorFill: { height: 6, backgroundColor: '#00D68F', borderRadius: 3 },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  advanceButton: { backgroundColor: '#00D68F', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  advanceButtonDisabled: { backgroundColor: '#333333' },
  advanceButtonText: { color: '#0A0A0A', fontSize: 16, fontWeight: '700' },
});

