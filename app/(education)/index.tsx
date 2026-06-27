import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  GraduationCap,
  School,
  Users,
  BookOpen,
  MessageSquare,
  CreditCard,
  ChevronRight,
  Bell,
} from 'lucide-react-native';

const EDU_CARDS = [
  {
    key: 'feed',
    label: 'Education Feed',
    subtitle: 'News, announcements & updates',
    icon: BookOpen,
    color: '#4F46E5',
    bg: '#EEF2FF',
    route: '/(education)/feed',
  },
  {
    key: 'schools',
    label: 'Schools & Institutions',
    subtitle: 'Browse ECD to University',
    icon: School,
    color: '#059669',
    bg: '#ECFDF5',
    route: '/(education)/schools',
  },
  {
    key: 'teachers',
    label: 'Teachers',
    subtitle: 'Directory & profiles',
    icon: Users,
    color: '#D97706',
    bg: '#FFFBEB',
    route: '/(education)/teachers',
  },
  {
    key: 'payroll',
    label: 'Payroll & Finance',
    subtitle: 'Salaries, fees & payments',
    icon: CreditCard,
    color: '#DC2626',
    bg: '#FEF2F2',
    route: '/(education)/payroll',
  },
  {
    key: 'messages',
    label: 'Messages',
    subtitle: 'Chat with teachers & staff',
    icon: MessageSquare,
    color: '#7C3AED',
    bg: '#F5F3FF',
    route: '/(education)/messages',
  },
];

export default function EducationHub() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <GraduationCap size={28} color="#4F46E5" />
          <Text style={styles.headerTitle}>Education</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn}>
          <Bell size={22} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Access schools, teachers, lessons, and educational resources across Kenya.
        </Text>

        {/* Cards */}
        {EDU_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <TouchableOpacity
              key={card.key}
              style={styles.card}
              onPress={() => router.push(card.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrap, { backgroundColor: card.bg }]}>
                <Icon size={24} color={card.color} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>{card.label}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          );
        })}

        {/* Footer spacer */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  bellBtn: { padding: 6, borderRadius: 10, backgroundColor: '#F3F4F6' },
  scroll: { padding: 20 },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, marginLeft: 14 },
  cardLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
});
