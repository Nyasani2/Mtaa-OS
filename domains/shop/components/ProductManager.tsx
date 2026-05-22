import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, TextInput, StyleSheet, Alert } from 'react-native';
import { useShopProducts } from '../hooks/useShop';
import { ShopService } from '../services/shopService';

interface Props {
  shopId: string;
}

export default function ProductManager({ shopId }: Props) {
  const { products, loading, refresh } = useShopProducts(shopId);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const startEdit = (product: any) => {
    setEditing(product);
    setName(product.name || '');
    setPrice(product.price?.toString() || '');
    setStock(product.stock?.toString() || '');
  };

  const handleSave = async () => {
    const data = { name, price: parseFloat(price), stock: parseInt(stock) };
    if (editing) {
      await ShopService.updateProduct(editing.id, data);
    } else {
      await ShopService.createProduct({ ...data, shop_id: shopId });
    }
    setEditing(null);
    setName(''); setPrice(''); setStock('');
    refresh();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await ShopService.deleteProduct(id); refresh(); } }
    ]);
  };

  if (loading) return <Text>Loading products...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Products ({products.length})</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />
        <Button title={editing ? "Update" : "Add Product"} onPress={handleSave} />
        {editing && <Button title="Cancel" onPress={() => { setEditing(null); setName(''); setPrice(''); setStock(''); }} />}
      </View>
      <FlatList
        data={products}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity style={styles.card} onPress={() => startEdit(item)}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
            </View>
            <Text>Stock: {item.stock || 0}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  form: { marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 14, color: '#2e7d32', fontWeight: '600' },
  delete: { color: '#f44336', marginTop: 8 }
});
