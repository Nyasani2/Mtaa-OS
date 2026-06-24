import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface BusinessProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  stock: number;
  status: 'active' | 'draft' | 'sold_out';
  created_at: string;
}

interface BusinessOrder {
  id: string;
  buyer_name: string;
  product_name: string;
  amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  created_at: string;
}

export default function BusinessScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'campaigns'>('products');
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [orders, setOrders] = useState<BusinessOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [productsRes, ordersRes] = await Promise.all([
        supabase.from('streets_products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('streets_orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      ]);

      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (e) {
      console.error('Business error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const refresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const renderProduct = ({ item }: { item: BusinessProduct }) => (
    <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', alignItems: 'center' }}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={{ width: 60, height: 60, borderRadius: 8 }} />
      ) : (
        <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="cube" size={24} color="#666" />
        </View>
      )}
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
        <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }} numberOfLines={1}>{item.description}</Text>
        <View style={{ flexDirection: 'row', marginTop: 4, gap: 12 }}>
          <Text style={{ color: '#00ff88', fontSize: 13, fontWeight: '700' }}>${item.price.toFixed(2)}</Text>
          <Text style={{ color: '#666', fontSize: 12 }}>Stock: {item.stock}</Text>
          <Text style={{ color: item.status === 'active' ? '#00d4ff' : '#ff3040', fontSize: 12 }}>{item.status}</Text>
        </View>
      </View>
    </View>
  );

  const renderOrder = ({ item }: { item: BusinessOrder }) => (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{item.product_name}</Text>
        <Text style={{ color: '#00ff88', fontWeight: '700' }}>${item.amount.toFixed(2)}</Text>
      </View>
      <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Buyer: {item.buyer_name}</Text>
      <View style={{ flexDirection: 'row', marginTop: 4, gap: 8 }}>
        <View style={{ backgroundColor: item.status === 'delivered' ? '#00ff8820' : item.status === 'paid' ? '#00d4ff20' : '#ffaa0020', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ color: item.status === 'delivered' ? '#00ff88' : item.status === 'paid' ? '#00d4ff' : '#ffaa00', fontSize: 11, fontWeight: '600' }}>{item.status}</Text>
        </View>
        <Text style={{ color: '#666', fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Business Center</Text>
      </View>

      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', marginHorizontal: 16 }}>
        {(['products', 'orders', 'campaigns'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: '#00d4ff' }}
          >
            <Text style={{ color: activeTab === tab ? '#00d4ff' : '#888', fontSize: 15, fontWeight: activeTab === tab ? '700' : '400' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'products' && (
        <>
          <TouchableOpacity
            onPress={() => setShowAddProduct(true)}
            style={{ backgroundColor: '#00d4ff', borderRadius: 24, paddingVertical: 14, margin: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="add" size={20} color="#000" />
            <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>Add Product</Text>
          </TouchableOpacity>
          <FlatList
            data={products}
            keyExtractor={p => p.id}
            renderItem={renderProduct}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
            ListEmptyComponent={!loading ? (
              <View style={{ paddingTop: 40, alignItems: 'center' }}>
                <Ionicons name="cube" size={48} color="#333" />
                <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No products yet</Text>
              </View>
            ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
          />
        </>
      )}

      {activeTab === 'orders' && (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          renderItem={renderOrder}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
          ListEmptyComponent={!loading ? (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
              <Ionicons name="receipt" size={48} color="#333" />
              <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No orders yet</Text>
            </View>
          ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
        />
      )}

      {activeTab === 'campaigns' && (
        <View style={{ padding: 16 }}>
          <TouchableOpacity style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sponsored Post</Text>
            <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Boost a post to reach more people</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Affiliate Program</Text>
            <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Earn commission sharing products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Subscription Tiers</Text>
            <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Offer exclusive content to subscribers</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
