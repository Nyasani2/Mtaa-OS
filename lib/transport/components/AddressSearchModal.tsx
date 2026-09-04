import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { geocodeAddress, GeocodeResult } from '@/lib/transport/services/geocode.service';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: GeocodeResult) => void;
  title?: string;
  initialQuery?: string;
}

export default function AddressSearchModal({ visible, onClose, onSelect, title = 'Search Address', initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) { setQuery(initialQuery); setResults([]); setError(null); }
  }, [visible, initialQuery]);

  const search = useCallback(async () => {
    if (!query.trim() || query.trim().length < 3) return;
    setLoading(true); setError(null);
    try {
      const res = await geocodeAddress(query.trim());
      setResults(res);
      if (res.length === 0) setError('No results found');
    } catch (err: any) { setError(err.message || 'Search failed'); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => { if (query.trim().length >= 3) search(); }, 600);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (item: GeocodeResult) => { onSelect(item); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput style={styles.input} placeholder="Enter address..." placeholderTextColor="#64748b" value={query} onChangeText={setQuery} autoFocus />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} />}
        {error && !loading && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <FlatList
          data={results}
          keyExtractor={(item) => item.placeId}
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
              <Ionicons name="location" size={18} color="#3b82f6" />
              <View style={styles.resultText}>
                <Text style={styles.resultAddress} numberOfLines={2}>{item.address}</Text>
                <Text style={styles.resultCoords}>{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading && query.length < 3 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="map" size={40} color="#334155" />
                <Text style={styles.emptyText}>Type at least 3 characters to search</Text>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', margin: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  input: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 10 },
  errorBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  errorText: { color: '#ef4444', fontSize: 13 },
  resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a' },
  resultText: { flex: 1, marginLeft: 10 },
  resultAddress: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultCoords: { color: '#64748b', fontSize: 11, marginTop: 2 },
  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', marginTop: 12, fontSize: 14 },
});
