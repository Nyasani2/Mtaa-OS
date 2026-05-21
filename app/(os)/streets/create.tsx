import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [contentType, setContentType] = useState<'video' | 'image' | 'text' | 'poll' | 'event' | 'ad' | 'product' | 'service' | 'live'>('video');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [audience, setAudience] = useState<'public' | 'followers' | 'private'>('public');
  const [location, setLocation] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const contentTypes = [
    { id: 'video', label: 'Video', icon: 'videocam-outline' },
    { id: 'image', label: 'Image', icon: 'image-outline' },
    { id: 'text', label: 'Text', icon: 'text-outline' },
    { id: 'poll', label: 'Poll', icon: 'bar-chart-outline' },
    { id: 'event', label: 'Event', icon: 'calendar-outline' },
    { id: 'ad', label: 'Ad', icon: 'megaphone-outline' },
    { id: 'product', label: 'Product', icon: 'cart-outline' },
    { id: 'service', label: 'Service', icon: 'construct-outline' },
    { id: 'live', label: 'Go Live', icon: 'radio-outline' },
  ];

  const requestCamera = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: contentType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setMedia(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setMedia(prev => [...prev, photo.uri]);
        setShowCamera(false);
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      setRecordingDuration(0);
      const interval = setInterval(() => setRecordingDuration(d => d + 1), 1000);

      try {
        const video = await cameraRef.current.recordAsync();
        clearInterval(interval);
        if (video) {
          setMedia(prev => [...prev, video.uri]);
        }
      } catch (err) {
        console.error('Recording error:', err);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const handlePublish = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create content');
      return;
    }

    if (contentType === 'live') {
      router.push('/streets/live/start');
      return;
    }

    if (contentType !== 'text' && media.length === 0) {
      Alert.alert('Media Required', 'Please add at least one photo or video');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Caption Required', 'Please add a caption');
      return;
    }

    setLoading(true);
    try {
      // Upload media to storage
      const uploadedUrls: string[] = [];
      for (const uri of media) {
        const filename = uri.split('/').pop() || `${Date.now()}`;
        const { data, error } = await supabase.storage
          .from('street-content')
          .upload(`${user.id}/${Date.now()}_${filename}`, { uri, type: contentType === 'video' ? 'video/mp4' : 'image/jpeg' } as any);

        if (error) throw error;
        const { data: urlData } = supabase.storage.from('street-content').getPublicUrl(data.path);
        uploadedUrls.push(urlData.publicUrl);
      }

      // Insert content
      const tagArray = hashtags
        .split(/[#,\s]+/)
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const { data: content, error: insertError } = await supabase
        .from('street_content')
        .insert({
          user_id: user.id,
          content_type: contentType,
          media_urls: uploadedUrls,
          caption: caption.trim(),
          hashtags: tagArray,
          is_sponsored: contentType === 'ad',
          product_id: selectedProduct,
          job_id: selectedJob,
          location: location || null,
          audience,
          scheduled_at: scheduleDate,
          status: scheduleDate ? 'scheduled' : 'published',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update hashtag counts
      for (const tag of tagArray) {
        await supabase.rpc('increment_hashtag', { tag_name: tag });
      }

      Alert.alert('Published!', 'Your content is live on MTAA Streets.', [
        { text: 'View', onPress: () => router.push(`/streets/feed?contentId=${content.id}`) },
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    await supabase.from('street_drafts').insert({
      user_id: user?.id,
      content_type: contentType,
      media_urls: media,
      caption,
      hashtags: hashtags.split(/[#,\s]+/).filter(t => t),
    });
    Alert.alert('Saved', 'Draft saved successfully');
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          flash={flashMode}
          mode="video"
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity onPress={() => setShowCamera(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}>
              <Ionicons name={flashMode === 'on' ? 'flash' : 'flash-off'} size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCameraFacing(cameraFacing === 'back' ? 'front' : 'back')}>
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraBottom}>
            {contentType === 'video' ? (
              <TouchableOpacity
                style={[styles.recordBtn, isRecording && styles.recordingBtn]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
              >
                <View style={[styles.recordInner, isRecording && styles.recordingInner]} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#0f172a" />
              </TouchableOpacity>
            )}
            {isRecording && (
              <Text style={styles.timerText}>{recordingDuration}s</Text>
            )}
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create</Text>
        <TouchableOpacity onPress={handlePublish} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#3b82f6" />
          ) : (
            <Text style={styles.publishBtn}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Content Type Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
          contentContainerStyle={styles.typeContent}
        >
          {contentTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeBtn, contentType === type.id && styles.typeBtnActive]}
              onPress={() => setContentType(type.id as any)}
            >
              <Ionicons
                name={type.icon as any}
                size={20}
                color={contentType === type.id ? '#fff' : '#94a3b8'}
              />
              <Text style={[styles.typeText, contentType === type.id && styles.typeTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Media Capture */}
        {contentType !== 'text' && (
          <View style={styles.mediaSection}>
            <View style={styles.mediaActions}>
              <TouchableOpacity style={styles.mediaAction} onPress={requestCamera}>
                <Ionicons name="camera-outline" size={28} color="#3b82f6" />
                <Text style={styles.mediaActionText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaAction} onPress={pickFromGallery}>
                <Ionicons name="images-outline" size={28} color="#3b82f6" />
                <Text style={styles.mediaActionText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaAction} onPress={() => setMedia([])}>
                <Ionicons name="trash-outline" size={28} color="#ef4444" />
                <Text style={[styles.mediaActionText, { color: '#ef4444' }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Media Preview */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {media.map((uri, i) => (
                <View key={i} style={styles.mediaPreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeMedia}
                    onPress={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Caption</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#475569"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{caption.length}/500</Text>
        </View>

        {/* Hashtags */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Hashtags</Text>
          <TextInput
            style={styles.input}
            placeholder="#africa #tech #business"
            placeholderTextColor="#475569"
            value={hashtags}
            onChangeText={setHashtags}
          />
        </View>

        {/* Location */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Location</Text>
          <TouchableOpacity style={styles.locationBtn} onPress={() => setLocation('Nairobi, Kenya')}>
            <Ionicons name="location-outline" size={18} color="#94a3b8" />
            <Text style={styles.locationText}>{location || 'Add location'}</Text>
          </TouchableOpacity>
        </View>

        {/* Audience */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Audience</Text>
          <View style={styles.audienceRow}>
            {(['public', 'followers', 'private'] as const).map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.audienceBtn, audience === a && styles.audienceBtnActive]}
                onPress={() => setAudience(a)}
              >
                <Ionicons
                  name={a === 'public' ? 'globe-outline' : a === 'followers' ? 'people-outline' : 'lock-closed-outline'}
                  size={16}
                  color={audience === a ? '#fff' : '#94a3b8'}
                />
                <Text style={[styles.audienceText, audience === a && styles.audienceTextActive]}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Attachments */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Attach</Text>
          <View style={styles.attachRow}>
            <TouchableOpacity style={styles.attachBtn} onPress={() => router.push('/shop?select=true')}>
              <Ionicons name="cart-outline" size={18} color="#3b82f6" />
              <Text style={styles.attachText}>Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={() => router.push('/shop?select=true&type=shop')}>
              <Ionicons name="storefront-outline" size={18} color="#3b82f6" />
              <Text style={styles.attachText}>Shop Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={() => router.push('/jobs?select=true')}>
              <Ionicons name="briefcase-outline" size={18} color="#3b82f6" />
              <Text style={styles.attachText}>Job</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachBtn} onPress={() => router.push('/events?select=true')}>
              <Ionicons name="calendar-outline" size={18} color="#3b82f6" />
              <Text style={styles.attachText}>Event</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Tip */}
        <TouchableOpacity style={styles.walletTip} onPress={() => router.push('/wallet/tip-setup')}>
          <Ionicons name="wallet-outline" size={20} color="#f59e0b" />
          <Text style={styles.walletTipText}>Enable tips on this post</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft}>
            <Ionicons name="save-outline" size={18} color="#94a3b8" />
            <Text style={styles.draftText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.scheduleBtn} onPress={() => Alert.alert('Schedule', 'Coming soon')}>
            <Ionicons name="time-outline" size={18} color="#94a3b8" />
            <Text style={styles.scheduleText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  publishBtn: { fontSize: 16, fontWeight: '700', color: '#3b82f6' },
  typeScroll: { marginTop: 12 },
  typeContent: { paddingHorizontal: 16, gap: 10 },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  typeBtnActive: { backgroundColor: '#3b82f6' },
  typeText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  typeTextActive: { color: '#fff' },
  mediaSection: { padding: 16 },
  mediaActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mediaAction: { alignItems: 'center', gap: 4 },
  mediaActionText: { fontSize: 12, color: '#94a3b8' },
  mediaPreview: {
    width: 100,
    height: 140,
    borderRadius: 8,
    marginRight: 8,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  previewImage: { width: '100%', height: '100%' },
  removeMedia: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
  },
  inputSection: { paddingHorizontal: 16, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  captionInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  charCount: { fontSize: 12, color: '#64748b', textAlign: 'right', marginTop: 4 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  locationText: { fontSize: 15, color: '#94a3b8' },
  audienceRow: { flexDirection: 'row', gap: 10 },
  audienceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  audienceBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  audienceText: { fontSize: 13, color: '#94a3b8' },
  audienceTextActive: { color: '#fff' },
  attachRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  attachText: { fontSize: 13, color: '#94a3b8' },
  walletTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f59e0b40',
    marginBottom: 20,
  },
  walletTipText: { flex: 1, fontSize: 14, color: '#f8fafc', fontWeight: '500' },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  draftBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  draftText: { fontSize: 14, color: '#94a3b8' },
  scheduleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleText: { fontSize: 14, color: '#94a3b8' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  cameraBottom: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordingBtn: { borderColor: '#ef4444' },
  recordInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
  },
  recordingInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '700',
    marginTop: 12,
  },
});
