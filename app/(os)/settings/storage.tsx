import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StorageScreen() {
  const [loading, setLoading] = useState(true);
  const [storage, setStorage] = useState({
    total: 0,
    used: 0,
    free: 0,
    appSize: 0,
    cacheSize: 0,
    mediaSize: 0,
  });

  useEffect(() => { calculate(); }, []);

  const calculate = async () => {
    setLoading(true);

    const docDir = FileSystem.documentDirectory;
    let appSize = 0;
    if (docDir) {
      const info = await FileSystem.getInfoAsync(docDir);
      appSize = info.size || 0;
    }

    const cacheDir = FileSystem.cacheDirectory;
    let cacheSize = 0;
    if (cacheDir) {
      const info = await FileSystem.getInfoAsync(cacheDir);
      cacheSize = info.size || 0;
    }

    const keys = await AsyncStorage.getAllKeys();
    const mediaSize = keys.length * 1000;

    const total = 64 * 1024 * 1024 * 1024;
    const used = appSize + cacheSize + mediaSize;
    const free = total - used;

    setStorage({ total, used, free, appSize, cacheSize, mediaSize });
    setLoading(false);
  };

  const format = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 22 }}>Storage</Text>

      {loading ? <ActivityIndicator color="#6366f1" /> : (
        <>
          <Text style={{ color: '#888' }}>Used: {format(storage.used)}</Text>
          <Text style={{ color: '#888' }}>Free: {format(storage.free)}</Text>

          <TouchableOpacity onPress={calculate} style={{ marginTop: 20 }}>
            <Text style={{ color: '#6366f1' }}>Recalculate</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: '#6366f1', marginTop: 20 }}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
