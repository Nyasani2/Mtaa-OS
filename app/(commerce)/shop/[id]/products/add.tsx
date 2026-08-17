import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface FormData {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  barcode: string;
  category: string;
}

export default function AddProductScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    stock_quantity: '1',
    barcode: '',
    category: '',
  });

  const handleImagePick = async () => {
    // Web: use file input. Native: use ImagePicker.
    // For now, prompt for URL on web, or use a placeholder flow.
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        await uploadImage(file);
      };
      input.click();
    } else {
      Alert.alert('Coming Soon', 'Image picker for native is coming. Use web for now.');
    }
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${shopId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('shop-products')
        .getPublicUrl(filePath);

      setImages((prev) => [...prev, urlData.publicUrl]);
    } catch (err: any) {
      Alert.alert('Upload Error', err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!formData.price.trim() || isNaN(Number(formData.price))) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }

    setLoading(true);

    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          shop_id: shopId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: Number(formData.price),
          stock_quantity: Number(formData.stock_quantity) || 0,
          barcode: formData.barcode.trim() || null,
          category: formData.category.trim() || null,
          images: images.length > 0 ? images : null,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('[AddProduct] Error:', error);
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Success', 'Product added!', [
        {
          text: 'Add Another',
          onPress: () => {
            setFormData({
              name: '',
              description: '',
              price: '',
              stock_quantity: '1',
              barcode: '',
              category: '',
            });
            setImages([]);
          },
        },
        {
          text: 'View Shop',
          onPress: () => router.push(`/(commerce)/shop/${shopId}`),
        },
      ]);
    } catch (err: any) {
      console.error('[AddProduct] Unexpected error:', err);
      Alert.alert('Error', err?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add New Product</Text>

      {/* Images */}
      <View style={styles.field}>
        <Text style={styles.label}>Product Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.productImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addImageBtn} onPress={handleImagePick} disabled={uploadingImage}>
            {uploadingImage ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.addImageText}>📷 Add Photo</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
          placeholder="e.g. Wireless Headphones"
          placeholderTextColor="#999"
        />
      </View>

      {/* Category */}
      <View style={styles.field}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={formData.category}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, category: text }))}
          placeholder="e.g. Electronics"
          placeholderTextColor="#999"
        />
      </View>

      {/* Price & Stock Row */}
      <View style={styles.row}>
        <View style={[styles.field, styles.half]}>
          <Text style={styles.label}>Price (KES) *</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, price: text }))}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={[styles.field, styles.half]}>
          <Text style={styles.label}>Stock Qty</Text>
          <TextInput
            style={styles.input}
            value={formData.stock_quantity}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, stock_quantity: text }))}
            placeholder="1"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* Barcode */}
      <View style={styles.field}>
        <Text style={styles.label}>Barcode / SKU</Text>
        <View style={styles.barcodeRow}>
          <TextInput
            style={[styles.input, styles.barcodeInput]}
            value={formData.barcode}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, barcode: text }))}
            placeholder="Scan or type barcode"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.scanBtn}>
            <Text style={styles.scanBtnText}>📷 Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
          placeholder="Describe your product..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Product</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#111' },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#111', backgroundColor: '#fafafa',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  imageRow: { flexDirection: 'row' },
  imageWrapper: { marginRight: 10, position: 'relative' },
  productImage: { width: 100, height: 100, borderRadius: 10 },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#ff4444', width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  addImageBtn: {
    width: 100, height: 100, borderRadius: 10, borderWidth: 2, borderColor: '#ddd',
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa',
  },
  addImageText: { color: '#007AFF', fontSize: 13, fontWeight: '500' },
  barcodeRow: { flexDirection: 'row', gap: 8 },
  barcodeInput: { flex: 1 },
  scanBtn: {
    backgroundColor: '#007AFF', paddingHorizontal: 14, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  scanBtnText: { color: '#fff', fontWeight: '600' },
  button: {
    backgroundColor: '#007AFF', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
