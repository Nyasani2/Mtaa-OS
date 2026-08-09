import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const REG_CARDS = [
  {
    type: 'school',
    title: 'School Registration',
    subtitle: 'Register your institution as a head teacher or administrator.',
    icon: 'business',
    colors: ['#FF6B35', '#F7931E'] as const,
    features: ['Institution Profile', 'Head Teacher KYC', 'Capacity & Programs'],
  },
  {
    type: 'student',
    title: 'Student Enrollment',
    subtitle: 'Enroll as a student and link to your school.',
    icon: 'school',
    colors: ['#3B82F6', '#2563EB'] as const,
    features: ['Personal Profile', 'School Assignment', 'Guardian Link'],
  },
  {
    type: 'parent',
    title: 'Parent Registration',
    subtitle: 'Register as a parent and connect to your children.',
    icon: 'people',
    colors: ['#10B981', '#059669'] as const,
    features: ['Personal Details', 'Child Linking', 'Verification'],
  },
  {
    type: 'teacher',
    title: 'Teacher Onboarding',
    subtitle: 'Join a school as a qualified educator.',
    icon: 'person',
    colors: ['#8B5CF6', '#7C3AED'] as const,
    features: ['Professional Profile', 'School Assignment', 'Qualifications'],
  },
];

export default function RegistrationHub() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const navigateToForm = (type: string) => {
    router.push(`/register/${type}` as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration Hub</Text>
        <Text style={styles.headerSubtitle}>Choose your path to join the MTAA Education network</Text>

        {isAuthenticated && user && (
          <View style={styles.authBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={styles.authBadgeText}>Signed in as {user.email}</Text>
          </View>
        )}
        {!isAuthenticated && (
          <View style={styles.authBadge}>
            <Ionicons name="alert-circle" size={14} color="#FBBF24" />
            <Text style={styles.authBadgeText}>Sign in to pre-fill your details</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.cardsContainer}>
          {REG_CARDS.map((card) => (
            <TouchableOpacity
              key={card.type}
              style={styles.card}
              onPress={() => navigateToForm(card.type)}
              activeOpacity={0.88}
            >
              <LinearGradient colors={card.colors} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.cardTop}>
                  <View style={styles.cardIconWrap}>
                    <Ionicons name={card.icon as any} size={28} color="#fff" />
                  </View>
                  <View style={styles.cardArrow}>
                    <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
                  </View>
                </View>

                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>

                <View style={styles.cardFeatures}>
                  {card.features.map((feat, idx) => (
                    <View key={idx} style={styles.featurePill}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                      <Text style={styles.featurePillText}>{feat}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Already have an MTAA account? Your profile data will be used to pre-fill registration forms automatically.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { marginBottom: 16, width: 40 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  headerSubtitle: { color: '#C7D2FE', fontSize: 15, lineHeight: 22 },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authBadgeText: { color: '#E0E7FF', fontSize: 13, fontWeight: '500' },
  scroll: { flex: 1 },
  cardsContainer: { padding: 16, gap: 14 },
  card: { borderRadius: 20, overflow: 'hidden' },
  cardGradient: { padding: 22 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  cardSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  cardFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featurePillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginBottom: 30,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: { flex: 1, color: '#1E40AF', fontSize: 13, lineHeight: 20, fontWeight: '500' },
});
