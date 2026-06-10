import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Vibration,
  Animated, ActivityIndicator, Linking, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Phone, MapPin, AlertTriangle, Heart, Shield, Navigation,
  ChevronLeft, Activity, Users, Clock
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/state/auth.store';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

export default function EmergencySOSScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'sending' | 'dispatched' | 'arriving'>('idle');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const getLocation = async () => {
    setLocation({ lat: -1.2921, lng: 36.8219 });
  };

  const triggerSOS = async () => {
    if (sosActive) return;
    setSosActive(true);
    setCountdown(5);
    Vibration.vibrate([500, 500, 500]);

    let count = 5;
    countdownRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        executeSOS();
      }
    }, 1000);
  };

  const cancelSOS = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSosActive(false);
    setCountdown(5);
    setDispatchStatus('idle');
  };

  const executeSOS = async () => {
    setDispatchStatus('sending');
    await getLocation();

    try {
      const { data, error } = await supabase.functions.invoke('health-emergency-sos', {
        body: {
          caller_profile_id: profile?.id,
          gps_location: location ? `POINT(${location.lng} ${location.lat})` : null,
          address: 'Auto-detected location',
          incident_description: 'Emergency SOS triggered via MTAA Health OS',
          priority: 'critical'
        }
      });

      if (error) throw error;

      setDispatchStatus('dispatched');
      Vibration.vibrate([200, 100, 200, 100, 500]);

      setTimeout(() => {
        Linking.openURL('tel:999');
      }, 1500);

    } catch (err) {
      console.error('SOS failed:', err);
      Alert.alert(
        'Dispatch Failed',
        'Could not reach emergency services. Call 999 directly.',
        [{ text: 'Call 999', onPress: () => Linking.openURL('tel:999') },
         { text: 'Cancel', style: 'cancel' }]
      );
      setDispatchStatus('idle');
      setSosActive(false);
    }
  };

  const callEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const emergencyContacts = [
    { number: '999', label: 'Police/Ambulance', icon: Shield, color: '#F44336' },
    { number: '112', label: 'Universal Emergency', icon: Phone, color: '#2196F3' },
    { number: '719', label: 'Kenya Red Cross', icon: Heart, color: '#E91E63' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {dispatchStatus !== 'idle' && (
          <View style={[
            styles.statusBanner,
            dispatchStatus === 'sending' && { backgroundColor: '#FF9800' },
            dispatchStatus === 'dispatched' && { backgroundColor: '#4CAF50' },
          ]}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.statusText}>
              {dispatchStatus === 'sending' && 'Sending emergency alert...'}
              {dispatchStatus === 'dispatched' && 'Help is on the way!'}
              {dispatchStatus === 'arriving' && 'Ambulance arriving soon'}
            </Text>
          </View>
        )}

        <View style={styles.sosContainer}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <TouchableOpacity
            style={[
              styles.sosButton,
              sosActive && styles.sosButtonActive,
              dispatchStatus === 'dispatched' && styles.sosButtonDispatched
            ]}
            onPress={triggerSOS}
            activeOpacity={0.8}
          >
            {sosActive && countdown > 0 ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
                <Text style={styles.countdownLabel}>Tap to cancel</Text>
              </View>
            ) : dispatchStatus === 'dispatched' ? (
              <View style={styles.dispatchedContainer}>
                <Shield size={40} color="#fff" />
                <Text style={styles.dispatchedText}>DISPATCHED</Text>
              </View>
            ) : (
              <View style={styles.sosInner}>
                <AlertTriangle size={36} color="#fff" />
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosSubtext}>Press & Hold</Text>
              </View>
            )}
          </TouchableOpacity>

          {sosActive && countdown > 0 && (
            <TouchableOpacity style={styles.cancelButton} onPress={cancelSOS}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#F44336', fontSize: 14, fontWeight: '700' }}>X</Text>
              </View>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.locationCard}>
          <MapPin size={18} color={Colors.primary} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Your Location</Text>
            <Text style={styles.locationValue}>
              {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting...'}
            </Text>
          </View>
          <TouchableOpacity onPress={getLocation}>
            <Navigation size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Emergency Numbers</Text>
        <View style={styles.numbersGrid}>
          {emergencyContacts.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.numberCard, { borderLeftColor: contact.color, borderLeftWidth: 4 }]}
              onPress={() => callEmergency(contact.number)}
            >
              <contact.icon size={22} color={contact.color} />
              <View style={styles.numberInfo}>
                <Text style={styles.numberLabel}>{contact.label}</Text>
                <Text style={styles.numberValue}>{contact.number}</Text>
              </View>
              <Phone size={18} color={contact.color} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Activity size={16} color="#666" />
            <Text style={styles.infoText}>GPS will be shared with dispatch</Text>
          </View>
          <View style={styles.infoRow}>
            <Users size={16} color="#666" />
            <Text style={styles.infoText}>Emergency contacts will be notified</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color="#666" />
            <Text style={styles.infoText}>Average response: 8-15 minutes</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 16
  },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sosContainer: {
    alignItems: 'center', justifyContent: 'center',
    marginVertical: 24, height: 240
  },
  pulseRing: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(244, 67, 54, 0.15)'
  },
  sosButton: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#F44336', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10
  },
  sosButtonActive: { backgroundColor: '#D32F2F' },
  sosButtonDispatched: { backgroundColor: '#4CAF50' },
  sosInner: { alignItems: 'center' },
  sosText: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 4 },
  sosSubtext: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  countdownContainer: { alignItems: 'center' },
  countdownNumber: { fontSize: 48, fontWeight: '800', color: '#fff' },
  countdownLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  dispatchedContainer: { alignItems: 'center' },
  dispatchedText: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 8 },
  cancelButton: {
    position: 'absolute', bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20
  },
  cancelText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)', padding: 14,
    borderRadius: 12, marginBottom: 20
  },
  locationText: { flex: 1 },
  locationLabel: { fontSize: 12, color: '#888' },
  locationValue: { fontSize: 14, color: '#fff', fontWeight: '500', marginTop: 2 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#fff',
    marginBottom: 10, marginTop: 4
  },
  numbersGrid: { gap: 8, marginBottom: 20 },
  numberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)', padding: 14,
    borderRadius: 10
  },
  numberInfo: { flex: 1 },
  numberLabel: { fontSize: 12, color: '#888' },
  numberValue: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 1 },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    padding: 14, gap: 10
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 12, color: '#aaa', flex: 1 }
});
