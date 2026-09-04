// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CAPABILITY_PILLARS = [
  {
    id: 'student-family',
    title: 'Student & Family',
    subtitle: 'Enrollment, grades, attendance, and communication in one place.',
    color: ['#FF6B35', '#F7931E'],
    icon: 'people',
    features: ['Student Enrollment', 'Parent Portal', 'Grade Tracking', 'Attendance Alerts'],
  },
  {
    id: 'teaching-learning',
    title: 'Teaching & Learning',
    subtitle: 'Lesson plans, assignments, assessments, and progress tracking.',
    color: ['#10B981', '#059669'],
    icon: 'school',
    features: ['Lesson Planning', 'Assignment Management', 'Online Assessments', 'Progress Reports'],
  },
  {
    id: 'institution-ops',
    title: 'Institution & Operations',
    subtitle: 'Staff management, payroll, facilities, and compliance reporting.',
    color: ['#8B5CF6', '#7C3AED'],
    icon: 'business',
    features: ['Staff Directory', 'Payroll Integration', 'Facility Booking', 'Compliance Reports'],
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Register Your School',
    desc: 'Head teachers register their institution in minutes. Verify identity, set capacity, and configure programs.',
  },
  {
    step: '02',
    title: 'Enroll Students & Staff',
    desc: 'Add students, parents, and teachers. Each gets a secure MTAA identity with role-based access.',
  },
  {
    step: '03',
    title: 'Teach, Track, Thrive',
    desc: 'Manage lessons, track grades, communicate with families, and run your institution from one dashboard.',
  },
];

const CONNECTED_APPS = [
  { name: 'Wallet', icon: 'wallet', color: '#F59E0B', desc: 'Fee payments & stipends' },
  { name: 'Health', icon: 'medical', color: '#EF4444', desc: 'Student health records' },
  { name: 'Messenger', icon: 'chatbubbles', color: '#3B82F6', desc: 'Parent-teacher chat' },
  { name: 'Tribes', icon: 'globe', color: '#10B981', desc: 'School communities' },
];

const STATS = [
  { value: '200+', label: 'Schools' },
  { value: '50K+', label: 'Students' },
  { value: '12', label: 'Countries' },
  { value: '4.9', label: 'Rating' },
];

const PULSE_ITEMS = [
  { tag: 'New Feature', tagColor: '#10B981', title: 'AI-Powered Lesson Planner', time: '2h ago' },
  { tag: 'Update', tagColor: '#3B82F6', title: 'Report Cards Now Export to PDF', time: '5h ago' },
  { tag: 'Event', tagColor: '#F59E0B', title: 'Annual Education Summit — Nairobi', time: '1d ago' },
];

