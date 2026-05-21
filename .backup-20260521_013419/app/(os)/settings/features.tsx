import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  is_beta: boolean;
  category: string;
}

export default function FeaturesScreen() {
  const { user } = useAuthStore();
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('user_id', user.id)
      .order('category');

    setLoading(false);

    if (error) {
      // Fallback defaults
      setFeatures([
        { id: 'ai_assistant', name: 'AI Assistant', description: 'Smart financial advisor and helper', is_enabled: true, is_beta: false, category: 'AI' },
        { id: 'dark_mode', name: 'Dark Mode', description: 'OLED-friendly dark theme', is_enabled: true, is_beta: false, category: 'UI' },
        { id: 'biometric', name: 'Biometric Auth', description: 'Face ID / fingerprint login', is_enabled: false, is_beta: false, category: 'Security' },
        { id: 'tribe_governance', name: 'Tribe Governance', description: 'DAO voting in tribes', is_enabled: false, is_beta: true, category: 'Tribes' },
        { id: 'nft_badges', name: 'NFT Badges', description: 'Collectible achievement badges', is_enabled: false, is_beta: true, category: 'Social' },
        { id: 'cross_border', name: 'Cross-Border', description: 'Send money across Africa', is_enabled: false, is_beta: true, category: 'Payments' },
      ]);
      return;
    }

    if (data) {
      setFeatures(data.map((f: any) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        is_enabled: f.is_enabled !== false,
        is_beta: f.is_beta || false,
        category: f.category || 'General',
      })));
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('feature_flags')
      .update({ is_enabled: !current })
      .eq('id', id)
      .eq('user_id', user?.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setFeatures(features.map(f => f.id === id ? { ...f, is_enabled: !current } : f));
    }
  };

  const categories = [...new Set(features.map(f => f.category))];

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Feature Flags</Text>
      <Text style={styles.subtitle}>Experimental and beta features</Text>

      {categories.map(cat => (
        <View key={cat} style={styles.section}>
          <Text style={styles.sectionTitle}>{cat}</Text>
          {features.filter(f => f.category === cat).map(feature => (
            <View key={feature.id} style={styles.featureRow}>
              <View style={styles.featureInfo}>
                <View style={styles.featureHeader}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  {feature.is_beta && (
                    <View style={styles.betaBadge}>
                      <Text style={styles.betaText}>BETA</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
              <Switch
                value={feature.is_enabled}
                onValueChange={() => handleToggle(feature.id, feature.is_enabled)}
                trackColor={{ false: '#333', true: '#6366f1' }}
                thumbColor={feature.is_enabled ? '#fff' : '#888'}
              />
            </View>
          ))}
        </View>
      ))}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  featureInfo: { flex: 1, marginRight: 12 },
  featureHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  featureName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  betaBadge: {
    backgroundColor: '#f59e0b20',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  betaText: { color: '#f59e0b', fontSize: 9, fontWeight: 'bold' },
  featureDesc: { color: '#888', fontSize: 12 },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
