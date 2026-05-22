import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { usePOSSession } from '../hooks/useShop';
import { ShopService } from '../services/shopService';
import { shopCreateOrder } from '../services/shop-create-order';

interface Props {
  shopId: string;
  cashierId: string;
}

export default function POSScreen({ shopId, cashierId }: Props) {
  const { session, loading, openSession, closeSession } = usePOSSession(shopId);
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<Array<{ product: any; quantity: number }>>([]);
  const [scanError, setScanError] = useState('');

  const handleScan = async () => {
    setScanError('');
    try {
      const product = await ShopService.getProductByBarcode(shopId, barcode);
      if (!product) {
        setScanError('Product not found');
        return;
      }
      const existing = cart.find((c) => c.product.id === product.id);
      if (existing) {
        setCart(cart.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      } else {
        setCart([...cart, { product, quantity: 1 }]);
      }
      setBarcode('');
    } catch (e: any) {
      setScanError(e.message);
    }
  };

  const handleCheckout = async () => {
    if (!session || cart.length === 0) return;
    const items = cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity, price: c.product.price }));
    const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
    await shopCreateOrder({
      shop_id: shopId,
      customer_id: cashierId,
      items,
      total_amount: total
    });
    setCart([]);
  };

  if (loading) return <Text>Loading POS...</Text>;

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>POS Closed</Text>
        <Button title="Open Session" onPress={() => openSession(cashierId)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>POS Active</Text>
        <Button title="Close" onPress={closeSession} />
      </View>
      <View style={styles.scanRow}>
        <TextInput style={styles.input} value={barcode} onChangeText={setBarcode} placeholder="Scan barcode..." />
        <Button title="Add" onPress={handleScan} />
      </View>
      {scanError ? <Text style={styles.error}>{scanError}</Text> : null}
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Text>{item.product.name}</Text>
            <Text>Qty: {item.quantity}</Text>
            <Text>${(item.product.price * item.quantity).toFixed(2)}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${cart.reduce((s, c) => s + c.product.price * c.quantity, 0).toFixed(2)}</Text>
        <Button title="Checkout" onPress={handleCheckout} disabled={cart.length === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  scanRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8 },
  error: { color: '#f44336', marginBottom: 8 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  footer: { marginTop: 16, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#eee' },
  total: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 }
});