export default function EducationLandingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const navigateToRegister = (type?: string) => {
    if (type) {
      router.push(`/register/${type}` as any as any);
    } else {
      router.push('/register' as any as any);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>MTAA Education</Text>
          <TouchableOpacity onPress={() => router.push('/register' as any as any)}>
            <Text style={styles.headerCta}>Get Started</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <LinearGradient colors={['#1E1B4B', '#312E81', '#4338CA']} style={styles.hero}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.heroBadge}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.heroBadgeText}>Trusted by 200+ Schools</Text>
            </View>

            <Text style={styles.heroTitle}>Education That Connects Every Learner</Text>
            <Text style={styles.heroSubtitle}>
              The complete school management platform built on MTAA. Enroll, teach, track, and grow — all in one connected ecosystem.
            </Text>

            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => navigateToRegister()}>
                <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.heroBtnPrimaryGradient}>
                  <Text style={styles.heroBtnPrimaryText}>Start Registration</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.heroBtnSecondary} onPress={() => {}}>
                <Text style={styles.heroBtnSecondaryText}>Watch Demo</Text>
              </TouchableOpacity>
            </View>

            {isAuthenticated && user && (
              <View style={styles.welcomeBack}>
                <Ionicons name="person-circle" size={18} color="#A5B4FC" />
                <Text style={styles.welcomeBackText}>Welcome back, {user.email?.split('@')[0] || 'Learner'}</Text>
              </View>
            )}
          </Animated.View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join the Campus</Text>
          <Text style={styles.sectionSubtitle}>Register as a school, student, parent, or teacher</Text>

          <View style={styles.regGrid}>
            {[
              { type: 'school', label: 'School', icon: 'business', colors: ['#FF6B35', '#F7931E'], desc: 'Register your institution' },
              { type: 'student', label: 'Student', icon: 'school', colors: ['#3B82F6', '#2563EB'], desc: 'Enroll in a school' },
              { type: 'parent', label: 'Parent', icon: 'people', colors: ['#10B981', '#059669'], desc: 'Link to your child' },
              { type: 'teacher', label: 'Teacher', icon: 'person', colors: ['#8B5CF6', '#7C3AED'], desc: 'Join as educator' },
            ].map((card) => (
              <TouchableOpacity
                key={card.type}
                style={styles.regCard}
                onPress={() => navigateToRegister(card.type)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={card.colors} style={styles.regCardGradient}>
                  <Ionicons name={card.icon as any} size={28} color="#fff" />
                  <Text style={styles.regCardLabel}>{card.label}</Text>
                  <Text style={styles.regCardDesc}>{card.desc}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: '#F8FAFC' }]}>
          <Text style={styles.sectionTitle}>Built for Every Role</Text>
          <Text style={styles.sectionSubtitle}>Three powerful pillars that run your entire institution</Text>

          {CAPABILITY_PILLARS.map((pillar) => (
            <TouchableOpacity
              key={pillar.id}
              style={styles.pillarCard}
              onPress={() => setActivePillar(activePillar === pillar.id ? null : pillar.id)}
              activeOpacity={0.9}
            >
              <LinearGradient colors={pillar.color} style={styles.pillarHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={styles.pillarIconWrap}>
                  <Ionicons name={pillar.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.pillarTextWrap}>
                  <Text style={styles.pillarTitle}>{pillar.title}</Text>
                  <Text style={styles.pillarSubtitle}>{pillar.subtitle}</Text>
                </View>
                <Ionicons
                  name={activePillar === pillar.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#fff"
                />
              </LinearGradient>

              {activePillar === pillar.id && (
                <View style={styles.pillarBody}>
                  {pillar.features.map((feat, idx) => (
                    <View key={idx} style={styles.pillarFeature}>
                      <Ionicons name="checkmark-circle" size={18} color={pillar.color[0]} />
                      <Text style={styles.pillarFeatureText}>{feat}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSubtitle}>From registration to results in three simple steps</Text>

          <View style={styles.howItWorksContainer}>
            {HOW_IT_WORKS.map((item, idx) => (
              <View key={idx} style={styles.howStep}>
                <View style={styles.howStepNumber}>
                  <Text style={styles.howStepNumberText}>{item.step}</Text>
                </View>
                <View style={styles.howStepContent}>
                  <Text style={styles.howStepTitle}>{item.title}</Text>
                  <Text style={styles.howStepDesc}>{item.desc}</Text>
                </View>
                {idx < HOW_IT_WORKS.length - 1 && <View style={styles.howConnector} />}
              </View>
            ))}
          </View>
        </View>

        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.connectedSection}>
          <Text style={[styles.sectionTitle, { color: '#fff' }]}>Connected Campus</Text>
          <Text style={[styles.sectionSubtitle, { color: '#94A3B8' }]}>Education works better when everything is connected</Text>

          <View style={styles.connectedGrid}>
            {CONNECTED_APPS.map((app) => (
              <View key={app.name} style={styles.connectedCard}>
                <View style={[styles.connectedIcon, { backgroundColor: app.color + '20' }]}>
                  <Ionicons name={app.icon as any} size={24} color={app.color} />
                </View>
                <Text style={styles.connectedName}>{app.name}</Text>
                <Text style={styles.connectedDesc}>{app.desc}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            {STATS.map((stat, idx) => (
              <View key={idx} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: '#F8FAFC', paddingBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Education Pulse</Text>
          <Text style={styles.sectionSubtitle}>Latest updates from the MTAA Education network</Text>

          {PULSE_ITEMS.map((item, idx) => (
            <View key={idx} style={styles.pulseCard}>
              <View style={[styles.pulseTag, { backgroundColor: item.tagColor + '15' }]}>
                <Text style={[styles.pulseTagText, { color: item.tagColor }]}>{item.tag}</Text>
              </View>
              <Text style={styles.pulseTitle}>{item.title}</Text>
              <Text style={styles.pulseTime}>{item.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...Platform.select({ ios: { paddingTop: 50 }, android: { paddingTop: 40 } }),
  },
  headerGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerCta: { color: '#FBBF24', fontSize: 14, fontWeight: '600' },

  hero: {
    paddingHorizontal: 24,
    paddingTop: Platform.select({ ios: 100, android: 80 }),
    paddingBottom: 60,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
    gap: 6,
  },
  heroBadgeText: { color: '#FDE68A', fontSize: 13, fontWeight: '600' },
  heroTitle: { color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 42, marginBottom: 14 },
  heroSubtitle: { color: '#C7D2FE', fontSize: 16, lineHeight: 24, marginBottom: 28 },
  heroButtons: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  heroBtnPrimary: { borderRadius: 14, overflow: 'hidden', flex: 1 },
  heroBtnPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  heroBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  heroBtnSecondary: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  heroBtnSecondaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  welcomeBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  welcomeBackText: { color: '#A5B4FC', fontSize: 14, fontWeight: '500' },

  section: { paddingHorizontal: 20, paddingVertical: 36 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  sectionSubtitle: { fontSize: 15, color: '#64748B', marginBottom: 24, lineHeight: 22 },

  regGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  regCard: { width: (width - 52) / 2, borderRadius: 16, overflow: 'hidden' },
  regCardGradient: { padding: 18, alignItems: 'center', minHeight: 140, justifyContent: 'center' },
  regCardLabel: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 10 },
  regCardDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4, textAlign: 'center' },

  pillarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  pillarIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTextWrap: { flex: 1 },
  pillarTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  pillarSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  pillarBody: { padding: 18, paddingTop: 8 },
  pillarFeature: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pillarFeatureText: { fontSize: 14, color: '#334155', fontWeight: '500' },

  howItWorksContainer: { marginTop: 8 },
  howStep: { flexDirection: 'row', marginBottom: 24 },
  howStepNumber: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  howStepNumberText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  howStepContent: { flex: 1 },
  howStepTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  howStepDesc: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  howConnector: {
    position: 'absolute',
    left: 21,
    top: 48,
    width: 2,
    height: 32,
    backgroundColor: '#E2E8F0',
  },

  connectedSection: { paddingHorizontal: 20, paddingVertical: 40 },
  connectedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  connectedCard: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  connectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  connectedName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  connectedDesc: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },

  statsSection: { backgroundColor: '#1E1B4B', paddingVertical: 28 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 26, fontWeight: '800' },
  statLabel: { color: '#A5B4FC', fontSize: 13, marginTop: 4, fontWeight: '500' },

  pulseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  pulseTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  pulseTagText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  pulseTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  pulseTime: { fontSize: 12, color: '#94A3B8' },
});
