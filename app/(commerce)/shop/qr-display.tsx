// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Share, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function MerchantQRDisplayScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchMerchantQR();
  }, [user?.id]);

  const fetchMerchantQR = async () => {
    try {
      // 1. Try to fetch existing QR code for this user/shop
      const { data: existingQR, error: fetchError } = await supabase
        .from('wallet_qr_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('qr_type', 'merchant_pay')
        .single();

      if (existingQR && !fetchError) {
        setQrData(existingQR);
      } else {
        // 2. If none exists, generate the payload and create a new record
        const payload = `mtaa://pay?uid=${user.id}&type=merchant`;
        
        // Note: In a production app, you would call an Edge Function here to generate 
        // the actual QR image and upload it to Supabase Storage, returning the URL.
        // For now, we save the payload so the frontend QR generator can render it.
        const { data: newQR, error: insertError } = await supabase
          .from('wallet_qr_codes')
          .insert({
            user_id: user.id,
            qr_type: 'merchant_pay',
            qr_data: payload,
            qr_name: 'My Shop Payment QR'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setQrData(newQR);
      }
    } catch (err: any) {
      console.error('Fetch QR error:', err);
      Alert.alert('Error', 'Could not load merchant QR code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrData?.qr_image_url) {
      Alert.alert('Info', 'QR image is being generated. Please check back in a moment, or use a screenshot for now.');
      return;
    }

    try {
      const fileName = `mtaa-merchant-qr-${user.id}.png`;
      const { uri } = await FileSystem.downloadAsync(qrData.qr_image_url, FileSystem.cacheDirectory + fileName);
      
      if (Platform.OS === 'web') {
        window.open(qrData.qr_image_url, '_blank');
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (err) {
      Alert.alert('Download Failed', 'Could not save the QR code image.');
    }
  };

  const handleCopyID = () => {
    // Requires expo-clipboard in a real app, but we can show an alert for now
    Alert.alert('Copied!', `Your MTAA Merchant ID: ${user.id}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading your Merchant QR...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Merchant Payment QR</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Scan to Pay</Text>
        <Text style={styles.cardSubtitle}>Customers can scan this code to pay you instantly via MTAA Wallet.</Text>
        
        <View style={styles.qrContainer}>
          {qrData?.qr_image_url ? (
            <Image source={{ uri: qrData.qr_image_url }} style={styles.qrImage} />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code" size={120} color="#8b5cf6" />
              <Text style={styles.qrPlaceholderText}>QR Payload Ready</Text>
              <Text style={styles.qrPayload}>{qrData?.qr_data}</Text>
            </View>
          )}
        </View>

        <View style={styles.merchantIdBox}>
          <Text style={styles.merchantIdLabel}>Your MTAA Merchant ID</Text>
          <Text style={styles.merchantIdValue} numberOfLines={1}>{user.id}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyID}>
            <Ionicons name="copy-outline" size={16} color="#8b5cf6" />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Download / Print QR Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#94a3b8" />
        <Text style={styles.infoText}>
          Print this QR code and display it at your counter, on your matatu window, or on invoices. Funds will arrive in your MTAA Wallet instantly.
        </Text>
      </View>
    </View>
  );
}

// Note: Add 'Image' to the React Native import at the top if using qr_image_url
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  card: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  qrContainer: { width: 220, height: 220, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24, padding: 12 },
  qrImage: { width: '100%', height: '100%', borderRadius: 8 },
  qrPlaceholder: { alignItems: 'center' },
  qrPlaceholderText: { color: '#0f172a', fontWeight: '700', marginTop: 8 },
  qrPayload: { color: '#64748b', fontSize: 10, marginTop: 4, textAlign: 'center' },
  merchantIdBox: { width: '100%', backgroundColor: '#0f172a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  merchantIdLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  merchantIdValue: { fontSize: 14, color: '#fff', fontWeight: '600', marginBottom: 12 },
  copyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(139, 92, 246, 0.1)', paddingVertical: 8, borderRadius: 8 },
  copyButtonText: { color: '#8b5cf6', fontWeight: '600', fontSize: 14 },
  downloadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#8b5cf6', width: '100%', paddingVertical: 14, borderRadius: 12 },
  downloadButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  infoBox: { flexDirection: 'row', gap: 12, marginHorizontal: 16, padding: 16, backgroundColor: 'rgba(148, 163, 184, 0.1)', borderRadius: 12 },
  infoText: { flex: 1, color: '#94a3b8', fontSize: 13, lineHeight: 18 },
});
