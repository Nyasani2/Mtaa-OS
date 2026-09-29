// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { pickFiles, compressVideo, uploadToStorage, saveTrackMetadata, addAdSlots, UploadItem } from '@/lib/services/studio-upload-service';
import { stripExifData } from '@/lib/services/privacy-service';
import * as ImagePicker from 'expo-image-picker';

export default function UploadCenterScreen() {
const router = useRouter();
const { user } = useAuthStore();
const [queue, setQueue] = useState<UploadItem[]>([]);
const [globalTitle, setGlobalTitle] = useState('');
const [globalGenre, setGlobalGenre] = useState('General');
const [isProcessing, setIsProcessing] = useState(false);

const handlePick = async () => {
if (queue.length >= 5) {
Alert.alert('Limit Reached', 'You can only upload 5 files at a time for long-form content.');
return;
}
const files = await pickFiles(5);
// Strip EXIF from images in the queue
const processedFiles = await Promise.all(files.map(async (item) => {
if (item.type.startsWith('image/')) {
try {
const strippedUri = await stripExifData(item.uri);
return { ...item, uri: strippedUri };
} catch (err) {
console.error('EXIF strip failed:', err);
return item;
}
}
return item;
}));
setQueue(prev => [...prev, ...processedFiles]);
};

const removeFile = (index: number) => setQueue(prev => prev.filter((_, i) => i !== index));

const startBatchUpload = async () => {
if (!user) return Alert.alert('Error', 'Not logged in');
if (queue.length === 0) return Alert.alert('Error', 'Select files first');
setIsProcessing(true);

for (let i = 0; i < queue.length; i++) {
const item = queue[i];
updateQueueStatus(i, 'compressing');
let finalUri = item.uri;
if (item.type.startsWith('video/')) finalUri = await compressVideo(item.uri);
updateQueueStatus(i, 'uploading');

try {
const url = await uploadToStorage(finalUri, item.name, user.id, 'mstudio-videos');
const adSlots = addAdSlots(0, 'medium');
await saveTrackMetadata(user.id, globalTitle || item.name, globalGenre, url, 0, adSlots);
updateQueueStatus(i, 'done');
} catch (error) {
console.error(error);
updateQueueStatus(i, 'error');
Alert.alert('Upload Failed', `Failed to upload ${item.name}`);
}
}
setIsProcessing(false);
Alert.alert('Success', 'All files processed and added to MStudio!');
router.back();
};

const updateQueueStatus = (index: number, status: UploadItem['status']) => {
setQueue(prev => prev.map((item, i) => i === index ? { ...item, status } : item));
};

return (
<View style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
<Text style={styles.headerTitle}>MStudio Upload Center</Text>
<View style={{width: 24}} />
</View>
<ScrollView contentContainerStyle={styles.content}>
<View style={styles.inputGroup}>
<Text style={styles.label}>Default Title (Optional)</Text>
<TextInput style={styles.input} value={globalTitle} onChangeText={setGlobalTitle} placeholder="e.g. My Movie Part 1" placeholderTextColor="#666" />
</View>
<View style={styles.inputGroup}>
<Text style={styles.label}>Genre / Category</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
{['General', 'Movie', 'Documentary', 'Music Video', 'Tutorial', 'Vlog'].map(g => (
<TouchableOpacity key={g} style={[styles.chip, globalGenre === g && styles.chipActive]} onPress={() => setGlobalGenre(g)}>
<Text style={[styles.chipText, globalGenre === g && styles.chipTextActive]}>{g}</Text>
</TouchableOpacity>
))}
</ScrollView>
</View>
<View style={styles.queueSection}>
<View style={styles.queueHeader}>
<Text style={styles.sectionTitle}>Upload Queue ({queue.length}/5)</Text>
<TouchableOpacity onPress={handlePick} disabled={queue.length >= 5}>
<Ionicons name="add-circle" size={28} color={queue.length >= 5 ? '#555' : '#e91e63'} />
</TouchableOpacity>
</View>
{queue.length === 0 ? (
<TouchableOpacity onPress={handlePick} style={styles.emptyState}>
<Ionicons name="videocam-outline" size={48} color="#444" />
<Text style={styles.emptyText}>Tap to select up to 5 videos</Text>
</TouchableOpacity>
) : (
queue.map((item, index) => (
<View key={index} style={styles.queueItem}>
<View style={styles.fileIcon}>
<Ionicons name={item.type.startsWith('video/') ? "videocam" : "image"} size={20} color="#fff" />
</View>
<View style={{flex: 1, marginLeft: 12}}>
<Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
<Text style={styles.fileStatus}>
{item.status === 'compressing' && 'Compressing...'}
{item.status === 'uploading' && 'Uploading...'}
{item.status === 'done' && '✓ Complete'}
{item.status === 'error' && '✗ Failed'}
{item.status === 'pending' && 'Waiting'}
</Text>
</View>
{item.status === 'pending' && <TouchableOpacity onPress={() => removeFile(index)}><Ionicons name="close-circle" size={20} color="#ef4444" /></TouchableOpacity>}
{(item.status === 'compressing' || item.status === 'uploading') && <ActivityIndicator size="small" color="#e91e63" />}
</View>
))
)}
</View>
<Text style={{ color: '#666', fontSize: 11, marginTop: 12 }}>🔒 Privacy: GPS & metadata automatically stripped from images</Text>
</ScrollView>
{queue.length > 0 && (
<View style={styles.footer}>
<TouchableOpacity onPress={startBatchUpload} disabled={isProcessing} style={[styles.uploadBtn, isProcessing && {opacity: 0.7}]}>
{isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadBtnText}>Start Upload ({queue.length})</Text>}
</TouchableOpacity>
</View>
)}
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#0a0a0a' },
header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#222' },
headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
content: { padding: 16, paddingBottom: 100 },
inputGroup: { marginBottom: 20 },
label: { color: '#888', fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
input: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333' },
chipRow: { flexDirection: 'row', marginBottom: 10 },
chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a1a', marginRight: 8, borderWidth: 1, borderColor: '#333' },
chipActive: { backgroundColor: '#e91e63', borderColor: '#e91e63' },
chipText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
chipTextActive: { color: '#fff' },
queueSection: { marginTop: 10 },
queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, borderWidth: 2, borderColor: '#333', borderStyle: 'dashed', borderRadius: 12 },
emptyText: { color: '#666', marginTop: 12, fontSize: 14 },
queueItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 10, marginBottom: 8 },
fileIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
fileName: { color: '#fff', fontSize: 14, fontWeight: '600' },
fileStatus: { color: '#888', fontSize: 12, marginTop: 2 },
footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#0a0a0a', borderTopWidth: 1, borderTopColor: '#222' },
uploadBtn: { backgroundColor: '#e91e63', padding: 16, borderRadius: 12, alignItems: 'center' },
uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
