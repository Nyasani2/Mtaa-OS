// domains/shop/components/ProductManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  barcode?: string;
  shop_id: string;
}

interface Props {
  shopId: string;
}

export default function ProductManager({ shopId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', barcode: '' });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').eq('shop_id', shopId);
    if (!error && data) setProducts(data as Product[]);
    setLoading(false);
  }, [shopId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', stock: '', barcode: '' });
    setEditing(null);
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock || '0', 10),
      barcode: form.barcode.trim() || null,
      shop_id: shopId,
    };
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) Alert.alert('Error', error.message);
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) Alert.alert('Error', error.message);
    }
    resetForm();
    loadProducts();
  };

  const editProduct = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price.toString(),
      stock: p.stock.toString(),
      barcode: p.barcode || '',
    });
  };

  const deleteProduct = async (id: string) => {
    Alert.alert('Confirm', 'Delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else loadProducts();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{editing ? 'Edit Product' : 'New Product'}</Text>
      <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#888" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
      <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#888" value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
      <TextInput style={styles.input} placeholder="Price" placeholderTextColor="#888" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Stock" placeholderTextColor="#888" value={form.stock} onChangeText={(t) => setForm({ ...form, stock: t })} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Barcode" placeholderTextColor="#888" value={form.barcode} onChangeText={(t) => setForm({ ...form, barcode: t })} />
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={saveProduct}>
          <Text style={styles.btnText}>{editing ? 'Update' : 'Create'}</Text>
        </TouchableOpacity>
        {editing && (
          <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={resetForm}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading && <Text style={styles.loading}>Loading...</Text>}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>KES {item.price?.toLocaleString()}</Text>
            </View>
            <Text style={styles.stock}>Stock: {item.stock}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => editProduct(item)}><Text style={styles.action}>Edit</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => deleteProduct(item.id)}><Text style={[styles.action, styles.danger]}>Delete</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  header: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: '#1f1f1f', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  btn: { flex: 1, backgroundColor: '#10B981', borderRadius: 8, padding: 12, alignItems: 'center' },
  cancel: { backgroundColor: '#333' },
  btnText: { color: '#fff', fontWeight: '600' },
  loading: { color: '#888', textAlign: 'center', marginVertical: 8 },
  card: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  price: { color: '#10B981', fontWeight: '700' },
  stock: { color: '#888', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  action: { color: '#3B82F6', fontWeight: '600' },
  danger: { color: '#EF4444' },
});
