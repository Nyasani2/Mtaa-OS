import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

const BUSINESS_TYPES = [
  { id: 'retail', label: 'Retail Store', icon: '🏪' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'hardware', label: 'Hardware', icon: '🔧' },
  { id: 'supermarket', label: 'Supermarket', icon: '🛒' },
  { id: 'service', label: 'Service Provider', icon: '🔧' },
  { id: 'manufacturer', label: 'Manufacturer', icon: '🏭' },
  { id: 'distributor', label: 'Distributor', icon: '📦' },
  { id: 'other', label: 'Other', icon: '🏢' },
];

interface FormData {
  name: string;
  category: string;
  address: string;
  description: string;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

export default function ShopCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'retail',
    address: '',
    description: '',
  });

  const handleCreate = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create a business');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    setLoading(true);

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        Alert.alert('Error', 'Authentication error. Please log in again.');
        setLoading(false);
        return;
      }

      const ownerId = userData.user.id;
      const slug = generateSlug(formData.name);

      const settings = {
        qr_payload: `mtaa://shop/${slug}`,
        created_via: 'app',
      };

      const { data: shop, error } = await supabase
        .from('shops')
        .insert({
          name: formData.name.trim(),
          slug,
          category: formData.category,
          description: formData.description?.trim() || null,
          address: formData.address?.trim() || null,
          owner_id: ownerId,
          settings,
        })
        .select()
        .single();

      if (error) {
        console.error('[ShopCreate] Supabase error:', error);
        Alert.alert('Error', error.message);
        return;
      }

      // Create owner staff record — using ACTUAL shop_staff columns
      const { error: staffError } = await supabase
        .from('shop_staff')
        .insert({
          shop_id: shop.id,
          user_id: ownerId,
          full_name: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'Owner',
          role_name: 'owner',
          email: userData.user.email || null,
          is_active: true,
          joined_at: new Date().toISOString(),
        });

      if (staffError) {
        console.error('[ShopCreate] Staff insert error:', staffError);
      }

      Alert.alert('Success', 'Business created successfully!', [
        {
          text: 'OK',
          onPress: () => router.push(`/(commerce)/shop/${shop.id}`),
        },
      ]);
    } catch (err: any) {
      console.error('[ShopCreate] Unexpected error:', err);
      Alert.alert('Error', err?.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Your Business</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
          placeholder="Enter business name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Business Type</Text>
        <View style={styles.typeGrid}>
          {BUSINESS_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                formData.category === type.id && styles.typeCardActive,
              ]}
              onPress={() => setFormData((prev) => ({ ...prev, category: type.id }))}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  formData.category === type.id && styles.typeLabelActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Address / Location</Text>
        <TextInput
          style={styles.input}
          value={formData.address}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, address: text }))}
          placeholder="e.g. Kitengela, Nairobi"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
          placeholder="Describe your business..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Business</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    marginBottom: 10,
  },
  typeCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F2FF',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  typeLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
