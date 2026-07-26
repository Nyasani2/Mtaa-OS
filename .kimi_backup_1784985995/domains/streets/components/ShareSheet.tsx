import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareSheetProps {
  url: string;
  title?: string;
  message?: string;
  onClose?: () => void;
}

export function ShareSheet({ url, title, message, onClose }: ShareSheetProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        url,
        title: title || 'Check this out',
        message: message || url,
      });
    } catch (err) {
      Alert.alert('Error', 'Could not share');
    }
    onClose?.();
  };

  const handleCopy = () => {
    Alert.alert('Copied', 'Link copied to clipboard');
    onClose?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>Share</Text>
      <TouchableOpacity style={styles.option} onPress={handleShare}>
        <Ionicons name="share-outline" size={24} color="#06B6D4" />
        <Text style={styles.optionText}>Share via...</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.option} onPress={handleCopy}>
        <Ionicons name="copy-outline" size={24} color="#06B6D4" />
        <Text style={styles.optionText}>Copy Link</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  handle: { width: 40, height: 4, backgroundColor: '#334155', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center', marginBottom: 20 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  optionText: { color: '#F8FAFC', fontSize: 16, marginLeft: 12 },
  cancelBtn: { marginTop: 16, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
});
