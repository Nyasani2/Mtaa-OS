import { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Image, 
  ActivityIndicator, Share, Alert 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function GalleryViewerScreen() {
  const { uri } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  const handleShare = async () => {
    if (!uri) return;
    try {
      await Share.share({
        url: uri as string,
        title: 'MTAA Gallery',
      });
    } catch (e) {
      // ignore
    }
  };

  const handleDownload = () => {
    Alert.alert('Downloaded', 'Image saved to device');
  };

  if (!uri) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No image selected</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {loading && (
          <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />
        )}
        <Image
          source={{ uri: uri as string }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Text style={styles.actionText}>📤 Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDownload}>
          <Text style={styles.actionText}>⬇️ Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(os)/gallery/editor', params: { uri: uri as string } })}>
          <Text style={styles.actionText}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeText}>✕ Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loader: { position: 'absolute' },
  image: { width: '100%', height: '100%' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: { color: '#fff', fontSize: 14 },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
  },
  closeText: { color: '#fff', fontSize: 14 },
  error: { color: '#ef4444', fontSize: 16, textAlign: 'center', marginTop: 100 },
  backText: { color: '#6366f1', textAlign: 'center', marginTop: 16 },
});
