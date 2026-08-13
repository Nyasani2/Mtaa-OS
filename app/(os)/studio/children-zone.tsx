import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, TextInput, Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

// Children's content categories
const CATEGORIES = [
  { id: 'learning', name: 'Learning', icon: 'book', color: '#10b981' },
  { id: 'stories', name: 'Stories', icon: 'book-open', color: '#f59e0b' },
  { id: 'music', name: 'Music', icon: 'music', color: '#ec4899' },
  { id: 'games', name: 'Games', icon: 'grid', color: '#6366f1' },
  { id: 'art', name: 'Art', icon: 'image', color: '#8b5cf6' },
  { id: 'science', name: 'Science', icon: 'sun', color: '#06b6d4' },
];

const VIDEOS = [
  { id: '1', title: 'ABC Song', duration: '3:24', type: 'learning' },
  { id: '2', title: 'Counting 1-100', duration: '5:12', type: 'learning' },
  { id: '3', title: 'The Lion and the Mouse', duration: '8:45', type: 'stories' },
  { id: '4', title: 'African Folk Tales', duration: '12:30', type: 'stories' },
  { id: '5', title: 'Kids Worship Songs', duration: '15:00', type: 'music' },
  { id: '6', title: 'Learn Shapes', duration: '4:18', type: 'learning' },
  { id: '7', title: 'Colors of Africa', duration: '6:22', type: 'art' },
  { id: '8', title: 'Space for Kids', duration: '10:15', type: 'science' },
];

const GAMES = [
  { id: '1', name: 'Math Challenge', desc: 'Practice addition and subtraction', level: 'Easy' },
  { id: '2', name: 'Word Builder', desc: 'Learn new words every day', level: 'Medium' },
  { id: '3', name: 'Shape Matcher', desc: 'Match shapes and colors', level: 'Easy' },
  { id: '4', name: 'Memory Game', desc: 'Test your memory skills', level: 'Medium' },
  { id: '5', name: 'Science Quiz', desc: 'Fun facts about nature', level: 'Hard' },
];

