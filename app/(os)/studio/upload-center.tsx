// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Upload, X, Film } from 'lucide-react-native';
import { useStudio } from '@/domains/studio/hooks/useStudio';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['Music', 'Gaming', 'Education', 'News', 'Sports', 'Comedy', 'Tech', 'Entertainment', 'Podcast', 'Other'];

interface UploadFile {
  file: File;
  title: string;
  description: string;
  category: string;
  progress: number;
  done: boolean;
  error?: string;
}

export default function UploadCenterScreen() {
  const router = useRouter();
  const { insertVideoRecord } = useStudio();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickFiles = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/mov,video/avi';
    input.multiple = true;
    input.onchange = (e: any) => {
      const selected = Array.from(e.target.files || []) as File[];
      const mapped = selected.map((f) => ({
        file: f,
        title: f.name.replace(/\.[^/.]+$/, ''),
        description: '',
        category: 'Other',
        progress: 0,
        done: false,
      }));
      setFiles((prev) => [...prev, ...mapped].slice(0, 5));
    };
    input.click();
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFile = (idx: number, patch: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const uploadAll = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.done) continue;

      try {
        // Simulate progress
        for (let p = 0; p <= 90; p += 10) {
          updateFile(i, { progress: p });
          await new Promise((r) => setTimeout(r, 200));
        }

        // Upload to Supabase Storage
        const filePath = `videos/${Date.now()}_${item.file.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('studio-videos')
          .upload(filePath, item.file, { cacheControl: '3600', upsert: false });

        if (uploadErr) throw uploadErr;

        // Get public URL
        const { data: urlData } = supabase.storage.from('studio-videos').getPublicUrl(filePath);
        const videoUrl = urlData?.publicUrl || '';

        updateFile(i, { progress: 95 });

        // Insert into studio_videos
        const record = await insertVideoRecord({
          title: item.title,
          description: item.description,
          video_url: videoUrl,
          thumbnail_url: null, // TODO: generate thumbnail
          category: item.category,
          duration_seconds: 0, // TODO: extract duration
        });

        if (!record) throw new Error('Failed to create video record');

        updateFile(i, { progress: 100, done: true });
      } catch (e: any) {
        updateFile(i, { progress: 0, done: false, error: e.message });
      }
    }

    setUploading(false);
    // Redirect after short delay
    setTimeout(() => router.push('/(os)/studio' as any), 800);
  };

  const doneCount = files.filter((f) => f.done).length;
  const totalCount = files.length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Upload</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.counter}>{doneCount}/{totalCount} files • {doneCount} done</Text>

      {/* Drop zone */}
      {files.length < 5 && (
        <Pressable style={styles.dropZone} onPress={pickFiles}>
          <Upload size={32} color="#666" />
          <Text style={styles.dropTitle}>Add Videos</Text>
          <Text style={styles.dropSub}>Up to 5 files • MP4, MOV, AVI</Text>
        </Pressable>
      )}

      {/* File list */}
      {files.map((f, idx) => (
        <View key={idx} style={styles.fileCard}>
          <View style={styles.fileTop}>
            <View style={styles.fileThumb}>
              <Film size={20} color="#fff" />
            </View>
            <Pressable onPress={() => removeFile(idx)} style={styles.removeBtn}>
              <X size={14} color="#fff" />
            </Pressable>
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={f.title}
            onChangeText={(t) => updateFile(idx, { title: t })}
            placeholder="Enter title..."
            placeholderTextColor="#555"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={f.description}
            onChangeText={(t) => updateFile(idx, { description: t })}
            placeholder="Tell viewers about your video..."
            placeholderTextColor="#555"
            multiline
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.catChip, f.category === cat && styles.catChipActive]}
                onPress={() => updateFile(idx, { category: cat })}
              >
                <Text style={[styles.catText, f.category === cat && styles.catTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Progress */}
          {f.progress > 0 && !f.done && (
            <View style={styles.progressWrap}>
              <View style={[styles.progressBar, { width: `${f.progress}%` }]} />
              <Text style={styles.progressText}>{f.progress}%</Text>
            </View>
          )}
          {f.done && <Text style={styles.doneText}>✓ Uploaded</Text>}
          {f.error && <Text style={styles.errorText}>✗ {f.error}</Text>}
        </View>
      ))}

      {/* Upload button */}
      {files.length > 0 && (
        <Pressable
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={uploadAll}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Upload size={16} color="#fff" />
              <Text style={styles.uploadBtnText}>
                {doneCount === totalCount ? 'Upload Complete' : `Upload ${totalCount - doneCount} Video${totalCount - doneCount > 1 ? 's' : ''}`}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  counter: { color: '#888', fontSize: 11, paddingHorizontal: 16, marginBottom: 8 },
  dropZone: {
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 16,
  },
  dropTitle: { color: '#888', fontSize: 16, fontWeight: '600', marginTop: 10 },
  dropSub: { color: '#555', fontSize: 12, marginTop: 4 },
  fileCard: {
    backgroundColor: '#111',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  fileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fileThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ff0040',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { color: '#888', fontSize: 11, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  catScroll: { marginTop: 6, maxHeight: 36 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    marginRight: 6,
    height: 28,
  },
  catChipActive: { backgroundColor: '#ff0040' },
  catText: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  catTextActive: { color: '#fff' },
  progressWrap: {
    marginTop: 10,
    height: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ff0040',
    borderRadius: 10,
  },
  progressText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    zIndex: 1,
  },
  doneText: { color: '#4ade80', fontSize: 12, fontWeight: '600', marginTop: 8 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 8 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff0040',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
