import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

export default function ProductManager({ shopId }: { shopId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const add = () => {
    if (!name || !price) return;
    setProducts([...products, { id: Date.now(), name, price: parseFloat(price) }]);
    setName(''); setPrice('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Products</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Price" placeholderTextColor="#666" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TouchableOpacity style={styles.addBtn} onPress={add}><Text style={styles.addText}>Add</Text></TouchableOpacity>
      </View>
      <FlatList
        data={products}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowText}>{item.name}</Text>
            <Text style={styles.rowPrice}>${item.price}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  form: { gap: 10, marginBottom: 16 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 10, padding: 12 },
  addBtn: { backgroundColor: '#00d4ff', borderRadius: 10, padding: 14, alignItems: 'center' },
  addText: { color: '#000', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomColor: '#222', borderBottomWidth: 1 },
  rowText: { color: '#fff' },
  rowPrice: { color: '#00d4ff' },
});