export default function ChildrenZoneScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [parentPin, setParentPin] = useState('1234'); // In production, fetch from secure storage
  const [activeCategory, setActiveCategory] = useState('learning');
  const [screenTime, setScreenTime] = useState(0); // minutes
  const [timeLimit, setTimeLimit] = useState(60); // minutes
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Screen time tracking
  useEffect(() => {
    if (!isLocked) {
      timerRef.current = setInterval(() => {
        setScreenTime(prev => {
          const next = prev + 1;
          if (next >= timeLimit - 5 && !showTimeWarning) {
            setShowTimeWarning(true);
          }
          if (next >= timeLimit) {
            setIsLocked(true);
            setPinInput('');
            Alert.alert('Time\'s Up!', 'Your screen time limit has been reached. Ask a parent to unlock.');
          }
          return next;
        });
      }, 60000); // Every minute
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLocked, timeLimit, showTimeWarning]);

  // Lock when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        setIsLocked(true);
        setPinInput('');
      }
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  const unlock = () => {
    if (pinInput === parentPin) {
      setIsLocked(false);
      setPinInput('');
      setScreenTime(0);
      setShowTimeWarning(false);
    } else {
      Alert.alert('Wrong PIN', 'Please enter the correct parent PIN.');
      setPinInput('');
    }
  };

  const lockNow = () => {
    setIsLocked(true);
    setPinInput('');
    setScreenTime(0);
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // PIN Lock Screen
  if (isLocked) {
    return (
      <SafeAreaView style={styles.lockContainer}>
        <View style={styles.lockContent}>
          <View style={styles.lockIcon}>
            <Feather name="shield" size={48} color="#6366f1" />
          </View>
          <Text style={styles.lockTitle}>Children's Zone</Text>
          <Text style={styles.lockSub}>Safe, educational, and fun content for kids</Text>

          <View style={styles.pinBox}>
            <Text style={styles.pinLabel}>Enter Parent PIN to Unlock</Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="****"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              onSubmitEditing={unlock}
            />
            <TouchableOpacity style={styles.unlockBtn} onPress={unlock}>
              <Text style={styles.unlockText}>Unlock</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.lockHint}>Parents: Set your PIN in Settings {'>'} Family Controls</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredVideos = VIDEOS.filter((v: any) => v.type === activeCategory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.kidsBadge}>
            <Feather name="smile" size={14} color="#fff" />
            <Text style={styles.kidsBadgeText}>KIDS</Text>
          </View>
          <Text style={styles.headerTitle}>MStudio Kids</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Screen time indicator */}
          <View style={styles.timeIndicator}>
            <Feather name="clock" size={14} color={screenTime > timeLimit * 0.8 ? '#ef4444' : '#10b981'} />
            <Text style={[styles.timeText, screenTime > timeLimit * 0.8 && styles.timeTextWarning]}>
              {formatTime(timeLimit - screenTime)} left
            </Text>
          </View>
          <TouchableOpacity style={styles.lockBtn} onPress={lockNow}>
            <Feather name="lock" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Warning */}
      {showTimeWarning && (
        <View style={styles.timeWarning}>
          <Feather name="alert-triangle" size={16} color="#f59e0b" />
          <Text style={styles.timeWarningText}>Only {formatTime(timeLimit - screenTime)} of screen time remaining!</Text>
        </View>
      )}

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat: any) => (
          <TouchableOpacity key={cat.id} onPress={() => setActiveCategory(cat.id)} style={[styles.categoryBtn, activeCategory === cat.id && styles.categoryBtnActive]}>
            <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}22` }]}>
              <Feather name={cat.icon as any} size={18} color={cat.color} />
            </View>
            <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Featured Banner */}
        <View style={styles.featuredBanner}>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredLabel}>FEATURED</Text>
            <Text style={styles.featuredTitle}>African Animals Adventure</Text>
            <Text style={styles.featuredDesc}>Learn about lions, elephants, and giraffes!</Text>
            <TouchableOpacity style={styles.featuredBtn}>
              <Text style={styles.featuredBtnText}>Watch Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Videos Grid */}
        {activeCategory !== 'games' ? (
          <>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <View style={styles.videoGrid}>
              {filteredVideos.map((video: any) => (
                <TouchableOpacity key={video.id} style={styles.videoCard}>
                  <View style={styles.videoThumb}>
                    <Feather name="play-circle" size={32} color="#fff" />
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{video.duration}</Text>
                    </View>
                  </View>
                  <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Learning Games</Text>
            {GAMES.map((game: any) => (
              <TouchableOpacity key={game.id} style={styles.gameCard}>
                <View style={[styles.gameIcon, { backgroundColor: game.level === 'Easy' ? '#10b98122' : game.level === 'Medium' ? '#f59e0b22' : '#ef444422' }]}>
                  <Feather name="grid" size={24} color={game.level === 'Easy' ? '#10b981' : game.level === 'Medium' ? '#f59e0b' : '#ef4444'} />
                </View>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameDesc}>{game.desc}</Text>
                  <View style={[styles.levelBadge, game.level === 'Easy' && styles.levelEasy, game.level === 'Medium' && styles.levelMedium, game.level === 'Hard' && styles.levelHard]}>
                    <Text style={styles.levelText}>{game.level}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Teacher-Approved Section */}
        <Text style={styles.sectionTitle}>Teacher Approved</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.approvedScroll}>
          {[
            { title: 'Swahili Basics', teacher: 'Ms. Amina', subject: 'Languages' },
            { title: 'African Geography', teacher: 'Mr. Osei', subject: 'Geography' },
            { title: 'Traditional Music', teacher: 'Prof. Kofi', subject: 'Music' },
            { title: 'Solar System', teacher: 'Dr. Nia', subject: 'Science' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.approvedCard}>
              <View style={styles.approvedThumb}>
                <Feather name="check-circle" size={24} color="#10b981" />
              </View>
              <Text style={styles.approvedTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.approvedTeacher}>{item.teacher}</Text>
              <View style={styles.approvedBadge}>
                <Text style={styles.approvedBadgeText}>{item.subject}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Lock Screen
  lockContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  lockContent: { alignItems: 'center', padding: 32 },
  lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center' },
  lockTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 20 },
  lockSub: { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 8 },
  pinBox: { width: '100%', marginTop: 32 },
  pinLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase' },
  pinInput: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16, color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 8 },
  unlockBtn: { backgroundColor: '#6366f1', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  unlockText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lockHint: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 20 },

  // Main
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kidsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6366f1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  kidsBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  headerTitle: { color: '#1e293b', fontSize: 18, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  timeText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  timeTextWarning: { color: '#ef4444' },
  lockBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },

  timeWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', paddingHorizontal: 16, paddingVertical: 8 },
  timeWarningText: { color: '#92400e', fontSize: 13, fontWeight: '600' },

  categoryScroll: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  categoryBtn: { alignItems: 'center', marginRight: 16, opacity: 0.6 },
  categoryBtnActive: { opacity: 1 },
  categoryIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  categoryText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#1e293b', fontWeight: '700' },

  content: { flex: 1, padding: 16 },

  featuredBanner: { backgroundColor: '#6366f1', borderRadius: 16, padding: 20, marginBottom: 20 },
  featuredContent: { maxWidth: '70%' },
  featuredLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  featuredTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  featuredDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  featuredBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 12 },
  featuredBtnText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },

  sectionTitle: { color: '#1e293b', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },

  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  videoCard: { width: '47%', marginBottom: 12 },
  videoThumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#1e293b', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  durationBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  videoTitle: { color: '#1e293b', fontSize: 13, fontWeight: '600', marginTop: 8 },

  gameCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  gameIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gameInfo: { flex: 1 },
  gameName: { color: '#1e293b', fontSize: 15, fontWeight: '700' },
  gameDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
  levelBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 6 },
  levelEasy: { backgroundColor: '#d1fae5' },
  levelMedium: { backgroundColor: '#fef3c7' },
  levelHard: { backgroundColor: '#fee2e2' },
  levelText: { fontSize: 10, fontWeight: '700' },

  approvedScroll: { marginBottom: 20 },
  approvedCard: { width: 140, marginRight: 12 },
  approvedThumb: { width: 140, height: 100, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  approvedTitle: { color: '#1e293b', fontSize: 13, fontWeight: '600', marginTop: 8 },
  approvedTeacher: { color: '#6366f1', fontSize: 11, marginTop: 2 },
  approvedBadge: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  approvedBadgeText: { color: '#6366f1', fontSize: 9, fontWeight: '700' },
});
