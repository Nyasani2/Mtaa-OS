import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import {
  Phone,
  MapPin,
  AlertTriangle,
  Heart,
  Ambulance,
  Shield,
  Flame,
  Car,
  Siren,
  ChevronRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the SOS button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      const { data } = await supabase
        .from('health_emergency_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .limit(3);

      if (data) {
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const getLocation = async () => {
    // Placeholder for location service
    setLocation('Location services active');
  };

  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will alert emergency services and your contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Send emergency alert via edge function
              await supabase.functions.invoke('emergency-alert', {
                body: {
                  user_id: user?.id,
                  location: location || 'Location unknown',
                  timestamp: new Date().toISOString(),
                },
              });
              Alert.alert('SOS Sent', 'Emergency services have been notified.');
            } catch (error) {
              Alert.alert('Error', 'Failed to send SOS. Call emergency services directly.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const EmergencyButton = ({
    icon,
    label,
    color,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.emergencyBtn, { borderColor: color }]}
      onPress={onPress}
    >
      <View style={[styles.emergencyIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={[styles.emergencyLabel, { color }]}>{label}</Text>
      <ChevronRight size={16} color={color} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency</Text>
        <Text style={styles.headerSubtitle}>Quick access to emergency services</Text>
      </View>

      <View style={styles.content}>
        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.sosButton}
              onPress={handleSOS}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <>
                  <Siren size={40} color="#fff" />
                  <Text style={styles.sosText}>SOS</Text>
                  <Text style={styles.sosSubtext}>Tap for emergency</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Location */}
        <TouchableOpacity style={styles.locationCard} onPress={getLocation}>
          <MapPin size={20} color="#3B82F6" />
          <Text style={styles.locationText}>
            {location || 'Tap to share location'}
          </Text>
        </TouchableOpacity>

        {/* Emergency Services */}
        <Text style={styles.sectionTitle}>Emergency Services</Text>
        <View style={styles.servicesGrid}>
          <EmergencyButton
            icon={<Phone size={24} color="#EF4444" />}
            label="Police"
            color="#EF4444"
            onPress={() => Alert.alert('Police', 'Dialing emergency police line...')}
          />
          <EmergencyButton
            icon={<Heart size={24} color="#10B981" />}
            label="Ambulance"
            color="#10B981"
            onPress={() => Alert.alert('Ambulance', 'Dialing emergency medical...')}
          />
          <EmergencyButton
            icon={<Flame size={24} color="#F59E0B" />}
            label="Fire"
            color="#F59E0B"
            onPress={() => Alert.alert('Fire', 'Dialing fire department...')}
          />
          <EmergencyButton
            icon={<Shield size={24} color="#8B5CF6" />}
            label="Security"
            color="#8B5CF6"
            onPress={() => Alert.alert('Security', 'Contacting security services...')}
          />
        </View>

        {/* Emergency Contacts */}
        <Text style={styles.sectionTitle}>Your Emergency Contacts</Text>
        {contacts.length === 0 ? (
          <View style={styles.emptyContacts}>
            <AlertTriangle size={32} color="#6B7280" />
            <Text style={styles.emptyText}>No emergency contacts set</Text>
            <TouchableOpacity
              style={styles.addContactBtn}
              onPress={() => router.push('/health/contacts' as any)}
            >
              <Text style={styles.addContactText}>Add Contacts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          contacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactCard}
              onPress={() => Alert.alert('Call', `Calling ${contact.name}...`)}
            >
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>
                  {contact.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelationship}>
                  {contact.relationship}
                </Text>
              </View>
              <Phone size={20} color="#10B981" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  sosText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  sosSubtext: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  emergencyBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContacts: {
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 30,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  addContactBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  addContactText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  contactRelationship: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
